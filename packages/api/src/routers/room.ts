import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, managerProcedure } from "../trpc"
import type { RoomStatus } from "@hotel/db"

const roomStatusEnum = z.enum([
  "CLEAN",
  "DIRTY",
  "CLEANING",
  "INSPECTED",
  "OCCUPIED",
  "MAINTENANCE",
  "RESERVED",
])

// Valid manual transitions enforced server-side
const ALLOWED_TRANSITIONS: Record<RoomStatus, RoomStatus[]> = {
  DIRTY:       ["CLEANING", "CLEAN", "MAINTENANCE"],
  CLEANING:    ["CLEAN", "INSPECTED", "DIRTY"],
  CLEAN:       ["DIRTY", "MAINTENANCE", "INSPECTED"],
  INSPECTED:   ["DIRTY", "CLEAN", "MAINTENANCE"],
  MAINTENANCE: ["DIRTY", "CLEAN"],
  OCCUPIED:    ["DIRTY", "MAINTENANCE"],
  RESERVED:    ["DIRTY", "CLEAN"],
}

function emitRoomStatusChanged(
  propertyId: string,
  roomId: string,
  roomNumber: string,
  oldStatus: RoomStatus,
  newStatus: RoomStatus,
): void {
  const staffIO = (global as Record<string, unknown>)["staffIO"] as
    | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
    | undefined
  staffIO?.to(`property:${propertyId}`).emit("room:statusChanged", {
    roomId,
    roomNumber,
    oldStatus,
    newStatus,
    propertyId,
    timestamp: Date.now(),
  })
}

export const roomRouter = router({
  list: managerProcedure
    .input(
      z
        .object({
          status: roomStatusEnum.optional(),
          isActive: z.boolean().optional(),
          floor: z.number().int().min(0).optional(),
          roomTypeId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      return ctx.db.room.findMany({
        where: {
          propertyId: ctx.propertyId,
          ...(input?.status !== undefined ? { status: input.status } : {}),
          ...(input?.isActive !== undefined ? { isActive: input.isActive } : {}),
          ...(input?.floor !== undefined ? { floor: input.floor } : {}),
          ...(input?.roomTypeId !== undefined ? { roomTypeId: input.roomTypeId } : {}),
        },
        include: {
          roomType: { select: { id: true, name: true, slug: true } },
        },
        orderBy: [{ floor: "asc" }, { number: "asc" }],
      })
    }),

  create: managerProcedure
    .input(
      z.object({
        number: z.string().min(1).max(20),
        floor: z.number().int().min(0),
        roomTypeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const roomType = await ctx.db.roomType.findFirst({
        where: { id: input.roomTypeId, propertyId: ctx.propertyId },
      })
      if (!roomType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      }

      const existingRoom = await ctx.db.room.findUnique({
        where: { propertyId_number: { propertyId: ctx.propertyId, number: input.number } },
      })
      if (existingRoom) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Room number "${input.number}" already exists`,
        })
      }

      const room = await ctx.db.room.create({
        data: {
          propertyId: ctx.propertyId,
          number: input.number,
          floor: input.floor,
          roomTypeId: input.roomTypeId,
        },
        include: { roomType: { select: { id: true, name: true } } },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: room.id,
          action: "CREATE",
          changes: { number: input.number, floor: input.floor, roomTypeId: input.roomTypeId },
        },
      })

      return room
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        number: z.string().min(1).max(20).optional(),
        floor: z.number().int().min(0).optional(),
        roomTypeId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input

      const room = await ctx.db.room.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }

      if (data.number && data.number !== room.number) {
        const conflict = await ctx.db.room.findUnique({
          where: { propertyId_number: { propertyId: ctx.propertyId, number: data.number } },
        })
        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `Room number "${data.number}" already exists`,
          })
        }
      }

      if (data.roomTypeId) {
        const roomType = await ctx.db.roomType.findFirst({
          where: { id: data.roomTypeId, propertyId: ctx.propertyId },
        })
        if (!roomType) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
        }
      }

      const updated = await ctx.db.room.update({
        where: { id },
        data,
        include: { roomType: { select: { id: true, name: true } } },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(data)),
        },
      })

      return updated
    }),

  toggleActive: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const room = await ctx.db.room.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }

      const updated = await ctx.db.room.update({
        where: { id: input.id },
        data: { isActive: !room.isActive },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: input.id,
          action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
          changes: { isActive: updated.isActive },
        },
      })

      return updated
    }),

  bulkCreate: managerProcedure
    .input(
      z.object({
        rooms: z
          .array(
            z.object({
              number: z.string().min(1).max(20),
              floor: z.number().int().min(0),
              roomTypeId: z.string(),
            })
          )
          .min(1)
          .max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const roomTypeIds = [...new Set(input.rooms.map((r) => r.roomTypeId))]
      const validRoomTypes = await ctx.db.roomType.findMany({
        where: { id: { in: roomTypeIds }, propertyId: ctx.propertyId },
        select: { id: true },
      })
      if (validRoomTypes.length !== roomTypeIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more room types not found for this property",
        })
      }

      const numbers = input.rooms.map((r) => r.number)
      if (new Set(numbers).size !== numbers.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Duplicate room numbers in batch" })
      }

      const existing = await ctx.db.room.findMany({
        where: { propertyId: ctx.propertyId, number: { in: numbers } },
        select: { number: true },
      })
      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Room numbers already exist: ${existing.map((r) => r.number).join(", ")}`,
        })
      }

      const result = await ctx.db.room.createMany({
        data: input.rooms.map((r) => ({
          propertyId: ctx.propertyId!,
          number: r.number,
          floor: r.floor,
          roomTypeId: r.roomTypeId,
        })),
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: ctx.propertyId,
          action: "BULK_CREATE",
          changes: { count: result.count, numbers },
        },
      })

      return { count: result.count }
    }),

  // ─── E2-S6: Room assignment & status management ───────────────────────────

  assign: staffProcedure
    .input(
      z.object({
        bookingId: z.string(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { bookingId, roomId } = input

      // Validate booking belongs to property and is assignable
      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId! },
        select: { id: true, status: true, roomTypeId: true },
      })
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      }
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only CONFIRMED bookings can have rooms assigned",
        })
      }

      // Validate room belongs to property and is active
      const room = await ctx.db.room.findFirst({
        where: { id: roomId, propertyId: ctx.propertyId!, isActive: true },
        select: { id: true, number: true, status: true, roomTypeId: true, version: true },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }
      if (room.status !== "CLEAN" && room.status !== "INSPECTED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Room must be CLEAN or INSPECTED to assign (current: ${room.status})`,
        })
      }
      if (room.roomTypeId !== booking.roomTypeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Room type does not match booking",
        })
      }

      // Check this room isn't already assigned to this booking
      const existingLink = await ctx.db.bookingRoom.findUnique({
        where: { bookingId_roomId: { bookingId, roomId } },
      })
      if (existingLink) {
        throw new TRPCError({ code: "CONFLICT", message: "Room already assigned to this booking" })
      }

      const capturedVersion = room.version

      // Optimistic locking: only one concurrent assign wins
      await ctx.db.$transaction(async (tx) => {
        const locked = await tx.room.findFirst({
          where: { id: roomId, version: capturedVersion },
          select: { id: true },
        })
        if (!locked) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Phòng vừa được assign cho booking khác",
          })
        }

        await tx.bookingRoom.create({
          data: { bookingId, roomId, assignedById: ctx.auth.staffId },
        })

        await tx.room.update({
          where: { id: roomId },
          data: { status: "RESERVED", version: { increment: 1 } },
        })

        await tx.roomStatusLog.create({
          data: {
            roomId,
            oldStatus: room.status,
            newStatus: "RESERVED",
            staffId: ctx.auth.staffId,
            note: `Assigned to booking ${bookingId}`,
          },
        })
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: roomId,
          action: "ASSIGN",
          changes: { bookingId, previousStatus: room.status },
        },
      })

      emitRoomStatusChanged(ctx.propertyId!, roomId, room.number, room.status, "RESERVED")

      return { roomId, bookingId, newStatus: "RESERVED" as const }
    }),

  updateStatus: staffProcedure
    .input(
      z.object({
        roomId: z.string(),
        newStatus: roomStatusEnum,
        note: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { roomId, newStatus, note } = input

      const room = await ctx.db.room.findFirst({
        where: { id: roomId, propertyId: ctx.propertyId! },
        select: { id: true, number: true, status: true },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }

      const allowed = ALLOWED_TRANSITIONS[room.status as RoomStatus] ?? []
      if (!allowed.includes(newStatus as RoomStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition room from ${room.status} to ${newStatus}`,
        })
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.room.update({
          where: { id: roomId },
          data: {
            status: newStatus as RoomStatus,
            version: { increment: 1 },
            // Track when cleaning begins; clear it when leaving CLEANING
            ...(newStatus === "CLEANING" ? { cleaningStartAt: new Date() } : {}),
            ...(room.status === "CLEANING" && newStatus !== "CLEANING"
              ? { cleaningStartAt: null }
              : {}),
          },
        })

        await tx.roomStatusLog.create({
          data: {
            roomId,
            oldStatus: room.status as RoomStatus,
            newStatus: newStatus as RoomStatus,
            staffId: ctx.auth.staffId,
            note: note ?? null,
          },
        })
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: roomId,
          action: "STATUS_CHANGE",
          changes: JSON.parse(JSON.stringify({ oldStatus: room.status, newStatus, note })),
        },
      })

      emitRoomStatusChanged(
        ctx.propertyId!,
        roomId,
        room.number,
        room.status as RoomStatus,
        newStatus as RoomStatus,
      )

      return { roomId, oldStatus: room.status, newStatus }
    }),

  setMaintenance: staffProcedure
    .input(
      z.object({
        roomId: z.string(),
        note: z.string().min(1).max(1000),
        estimatedDoneAt: z.string().datetime({ offset: true }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { roomId, note, estimatedDoneAt } = input

      const room = await ctx.db.room.findFirst({
        where: { id: roomId, propertyId: ctx.propertyId! },
        select: { id: true, number: true, status: true },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }
      if (room.status === "OCCUPIED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot set an occupied room to maintenance",
        })
      }

      const doneAt = new Date(estimatedDoneAt)

      await ctx.db.$transaction(async (tx) => {
        await tx.room.update({
          where: { id: roomId },
          data: {
            status: "MAINTENANCE",
            maintenanceNote: note,
            maintenanceDue: doneAt,
            version: { increment: 1 },
          },
        })

        await tx.roomStatusLog.create({
          data: {
            roomId,
            oldStatus: room.status as RoomStatus,
            newStatus: "MAINTENANCE",
            staffId: ctx.auth.staffId,
            note,
          },
        })
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: roomId,
          action: "MAINTENANCE",
          changes: { previousStatus: room.status, note, estimatedDoneAt },
        },
      })

      emitRoomStatusChanged(ctx.propertyId!, roomId, room.number, room.status as RoomStatus, "MAINTENANCE")

      return { roomId, newStatus: "MAINTENANCE" as const, estimatedDoneAt: doneAt }
    }),

  // ─── E3-S4: Room management page — view all rooms with booking info ───────────

  listForView: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.room.findMany({
      where: { propertyId: ctx.propertyId, isActive: true },
      include: {
        roomType: { select: { id: true, name: true } },
        bookingRooms: {
          where: {
            booking: { status: { in: ["CONFIRMED", "CHECKED_IN"] } },
          },
          select: {
            booking: {
              select: {
                id: true,
                confirmationCode: true,
                status: true,
                checkInDate: true,
                checkOutDate: true,
                guest: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    })
  }),

  getHistory: staffProcedure
    .input(z.object({ roomId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const room = await ctx.db.room.findFirst({
        where: { id: input.roomId, propertyId: ctx.propertyId },
        select: { id: true },
      })
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return ctx.db.roomStatusLog.findMany({
        where: { roomId: input.roomId, createdAt: { gte: thirtyDaysAgo } },
        include: {
          staff: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    }),

  // ─── E3-S3: Available rooms for booking assignment ───────────────────────────

  availableForBooking: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: { id: input.bookingId, propertyId: ctx.propertyId! },
        select: { roomTypeId: true },
      })
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })

      return ctx.db.room.findMany({
        where: {
          propertyId: ctx.propertyId!,
          roomTypeId: booking.roomTypeId,
          status: { in: ["CLEAN", "INSPECTED"] },
          isActive: true,
        },
        select: { id: true, number: true, floor: true, status: true },
        orderBy: [{ floor: "asc" }, { number: "asc" }],
      })
    }),

  unassign: staffProcedure
    .input(
      z.object({
        bookingId: z.string(),
        roomId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { bookingId, roomId } = input

      // Validate booking is still CONFIRMED (not yet checked in)
      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId! },
        select: { id: true, status: true },
      })
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      }
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only unassign rooms from CONFIRMED bookings",
        })
      }

      // Validate the BookingRoom link exists
      const link = await ctx.db.bookingRoom.findUnique({
        where: { bookingId_roomId: { bookingId, roomId } },
      })
      if (!link) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room is not assigned to this booking" })
      }

      const room = await ctx.db.room.findFirst({
        where: { id: roomId, propertyId: ctx.propertyId! },
        select: { id: true, number: true, status: true },
      })
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })
      }

      await ctx.db.$transaction(async (tx) => {
        await tx.bookingRoom.delete({
          where: { bookingId_roomId: { bookingId, roomId } },
        })

        await tx.room.update({
          where: { id: roomId },
          data: { status: "CLEAN", version: { increment: 1 } },
        })

        await tx.roomStatusLog.create({
          data: {
            roomId,
            oldStatus: room.status as RoomStatus,
            newStatus: "CLEAN",
            staffId: ctx.auth.staffId,
            note: `Unassigned from booking ${bookingId}`,
          },
        })
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: roomId,
          action: "UNASSIGN",
          changes: { bookingId, previousStatus: room.status },
        },
      })

      emitRoomStatusChanged(ctx.propertyId!, roomId, room.number, room.status as RoomStatus, "CLEAN")

      return { roomId, bookingId, newStatus: "CLEAN" as const }
    }),

  // ─── E3-S5: Housekeeping Kanban ──────────────────────────────────────────────

  listForHousekeeping: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }

    const property = await ctx.db.property.findFirst({
      where: { id: ctx.propertyId },
      select: { checkInHour: true },
    })
    const checkInHour = property?.checkInHour ?? 14

    const isHousekeeping = ctx.auth.role === "HOUSEKEEPING"

    const rooms = await ctx.db.room.findMany({
      where: {
        propertyId: ctx.propertyId,
        isActive: true,
        status: { in: ["DIRTY", "CLEANING", "CLEAN", "INSPECTED"] },
        ...(isHousekeeping ? { assignedToId: ctx.auth.staffId } : {}),
      },
      include: {
        roomType: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        bookingRooms: {
          where: { booking: { status: "CONFIRMED" } },
          orderBy: { booking: { checkInDate: "asc" } },
          select: { booking: { select: { checkInDate: true } } },
          take: 1,
        },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    })

    return { rooms, checkInHour }
  }),

  assignHousekeeping: staffProcedure
    .input(
      z.object({
        roomId: z.string(),
        staffId: z.string().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const canAssign = ["MANAGER", "ADMIN", "FRONT_DESK"].includes(ctx.auth.role)
      if (!canAssign) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Manager and Front Desk can assign housekeeping staff",
        })
      }

      const room = await ctx.db.room.findFirst({
        where: { id: input.roomId, propertyId: ctx.propertyId },
        select: { id: true, number: true },
      })
      if (!room) throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" })

      if (input.staffId) {
        const hkStaff = await ctx.db.staff.findFirst({
          where: {
            id: input.staffId,
            propertyId: ctx.propertyId,
            role: "HOUSEKEEPING",
            isActive: true,
          },
          select: { id: true },
        })
        if (!hkStaff) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Housekeeping staff not found" })
        }
      }

      await ctx.db.room.update({
        where: { id: input.roomId },
        data: { assignedToId: input.staffId },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Room",
          entityId: input.roomId,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify({ assignedToId: input.staffId })),
        },
      })

      return { roomId: input.roomId, assignedToId: input.staffId }
    }),
})
