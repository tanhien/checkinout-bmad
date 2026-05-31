import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { randomBytes } from "crypto"
import { router, staffProcedure } from "../trpc"
import { calculatePricing, type RatePlanForPricing } from "../lib/pricing"
import { sendCheckinConfirmation } from "../lib/email"
import type { PrismaClient, Prisma } from "@hotel/db"

const PAGE_SIZE = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = randomBytes(6)
  let suffix = ""
  for (const byte of bytes) {
    suffix += chars[byte % chars.length]!
  }
  return `HTL-${new Date().getUTCFullYear()}-${suffix}`
}

async function countAvailable(
  db: PrismaClient,
  propertyId: string,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string,
): Promise<number> {
  const [total, booked] = await Promise.all([
    db.room.count({
      where: { propertyId, roomTypeId, isActive: true, status: { not: "MAINTENANCE" } },
    }),
    db.booking.count({
      where: {
        propertyId,
        roomTypeId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    }),
  ])
  return Math.max(0, total - booked)
}

async function loadRatePlan(
  db: PrismaClient,
  ratePlanId: string,
  propertyId: string,
  roomTypeId: string,
): Promise<{ ratePlan: RatePlanForPricing; priceOverride: number | null }> {
  const plan = await db.ratePlan.findFirst({
    where: { id: ratePlanId, propertyId, isActive: true },
    include: { roomTypes: { where: { roomTypeId }, select: { priceOverride: true } } },
  })
  if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Rate plan not found" })

  const linkCount = await db.ratePlanRoomType.count({ where: { ratePlanId } })
  if (linkCount > 0 && plan.roomTypes.length === 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Rate plan does not apply to this room type" })
  }

  return {
    ratePlan: {
      name: plan.name,
      isNonRefundable: plan.isNonRefundable,
      discountPercent: plan.discountPercent != null ? Number(plan.discountPercent) : null,
      weekdayPrice: plan.weekdayPrice != null ? Number(plan.weekdayPrice) : null,
      weekendPrice: plan.weekendPrice != null ? Number(plan.weekendPrice) : null,
    },
    priceOverride: plan.roomTypes[0]?.priceOverride != null
      ? Number(plan.roomTypes[0]!.priceOverride)
      : null,
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const bookingRouter = router({
  /**
   * Create a new booking with auto-generated confirmation code and folio.
   * Validates availability before creating.
   */
  create: staffProcedure
    .input(
      z.object({
        guestId: z.string(),
        roomTypeId: z.string(),
        ratePlanId: z.string().optional(),
        checkIn: z.string().date("Invalid check-in date"),
        checkOut: z.string().date("Invalid check-out date"),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).default(0),
        channel: z.enum(["DIRECT", "KIOSK", "PHONE", "WALK_IN", "OTA"]).default("DIRECT"),
        specialRequests: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const propertyId = ctx.propertyId
      const { guestId, roomTypeId, ratePlanId, checkIn, checkOut, adults, children, channel, specialRequests } = input

      const checkInDate = new Date(checkIn + "T00:00:00.000Z")
      const checkOutDate = new Date(checkOut + "T00:00:00.000Z")

      if (checkOutDate <= checkInDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Check-out must be after check-in" })
      }

      const [roomType, guest] = await Promise.all([
        ctx.db.roomType.findFirst({
          where: { id: roomTypeId, propertyId, isActive: true },
          select: { id: true, name: true, basePrice: true },
        }),
        ctx.db.guest.findFirst({
          where: { id: guestId, isActive: true },
          select: { id: true, tag: true },
        }),
      ])
      if (!roomType) throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      if (!guest) throw new TRPCError({ code: "NOT_FOUND", message: "Guest not found" })

      let ratePlan: RatePlanForPricing | null = null
      let priceOverride: number | null = null
      if (ratePlanId) {
        ;({ ratePlan, priceOverride } = await loadRatePlan(ctx.db, ratePlanId, propertyId, roomTypeId))
      }

      const available = await countAvailable(ctx.db, propertyId, roomTypeId, checkInDate, checkOutDate)
      if (available === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No rooms available for the selected dates" })
      }

      const basePrice = Number(roomType.basePrice)
      const pricing = calculatePricing(basePrice, ratePlan, priceOverride, checkInDate, checkOutDate)
      const avgPerNight = pricing.nights > 0 ? pricing.total / pricing.nights : basePrice

      // Retry up to 5 times on code collision (extremely unlikely but possible)
      let confirmationCode = ""
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode()
        const conflict = await ctx.db.booking.findUnique({
          where: { confirmationCode: candidate },
          select: { id: true },
        })
        if (!conflict) {
          confirmationCode = candidate
          break
        }
      }
      if (!confirmationCode) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate confirmation code" })
      }

      const booking = await ctx.db.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            confirmationCode,
            propertyId,
            guestId,
            roomTypeId,
            ratePlanId: ratePlanId ?? null,
            status: "CONFIRMED",
            channel,
            checkInDate,
            checkOutDate,
            adults,
            children,
            specialRequests,
            totalNights: pricing.nights,
            roomPricePerNight: avgPerNight,
          },
          include: {
            guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, tag: true } },
            roomType: { select: { id: true, name: true, slug: true } },
          },
        })

        await tx.folio.create({
          data: {
            bookingId: b.id,
            items: {
              create: {
                type: "ROOM_CHARGE",
                description: `Room charge: ${checkIn} – ${checkOut}`,
                quantity: pricing.nights,
                unitPrice: avgPerNight,
                amount: pricing.total,
                chargeDate: checkInDate,
                createdById: ctx.auth.staffId,
              },
            },
          },
        })

        return b
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: booking.id,
          action: "CREATE",
          bookingId: booking.id,
          changes: JSON.parse(
            JSON.stringify({
              confirmationCode,
              roomTypeId,
              checkIn,
              checkOut,
              adults,
              children,
              channel,
              total: pricing.total,
              guestTag: guest.tag,
            })
          ),
        },
      })

      return booking
    }),

  /**
   * Paginated booking list with filters and search.
   * 20 bookings per page. Search covers confirmationCode, guest name, phone, room number.
   */
  list: staffProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        status: z.enum(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"]).optional(),
        checkInFrom: z.string().date().optional(),
        checkInTo: z.string().date().optional(),
        checkOutFrom: z.string().date().optional(),
        checkOutTo: z.string().date().optional(),
        roomTypeId: z.string().optional(),
        channel: z.enum(["DIRECT", "KIOSK", "PHONE", "WALK_IN", "OTA"]).optional(),
        search: z.string().max(100).optional(),
        sortBy: z.enum(["checkIn", "createdAt"]).default("checkIn").optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const propertyId = ctx.propertyId
      const { page, status, checkInFrom, checkInTo, checkOutFrom, checkOutTo, roomTypeId, channel, search, sortBy } = input

      const where: Prisma.BookingWhereInput = {
        propertyId,
        ...(status && { status }),
        ...(checkInFrom || checkInTo
          ? {
              checkInDate: {
                ...(checkInFrom && { gte: new Date(checkInFrom + "T00:00:00.000Z") }),
                ...(checkInTo && { lte: new Date(checkInTo + "T00:00:00.000Z") }),
              },
            }
          : {}),
        ...(checkOutFrom || checkOutTo
          ? {
              checkOutDate: {
                ...(checkOutFrom && { gte: new Date(checkOutFrom + "T00:00:00.000Z") }),
                ...(checkOutTo && { lte: new Date(checkOutTo + "T00:00:00.000Z") }),
              },
            }
          : {}),
        ...(roomTypeId && { roomTypeId }),
        ...(channel && { channel }),
        ...(search
          ? {
              OR: [
                { confirmationCode: { contains: search, mode: "insensitive" } },
                { guest: { firstName: { contains: search, mode: "insensitive" } } },
                { guest: { lastName: { contains: search, mode: "insensitive" } } },
                { guest: { phone: { contains: search, mode: "insensitive" } } },
                { rooms: { some: { room: { number: { contains: search, mode: "insensitive" } } } } },
              ],
            }
          : {}),
      }

      const [bookings, total] = await Promise.all([
        ctx.db.booking.findMany({
          where,
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            channel: true,
            checkInDate: true,
            checkOutDate: true,
            totalNights: true,
            adults: true,
            children: true,
            roomPricePerNight: true,
            createdAt: true,
            guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, tag: true } },
            roomType: { select: { id: true, name: true, slug: true } },
            ratePlan: { select: { id: true, name: true, isNonRefundable: true } },
            rooms: {
              select: { room: { select: { number: true, floor: true } } },
              take: 1,
            },
          },
          orderBy: sortBy === "createdAt"
            ? [{ createdAt: "desc" }]
            : [{ checkInDate: "asc" }, { createdAt: "desc" }],
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        ctx.db.booking.count({ where }),
      ])

      return {
        bookings,
        total,
        page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      }
    }),

  /**
   * Full booking detail: guest, rooms, folio (items + payments), audit log history.
   */
  getById: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: {
          id: input.bookingId,
          ...(ctx.propertyId ? { propertyId: ctx.propertyId } : {}),
        },
        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              nationality: true,
              tag: true,
              language: true,
              dateOfBirth: true,
              createdAt: true,
            },
          },
          roomType: {
            select: { id: true, name: true, slug: true, bedType: true, areaM2: true, photoUrls: true },
          },
          ratePlan: {
            select: { id: true, name: true, isNonRefundable: true, discountPercent: true },
          },
          rooms: {
            select: {
              id: true,
              assignedAt: true,
              room: { select: { id: true, number: true, floor: true, status: true } },
            },
          },
          folio: {
            include: {
              items: { orderBy: { createdAt: "asc" } },
              payments: { orderBy: { createdAt: "asc" } },
            },
          },
          auditLogs: {
            orderBy: { createdAt: "desc" },
            take: 20,
            include: {
              staff: { select: { id: true, firstName: true, lastName: true, role: true } },
            },
          },
        },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })

      return booking
    }),

  /**
   * Soft-cancel a CONFIRMED booking. Folio is preserved.
   */
  cancel: staffProcedure
    .input(
      z.object({
        bookingId: z.string(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: {
          id: input.bookingId,
          ...(ctx.propertyId ? { propertyId: ctx.propertyId } : {}),
        },
        select: { id: true, status: true, confirmationCode: true },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })

      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot cancel a booking with status ${booking.status}`,
        })
      }

      const updated = await ctx.db.booking.update({
        where: { id: input.bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
        select: {
          id: true,
          confirmationCode: true,
          status: true,
          cancelledAt: true,
          cancelReason: true,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: input.bookingId,
          action: "CANCEL",
          bookingId: input.bookingId,
          changes: JSON.parse(
            JSON.stringify({
              status: { old: "CONFIRMED", new: "CANCELLED" },
              reason: input.reason,
            })
          ),
        },
      })

      return updated
    }),

  /**
   * Update editable booking fields.
   * Recalculates pricing and updates the folio room charge item when dates or rate plan change.
   * Writes audit log with optional reason when dates change.
   */
  update: staffProcedure
    .input(
      z.object({
        bookingId: z.string(),
        adults: z.number().int().min(1).optional(),
        children: z.number().int().min(0).optional(),
        specialRequests: z.string().max(2000).nullish(),
        ratePlanId: z.string().nullish(),
        checkIn: z.string().date().optional(),
        checkOut: z.string().date().optional(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const { bookingId, adults, children, specialRequests, ratePlanId, checkIn, checkOut, reason } = input

      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId },
        include: {
          roomType: { select: { id: true, basePrice: true } },
          folio: {
            select: {
              id: true,
              items: {
                where: { type: "ROOM_CHARGE", isVoided: false },
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only CONFIRMED bookings can be updated" })
      }

      const newCheckInDate = checkIn ? new Date(checkIn + "T00:00:00.000Z") : booking.checkInDate
      const newCheckOutDate = checkOut ? new Date(checkOut + "T00:00:00.000Z") : booking.checkOutDate

      if (newCheckOutDate <= newCheckInDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Check-out must be after check-in" })
      }

      const datesChanged = checkIn !== undefined || checkOut !== undefined
      const ratePlanChanged = ratePlanId !== undefined

      // Recalculate pricing when dates or rate plan changes
      let pricingUpdate: { nights: number; total: number; avgPerNight: number } | null = null

      if (datesChanged || ratePlanChanged) {
        if (datesChanged) {
          const available = await countAvailable(
            ctx.db,
            booking.propertyId,
            booking.roomTypeId,
            newCheckInDate,
            newCheckOutDate,
            bookingId,
          )
          if (available === 0) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "No rooms available for the new dates" })
          }
        }

        // Effective rate plan: unchanged if ratePlanId not provided, else use new value
        const effectivePlanId = ratePlanId === undefined ? booking.ratePlanId : ratePlanId

        let newRatePlan: RatePlanForPricing | null = null
        let newPriceOverride: number | null = null

        if (effectivePlanId) {
          ;({ ratePlan: newRatePlan, priceOverride: newPriceOverride } = await loadRatePlan(
            ctx.db,
            effectivePlanId,
            booking.propertyId,
            booking.roomTypeId,
          ))
        }

        const basePrice = Number(booking.roomType.basePrice)
        const pricing = calculatePricing(basePrice, newRatePlan, newPriceOverride, newCheckInDate, newCheckOutDate)
        const avgPerNight = pricing.nights > 0 ? pricing.total / pricing.nights : basePrice
        pricingUpdate = { nights: pricing.nights, total: pricing.total, avgPerNight }
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        const b = await tx.booking.update({
          where: { id: bookingId },
          data: {
            ...(adults !== undefined && { adults }),
            ...(children !== undefined && { children }),
            ...(specialRequests !== undefined && { specialRequests }),
            ...(ratePlanId !== undefined && { ratePlanId }),
            ...(checkIn !== undefined && { checkInDate: newCheckInDate }),
            ...(checkOut !== undefined && { checkOutDate: newCheckOutDate }),
            ...(pricingUpdate && {
              totalNights: pricingUpdate.nights,
              roomPricePerNight: pricingUpdate.avgPerNight,
            }),
          },
          include: {
            guest: { select: { id: true, firstName: true, lastName: true, email: true, tag: true } },
            roomType: { select: { id: true, name: true, slug: true } },
          },
        })

        if (pricingUpdate && booking.folio) {
          const chargeItemId = booking.folio.items[0]?.id
          if (chargeItemId) {
            const checkInStr = checkIn ?? booking.checkInDate.toISOString().slice(0, 10)
            const checkOutStr = checkOut ?? booking.checkOutDate.toISOString().slice(0, 10)
            await tx.folioItem.update({
              where: { id: chargeItemId },
              data: {
                description: `Room charge: ${checkInStr} – ${checkOutStr}`,
                quantity: pricingUpdate.nights,
                unitPrice: pricingUpdate.avgPerNight,
                amount: pricingUpdate.total,
                chargeDate: newCheckInDate,
              },
            })
          }
        }

        return b
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: bookingId,
          action: "UPDATE",
          bookingId,
          changes: JSON.parse(
            JSON.stringify({
              ...(adults !== undefined && { adults }),
              ...(children !== undefined && { children }),
              ...(specialRequests !== undefined && { specialRequests }),
              ...(ratePlanId !== undefined && { ratePlanId }),
              ...(checkIn !== undefined && { checkIn }),
              ...(checkOut !== undefined && { checkOut }),
              ...(pricingUpdate && { newTotal: pricingUpdate.total }),
              ...(reason && { reason }),
            })
          ),
        },
      })

      return updated
    }),

  // ─── E2-S8: Staff check-in, check-out, mark no-show ──────────────────────

  /**
   * Manual check-in: validates room assigned + check-in window, sets CHECKED_IN,
   * marks rooms OCCUPIED, emits socket event, sends confirmation email.
   */
  checkIn: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const { bookingId } = input

      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId },
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          rooms: { select: { roomId: true, room: { select: { id: true, number: true, status: true, version: true } } } },
          property: { select: { id: true, name: true, email: true, checkInHour: true, emailTemplate: true, wifiPassword: true } },
        },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot check in a booking with status ${booking.status}`,
        })
      }
      if (booking.rooms.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No room assigned to this booking — assign a room before check-in",
        })
      }

      // Check-in window: now must be >= checkInDate + checkInHour
      const now = new Date()
      const earliestCheckIn = new Date(
        booking.checkInDate.getTime() + booking.property.checkInHour * 60 * 60 * 1000,
      )
      if (now < earliestCheckIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Check-in not yet open. Earliest check-in: ${earliestCheckIn.toISOString()}`,
        })
      }

      const actualCheckIn = now

      await ctx.db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CHECKED_IN", actualCheckIn },
        })

        for (const br of booking.rooms) {
          await tx.room.update({
            where: { id: br.roomId },
            data: { status: "OCCUPIED", version: { increment: 1 } },
          })
          await tx.roomStatusLog.create({
            data: {
              roomId: br.roomId,
              oldStatus: br.room.status,
              newStatus: "OCCUPIED",
              staffId: ctx.auth.staffId,
              note: `Check-in booking ${booking.confirmationCode}`,
            },
          })
        }
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: bookingId,
          bookingId,
          action: "CHECK_IN",
          changes: {
            status: { old: "CONFIRMED", new: "CHECKED_IN" },
            actualCheckIn: actualCheckIn.toISOString(),
            rooms: booking.rooms.map((br) => br.room.number),
          },
        },
      })

      // Emit socket event for dashboard refresh
      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("booking:checkedIn", {
        bookingId,
        confirmationCode: booking.confirmationCode,
        rooms: booking.rooms.map((br) => br.room.number),
        propertyId: ctx.propertyId,
        timestamp: Date.now(),
      })

      // Send confirmation email (fire-and-forget — failures don't block the response)
      const roomNumbers = booking.rooms.map((br) => br.room.number).join(", ")
      sendCheckinConfirmation({
        guestEmail: booking.guest.email,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        confirmationCode: booking.confirmationCode,
        roomNumber: roomNumbers,
        checkInDate: booking.checkInDate.toISOString().slice(0, 10),
        checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
        propertyName: booking.property.name,
        propertyEmail: booking.property.email,
        wifiPassword: booking.property.wifiPassword,
        customTemplate: booking.property.emailTemplate,
      }).catch(() => {
        // Email failure is non-fatal
      })

      return {
        bookingId,
        confirmationCode: booking.confirmationCode,
        status: "CHECKED_IN" as const,
        actualCheckIn: actualCheckIn.toISOString(),
        rooms: booking.rooms.map((br) => br.room.number),
      }
    }),

  /**
   * Manual check-out: validates CHECKED_IN, sets CHECKED_OUT, marks rooms DIRTY.
   * In demo mode, proceeds even if folio is not yet settled (only warns via audit log).
   */
  checkOut: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const { bookingId } = input

      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId },
        include: {
          rooms: { select: { roomId: true, room: { select: { id: true, number: true, status: true } } } },
          folio: { select: { id: true, status: true } },
        },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      if (booking.status !== "CHECKED_IN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot check out a booking with status ${booking.status}`,
        })
      }

      const folioUnsettled = booking.folio?.status !== "SETTLED"
      const actualCheckOut = new Date()

      await ctx.db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "CHECKED_OUT", actualCheckOut },
        })

        for (const br of booking.rooms) {
          await tx.room.update({
            where: { id: br.roomId },
            data: { status: "DIRTY", version: { increment: 1 } },
          })
          await tx.roomStatusLog.create({
            data: {
              roomId: br.roomId,
              oldStatus: br.room.status,
              newStatus: "DIRTY",
              staffId: ctx.auth.staffId,
              note: `Check-out booking ${booking.confirmationCode}`,
            },
          })
        }
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: bookingId,
          bookingId,
          action: "CHECK_OUT",
          changes: JSON.parse(
            JSON.stringify({
              status: { old: "CHECKED_IN", new: "CHECKED_OUT" },
              actualCheckOut: actualCheckOut.toISOString(),
              rooms: booking.rooms.map((br) => br.room.number),
              ...(folioUnsettled && { warning: "Folio not settled at time of check-out" }),
            }),
          ),
        },
      })

      // Emit socket event for dashboard refresh
      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("booking:checkedOut", {
        bookingId,
        confirmationCode: booking.confirmationCode,
        rooms: booking.rooms.map((br) => br.room.number),
        propertyId: ctx.propertyId,
        timestamp: Date.now(),
      })

      return {
        bookingId,
        confirmationCode: booking.confirmationCode,
        status: "CHECKED_OUT" as const,
        actualCheckOut: actualCheckOut.toISOString(),
        folioUnsettled,
      }
    }),

  /**
   * Soft-mark a booking as NO_SHOW. Does not change room status.
   */
  markNoShow: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      const { bookingId } = input

      const booking = await ctx.db.booking.findFirst({
        where: { id: bookingId, propertyId: ctx.propertyId },
        select: { id: true, status: true, confirmationCode: true },
      })

      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      if (booking.status !== "CONFIRMED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Can only mark CONFIRMED bookings as no-show (current: ${booking.status})`,
        })
      }

      const updated = await ctx.db.booking.update({
        where: { id: bookingId },
        data: { status: "NO_SHOW" },
        select: { id: true, confirmationCode: true, status: true },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Booking",
          entityId: bookingId,
          bookingId,
          action: "NO_SHOW",
          changes: { status: { old: "CONFIRMED", new: "NO_SHOW" } },
        },
      })

      return updated
    }),
})
