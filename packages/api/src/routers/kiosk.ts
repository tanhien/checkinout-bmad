import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { randomBytes } from "crypto"
import { router, kioskProcedure } from "../trpc"
import { calculatePricing } from "../lib/pricing"
import { sendCheckinConfirmation } from "../lib/email"
import type { PrismaClient } from "@hotel/db"

// Normalize Vietnamese name: strip diacritics + lowercase + collapse whitespace
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = randomBytes(6)
  let suffix = ""
  for (const byte of bytes) suffix += chars[byte % chars.length]!
  return `HTL-${new Date().getUTCFullYear()}-${suffix}`
}

// Auto-assign a CLEAN/INSPECTED room using optimistic locking via DB transaction.
// Returns assigned room info or throws TRPCError with message "NO_CLEAN_ROOM".
async function autoAssignCleanRoom(
  db: PrismaClient,
  propertyId: string,
  roomTypeId: string,
  bookingId: string,
): Promise<{ roomId: string; number: string; floor: number; oldStatus: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const room = await db.room.findFirst({
      where: {
        propertyId,
        roomTypeId,
        isActive: true,
        status: { in: ["CLEAN", "INSPECTED"] },
        // Exclude rooms already assigned to active bookings
        bookingRooms: { none: { booking: { status: { in: ["CONFIRMED", "CHECKED_IN"] } } } },
      },
      select: { id: true, number: true, floor: true, version: true, status: true },
    })

    if (!room) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "NO_CLEAN_ROOM" })
    }

    try {
      let assigned = false
      await db.$transaction(async (tx) => {
        // Optimistic lock: verify version hasn't changed since we read it
        const locked = await tx.room.findFirst({
          where: { id: room.id, version: room.version },
          select: { id: true },
        })
        if (!locked) throw new Error("VERSION_CONFLICT")

        await tx.room.update({
          where: { id: room.id },
          data: { status: "RESERVED", version: { increment: 1 } },
        })
        await tx.bookingRoom.create({
          data: { bookingId, roomId: room.id },
        })
        await tx.roomStatusLog.create({
          data: {
            roomId: room.id,
            oldStatus: room.status,
            newStatus: "RESERVED",
            note: "Kiosk auto-assign",
          },
        })
        assigned = true
      })
      if (assigned) {
        return { roomId: room.id, number: room.number, floor: room.floor, oldStatus: room.status }
      }
    } catch {
      // Retry on version conflict
    }
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to assign room after retries" })
}

export const kioskRouter = router({
  // ─── Property info ────────────────────────────────────────────────────────

  getPropertyInfo: kioskProcedure.query(async ({ ctx }) => {
    const property = await ctx.db.property.findUnique({
      where: { id: ctx.propertyId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        tagline: true,
        checkInHour: true,
        checkOutHour: true,
        wifiPassword: true,
        breakfastHours: true,
        currency: true,
        timezone: true,
      },
    })
    if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" })
    return property
  }),

  // ─── E4-S2: Kiosk check-in ───────────────────────────────────────────────

  // Screen 2: look up booking by confirmation code
  lookupBooking: kioskProcedure
    .input(z.object({ confirmationCode: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: {
          confirmationCode: input.confirmationCode.toUpperCase().trim(),
          propertyId: ctx.propertyId,
          status: "CONFIRMED",
        },
        select: {
          id: true,
          confirmationCode: true,
          checkInDate: true,
          checkOutDate: true,
          totalNights: true,
          adults: true,
          children: true,
          guest: { select: { id: true, firstName: true, lastName: true } },
          roomType: { select: { id: true, name: true } },
        },
      })

      if (!booking) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Booking not found or not eligible for kiosk check-in",
        })
      }

      return {
        ...booking,
        checkInDate: booking.checkInDate.toISOString().slice(0, 10),
        checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
      }
    }),

  // Screens 3–5: verify guest name → auto-assign room → check in
  checkIn: kioskProcedure
    .input(
      z.object({
        confirmationCode: z.string().min(1),
        guestName: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: {
          confirmationCode: input.confirmationCode.toUpperCase().trim(),
          propertyId: ctx.propertyId,
          status: "CONFIRMED",
        },
        include: {
          guest: { select: { id: true, firstName: true, lastName: true, email: true } },
          property: {
            select: {
              name: true,
              email: true,
              wifiPassword: true,
              emailTemplate: true,
              checkInHour: true,
            },
          },
        },
      })

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found or already checked in" })
      }

      // Name verification (case-insensitive, diacritics-normalized)
      const expectedName = normalizeName(`${booking.guest.firstName} ${booking.guest.lastName}`)
      const providedName = normalizeName(input.guestName)
      if (providedName !== expectedName) {
        throw new TRPCError({ code: "FORBIDDEN", message: "NAME_MISMATCH" })
      }

      // Check-in window validation
      const now = new Date()
      const earliestCheckIn = new Date(
        booking.checkInDate.getTime() + booking.property.checkInHour * 60 * 60 * 1000,
      )
      if (now < earliestCheckIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `TOO_EARLY:${earliestCheckIn.toISOString()}`,
        })
      }

      // Auto-assign clean room
      let assignedRoom: { roomId: string; number: string; floor: number; oldStatus: string }
      assignedRoom = await autoAssignCleanRoom(ctx.db, ctx.propertyId, booking.roomTypeId, booking.id)

      // Mark booking CHECKED_IN + room OCCUPIED
      await ctx.db.$transaction(async (tx) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CHECKED_IN", actualCheckIn: now },
        })
        await tx.room.update({
          where: { id: assignedRoom.roomId },
          data: { status: "OCCUPIED", version: { increment: 1 } },
        })
        await tx.roomStatusLog.create({
          data: {
            roomId: assignedRoom.roomId,
            oldStatus: "RESERVED",
            newStatus: "OCCUPIED",
            note: `Kiosk check-in ${booking.confirmationCode}`,
          },
        })
      })

      // Emit to staff dashboard
      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("booking:checkedIn", {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        rooms: [assignedRoom.number],
        propertyId: ctx.propertyId,
        timestamp: Date.now(),
      })

      // Send confirmation email (fire-and-forget)
      sendCheckinConfirmation({
        guestEmail: booking.guest.email,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        confirmationCode: booking.confirmationCode,
        roomNumber: assignedRoom.number,
        checkInDate: booking.checkInDate.toISOString().slice(0, 10),
        checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
        propertyName: booking.property.name,
        propertyEmail: booking.property.email,
        wifiPassword: booking.property.wifiPassword,
        customTemplate: booking.property.emailTemplate,
      }).catch(() => {})

      return {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        roomNumber: assignedRoom.number,
        floor: assignedRoom.floor,
        wifiPassword: booking.property.wifiPassword,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        checkInDate: booking.checkInDate.toISOString().slice(0, 10),
        checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
      }
    }),

  // ─── E4-S3: Walk-in booking ──────────────────────────────────────────────

  // Screen 2: available room types with pricing for walk-in
  getAvailableRoomTypes: kioskProcedure
    .input(
      z.object({
        checkIn: z.string().date(),
        checkOut: z.string().date(),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const checkInDate = new Date(input.checkIn + "T00:00:00.000Z")
      const checkOutDate = new Date(input.checkOut + "T00:00:00.000Z")

      if (checkOutDate <= checkInDate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Check-out must be after check-in" })
      }

      const nights = Math.round(
        (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      const roomTypes = await ctx.db.roomType.findMany({
        where: {
          propertyId: ctx.propertyId,
          isActive: true,
          maxAdults: { gte: input.adults },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          areaM2: true,
          maxAdults: true,
          maxChildren: true,
          bedType: true,
          photoUrls: true,
          basePrice: true,
          amenities: {
            select: { amenity: { select: { name: true, icon: true } } },
            take: 6,
          },
        },
      })

      const results = await Promise.all(
        roomTypes.map(async (rt) => {
          const [total, booked] = await Promise.all([
            ctx.db.room.count({
              where: {
                propertyId: ctx.propertyId,
                roomTypeId: rt.id,
                isActive: true,
                status: { notIn: ["MAINTENANCE"] },
              },
            }),
            ctx.db.booking.count({
              where: {
                propertyId: ctx.propertyId,
                roomTypeId: rt.id,
                status: { in: ["CONFIRMED", "CHECKED_IN"] },
                checkInDate: { lt: checkOutDate },
                checkOutDate: { gt: checkInDate },
              },
            }),
          ])
          const available = Math.max(0, total - booked)
          const basePrice = Number(rt.basePrice)
          const pricing = calculatePricing(basePrice, null, null, checkInDate, checkOutDate)

          return {
            id: rt.id,
            name: rt.name,
            slug: rt.slug,
            description: rt.description,
            areaM2: rt.areaM2,
            maxAdults: rt.maxAdults,
            maxChildren: rt.maxChildren,
            bedType: rt.bedType,
            photoUrls: rt.photoUrls,
            basePrice,
            pricePerNight: basePrice,
            totalPrice: pricing.total,
            nights,
            available,
            amenities: rt.amenities.map((a) => a.amenity),
          }
        })
      )

      return results.filter((rt) => rt.available > 0)
    }),

  // Screens 4–5: create walk-in booking → auto-assign room → check in
  walkInBook: kioskProcedure
    .input(
      z.object({
        roomTypeId: z.string(),
        checkIn: z.string().date(),
        checkOut: z.string().date(),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).default(0),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        phone: z.string().min(5).max(20),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const checkInDate = new Date(input.checkIn + "T00:00:00.000Z")
      const checkOutDate = new Date(input.checkOut + "T00:00:00.000Z")

      const roomType = await ctx.db.roomType.findFirst({
        where: { id: input.roomTypeId, propertyId: ctx.propertyId, isActive: true },
        select: { id: true, name: true, basePrice: true },
      })
      if (!roomType) throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })

      // Re-check availability
      const [total, booked] = await Promise.all([
        ctx.db.room.count({
          where: { propertyId: ctx.propertyId, roomTypeId: input.roomTypeId, isActive: true },
        }),
        ctx.db.booking.count({
          where: {
            propertyId: ctx.propertyId,
            roomTypeId: input.roomTypeId,
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkInDate: { lt: checkOutDate },
            checkOutDate: { gt: checkInDate },
          },
        }),
      ])
      if (Math.max(0, total - booked) === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No rooms available for selected dates" })
      }

      // findOrCreate guest by phone, then email
      let guestId: string | null = null

      if (input.phone) {
        const byPhone = await ctx.db.guest.findFirst({
          where: { phone: input.phone, isActive: true },
          select: { id: true },
        })
        guestId = byPhone?.id ?? null
      }
      if (!guestId && input.email) {
        const byEmail = await ctx.db.guest.findUnique({
          where: { email: input.email },
          select: { id: true },
        })
        guestId = byEmail?.id ?? null
      }
      if (!guestId) {
        const guestEmail = input.email ?? `kiosk.${Date.now()}.${randomBytes(4).toString("hex")}@walkin.internal`
        const newGuest = await ctx.db.guest.create({
          data: {
            email: guestEmail,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
          select: { id: true },
        })
        guestId = newGuest.id
      }

      // Generate confirmation code
      let confirmationCode = ""
      for (let i = 0; i < 5; i++) {
        const candidate = generateCode()
        const conflict = await ctx.db.booking.findUnique({
          where: { confirmationCode: candidate },
          select: { id: true },
        })
        if (!conflict) { confirmationCode = candidate; break }
      }
      if (!confirmationCode) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate confirmation code" })
      }

      const nights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      const basePrice = Number(roomType.basePrice)
      const pricing = calculatePricing(basePrice, null, null, checkInDate, checkOutDate)

      // Create booking + folio
      const booking = await ctx.db.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            confirmationCode,
            propertyId: ctx.propertyId,
            guestId: guestId!,
            roomTypeId: input.roomTypeId,
            status: "CONFIRMED",
            channel: "KIOSK",
            checkInDate,
            checkOutDate,
            adults: input.adults,
            children: input.children,
            totalNights: nights,
            roomPricePerNight: pricing.total / nights,
          },
        })
        await tx.folio.create({
          data: {
            bookingId: b.id,
            items: {
              create: {
                type: "ROOM_CHARGE",
                description: `Room charge: ${input.checkIn} – ${input.checkOut}`,
                quantity: nights,
                unitPrice: pricing.total / nights,
                amount: pricing.total,
                chargeDate: checkInDate,
                createdById: "kiosk",
              },
            },
          },
        })
        return b
      })

      // Auto-assign clean room
      const assignedRoom = await autoAssignCleanRoom(ctx.db, ctx.propertyId, input.roomTypeId, booking.id)
      const now = new Date()

      // Settle folio with demo payment + check in
      await ctx.db.$transaction(async (tx) => {
        const folio = await tx.folio.findUnique({
          where: { bookingId: booking.id },
          select: { id: true },
        })
        if (folio) {
          await tx.payment.create({
            data: {
              folioId: folio.id,
              method: "DEMO",
              amount: pricing.total,
              note: "Kiosk walk-in payment",
              createdById: "kiosk",
            },
          })
          await tx.folio.update({
            where: { id: folio.id },
            data: { status: "SETTLED", settledAt: now },
          })
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CHECKED_IN", actualCheckIn: now },
        })
        await tx.room.update({
          where: { id: assignedRoom.roomId },
          data: { status: "OCCUPIED", version: { increment: 1 } },
        })
        await tx.roomStatusLog.create({
          data: {
            roomId: assignedRoom.roomId,
            oldStatus: "RESERVED",
            newStatus: "OCCUPIED",
            note: `Kiosk walk-in ${confirmationCode}`,
          },
        })
      })

      // Emit socket event
      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("booking:checkedIn", {
        bookingId: booking.id,
        confirmationCode,
        rooms: [assignedRoom.number],
        propertyId: ctx.propertyId,
        timestamp: Date.now(),
        channel: "KIOSK",
      })

      return {
        confirmationCode,
        roomNumber: assignedRoom.number,
        floor: assignedRoom.floor,
        guestName: `${input.firstName} ${input.lastName}`,
        checkInDate: input.checkIn,
        checkOutDate: input.checkOut,
        totalAmount: pricing.total,
      }
    }),

  // ─── E4-S4: Kiosk check-out ──────────────────────────────────────────────

  // Screen 1: look up checked-in booking for check-out
  lookupForCheckout: kioskProcedure
    .input(
      z.object({
        roomNumber: z.string().optional(),
        guestName: z.string().optional(),
        confirmationCode: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { roomNumber, guestName, confirmationCode } = input
      if (!confirmationCode && !(roomNumber && guestName)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provide confirmation code, or room number + guest name",
        })
      }

      const booking = confirmationCode
        ? await ctx.db.booking.findFirst({
            where: {
              confirmationCode: confirmationCode.toUpperCase().trim(),
              propertyId: ctx.propertyId,
              status: "CHECKED_IN",
            },
            include: {
              guest: { select: { firstName: true, lastName: true, email: true } },
              roomType: { select: { name: true } },
              rooms: { select: { room: { select: { number: true, floor: true } } } },
              folio: {
                include: {
                  items: { where: { isVoided: false }, orderBy: { chargeDate: "asc" } },
                  payments: { orderBy: { createdAt: "asc" } },
                },
              },
            },
          })
        : await ctx.db.booking.findFirst({
            where: {
              propertyId: ctx.propertyId,
              status: "CHECKED_IN",
              rooms: { some: { room: { number: roomNumber } } },
            },
            include: {
              guest: { select: { firstName: true, lastName: true, email: true } },
              roomType: { select: { name: true } },
              rooms: { select: { room: { select: { number: true, floor: true } } } },
              folio: {
                include: {
                  items: { where: { isVoided: false }, orderBy: { chargeDate: "asc" } },
                  payments: { orderBy: { createdAt: "asc" } },
                },
              },
            },
          })

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No checked-in booking found" })
      }

      // Verify guest name when looking up by room number
      if (!confirmationCode && guestName) {
        const expected = normalizeName(`${booking.guest.firstName} ${booking.guest.lastName}`)
        if (normalizeName(guestName) !== expected) {
          throw new TRPCError({ code: "FORBIDDEN", message: "NAME_MISMATCH" })
        }
      }

      const totalCharges = booking.folio?.items.reduce((s, i) => s + Number(i.amount), 0) ?? 0
      const totalPayments = booking.folio?.payments.reduce((s, p) => s + Number(p.amount), 0) ?? 0

      return {
        id: booking.id,
        confirmationCode: booking.confirmationCode,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        guestEmail: booking.guest.email,
        roomTypeName: booking.roomType.name,
        roomNumbers: booking.rooms.map((br) => br.room.number),
        checkInDate: booking.checkInDate.toISOString().slice(0, 10),
        checkOutDate: booking.checkOutDate.toISOString().slice(0, 10),
        folioItems: (booking.folio?.items ?? []).map((item) => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.amount),
          type: item.type,
        })),
        totalCharges,
        totalPayments,
        balance: Math.max(0, totalCharges - totalPayments),
        folioStatus: booking.folio?.status ?? "OPEN",
      }
    }),

  // Demo payment + check out
  checkOut: kioskProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: { id: input.bookingId, propertyId: ctx.propertyId, status: "CHECKED_IN" },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true } },
          rooms: { select: { roomId: true, room: { select: { number: true, status: true } } } },
          folio: {
            include: {
              items: { where: { isVoided: false } },
              payments: true,
            },
          },
        },
      })

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found or not checked in" })
      }

      const totalCharges = booking.folio?.items.reduce((s, i) => s + Number(i.amount), 0) ?? 0
      const totalPayments = booking.folio?.payments.reduce((s, p) => s + Number(p.amount), 0) ?? 0
      const balance = Math.max(0, totalCharges - totalPayments)
      const now = new Date()

      await ctx.db.$transaction(async (tx) => {
        if (booking.folio && balance > 0) {
          await tx.payment.create({
            data: {
              folioId: booking.folio.id,
              method: "DEMO",
              amount: balance,
              note: "Kiosk demo payment at checkout",
              createdById: "kiosk",
            },
          })
          await tx.folio.update({
            where: { id: booking.folio.id },
            data: { status: "SETTLED", settledAt: now },
          })
        }

        await tx.booking.update({
          where: { id: input.bookingId },
          data: { status: "CHECKED_OUT", actualCheckOut: now },
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
              note: `Kiosk check-out ${booking.confirmationCode}`,
            },
          })
        }
      })

      // Emit socket event
      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("booking:checkedOut", {
        bookingId: booking.id,
        confirmationCode: booking.confirmationCode,
        rooms: booking.rooms.map((br) => br.room.number),
        propertyId: ctx.propertyId,
        timestamp: Date.now(),
      })

      return {
        confirmationCode: booking.confirmationCode,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        checkOutTime: now.toISOString(),
        amountPaid: balance,
      }
    }),

  // ─── E4-S5: Call for help ────────────────────────────────────────────────

  callForHelp: kioskProcedure
    .input(z.object({ kioskId: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const alertId = randomBytes(8).toString("hex")
      const timestamp = Date.now()

      const staffIO = (global as Record<string, unknown>)["staffIO"] as
        | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
        | undefined
      staffIO?.to(`property:${ctx.propertyId}`).emit("alert:callForHelp", {
        alertId,
        kioskId: input.kioskId,
        propertyId: ctx.propertyId,
        timestamp,
      })

      return { alertId, timestamp }
    }),
})
