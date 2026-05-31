import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { router, publicProcedure, guestProcedure } from "../trpc"
import { calculatePricing } from "../lib/pricing"
import type { PrismaClient } from "@hotel/db"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPropertyId(): string {
  const id = process.env["BOOKING_PROPERTY_ID"]
  if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BOOKING_PROPERTY_ID not set" })
  return id
}

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = randomBytes(6)
  let suffix = ""
  for (const byte of bytes) suffix += chars[byte % chars.length]!
  return `HTL-${new Date().getUTCFullYear()}-${suffix}`
}

async function countAvailableRooms(
  db: PrismaClient,
  propertyId: string,
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
): Promise<number> {
  const [total, booked] = await Promise.all([
    db.room.count({ where: { propertyId, roomTypeId, isActive: true } }),
    db.booking.count({
      where: {
        propertyId,
        roomTypeId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    }),
  ])
  return Math.max(0, total - booked)
}

export async function signGuestToken(payload: { guestId: string; email: string }, rememberMe = false): Promise<string> {
  const secret = process.env["GUEST_JWT_SECRET"] ?? ""
  if (secret.length < 32) throw new Error("GUEST_JWT_SECRET too short")
  const expiry = rememberMe ? "30d" : "7d"
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(new TextEncoder().encode(secret))
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const portalRouter = router({
  // ── Public: property info ─────────────────────────────────────────────────
  getProperty: publicProcedure.query(async ({ ctx }) => {
    const propertyId = getPropertyId()
    const property = await ctx.db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        tagline: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        checkInHour: true,
        checkOutHour: true,
        currency: true,
        freeCancelHours: true,
        minStayNights: true,
        amenities: { select: { id: true, name: true, icon: true } },
      },
    })
    if (!property) throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" })
    return property
  }),

  // ── Public: room type listing with availability + pricing ─────────────────
  getRoomTypes: publicProcedure
    .input(
      z.object({
        checkin: z.string().date().optional(),
        checkout: z.string().date().optional(),
        adults: z.number().int().min(1).default(2),
        children: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const roomTypes = await ctx.db.roomType.findMany({
        where: { propertyId, isActive: true },
        include: {
          amenities: { include: { amenity: { select: { id: true, name: true, icon: true } } } },
          ratePlans: {
            include: { ratePlan: true },
            where: { ratePlan: { isActive: true, propertyId } },
          },
        },
        orderBy: { basePrice: "asc" },
      })

      const checkIn = input.checkin ? new Date(input.checkin + "T00:00:00.000Z") : null
      const checkOut = input.checkout ? new Date(input.checkout + "T00:00:00.000Z") : null
      const hasDateRange = checkIn && checkOut && checkOut > checkIn

      const results = await Promise.all(
        roomTypes.map(async (rt) => {
          const available = hasDateRange
            ? await countAvailableRooms(ctx.db, propertyId, rt.id, checkIn!, checkOut!)
            : null

          const meetsCapacity = rt.maxAdults >= input.adults && rt.maxChildren >= input.children

          let pricing = null
          if (hasDateRange && rt.ratePlans.length > 0) {
            const bestPlan = rt.ratePlans[0]!.ratePlan
            pricing = calculatePricing(
              Number(rt.basePrice),
              {
                name: bestPlan.name,
                isNonRefundable: bestPlan.isNonRefundable,
                discountPercent: bestPlan.discountPercent ? Number(bestPlan.discountPercent) : null,
                weekdayPrice: bestPlan.weekdayPrice ? Number(bestPlan.weekdayPrice) : null,
                weekendPrice: bestPlan.weekendPrice ? Number(bestPlan.weekendPrice) : null,
              },
              null,
              checkIn!,
              checkOut!,
            )
          }

          return {
            id: rt.id,
            slug: rt.slug,
            name: rt.name,
            description: rt.description,
            areaM2: rt.areaM2,
            maxAdults: rt.maxAdults,
            maxChildren: rt.maxChildren,
            bedType: rt.bedType,
            photoUrls: rt.photoUrls,
            basePrice: Number(rt.basePrice),
            isFeatured: rt.isFeatured,
            amenities: rt.amenities.map((a) => a.amenity),
            available,
            meetsCapacity,
            pricing,
          }
        }),
      )

      return results
    }),

  // ── Public: single room type by slug ──────────────────────────────────────
  getRoomType: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const rt = await ctx.db.roomType.findFirst({
        where: { propertyId, slug: input.slug, isActive: true },
        include: {
          amenities: { include: { amenity: { select: { id: true, name: true, icon: true } } } },
          ratePlans: {
            include: { ratePlan: true },
            where: { ratePlan: { isActive: true, propertyId } },
          },
        },
      })
      if (!rt) throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })

      return {
        id: rt.id,
        slug: rt.slug,
        name: rt.name,
        description: rt.description,
        areaM2: rt.areaM2,
        maxAdults: rt.maxAdults,
        maxChildren: rt.maxChildren,
        bedType: rt.bedType,
        photoUrls: rt.photoUrls,
        basePrice: Number(rt.basePrice),
        isFeatured: rt.isFeatured,
        amenities: rt.amenities.map((a) => a.amenity),
        ratePlans: rt.ratePlans.map((rp) => ({
          id: rp.ratePlan.id,
          name: rp.ratePlan.name,
          isNonRefundable: rp.ratePlan.isNonRefundable,
          discountPercent: rp.ratePlan.discountPercent ? Number(rp.ratePlan.discountPercent) : null,
        })),
      }
    }),

  // ── Public: validate promo code ───────────────────────────────────────────
  validatePromoCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        roomTypeId: z.string(),
        totalAmount: z.number().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const now = new Date()
      const promo = await ctx.db.promoCode.findFirst({
        where: {
          code: input.code.toUpperCase(),
          propertyId,
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gte: now },
        },
      })
      if (!promo) return { valid: false, reason: "INVALID_CODE" as const }

      if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
        return { valid: false, reason: "MAX_USES_REACHED" as const }
      }

      if (promo.roomTypeIds.length > 0 && !promo.roomTypeIds.includes(input.roomTypeId)) {
        return { valid: false, reason: "NOT_APPLICABLE" as const }
      }

      const discountAmount =
        promo.discountType === "PERCENTAGE"
          ? Math.round((input.totalAmount * Number(promo.discountValue)) / 100)
          : Math.min(Number(promo.discountValue), input.totalAmount)

      return {
        valid: true,
        promoId: promo.id,
        promoName: promo.description ?? promo.code,
        discountType: promo.discountType,
        discountAmount,
      }
    }),

  // ── Public: create online booking (find-or-create guest) ─────────────────
  createBooking: publicProcedure
    .input(
      z.object({
        roomTypeId: z.string(),
        ratePlanId: z.string().optional(),
        checkin: z.string().date(),
        checkout: z.string().date(),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).default(0),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        nationality: z.string().optional(),
        idNumber: z.string().optional(),
        arrivalTime: z.string().optional(),
        specialRequests: z.string().optional(),
        promoCode: z.string().optional(),
        locale: z.enum(["vi", "en"]).default("vi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const checkIn = new Date(input.checkin + "T00:00:00.000Z")
      const checkOut = new Date(input.checkout + "T00:00:00.000Z")

      if (checkOut <= checkIn) throw new TRPCError({ code: "BAD_REQUEST", message: "checkout must be after checkin" })

      // Availability re-check
      const available = await countAvailableRooms(ctx.db, propertyId, input.roomTypeId, checkIn, checkOut)
      if (available === 0) throw new TRPCError({ code: "CONFLICT", message: "NO_AVAILABILITY" })

      // Fetch room type + rate plan
      const roomType = await ctx.db.roomType.findFirst({
        where: { id: input.roomTypeId, propertyId, isActive: true },
      })
      if (!roomType) throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })

      let ratePlan = null
      if (input.ratePlanId) {
        ratePlan = await ctx.db.ratePlan.findFirst({
          where: { id: input.ratePlanId, propertyId, isActive: true },
        })
      }
      if (!ratePlan) {
        ratePlan = await ctx.db.ratePlan.findFirst({
          where: { propertyId, isActive: true, roomTypes: { some: { roomTypeId: input.roomTypeId } } },
          orderBy: { createdAt: "asc" },
        })
      }

      // Pricing
      const pricing = calculatePricing(
        Number(roomType.basePrice),
        ratePlan
          ? {
              name: ratePlan.name,
              isNonRefundable: ratePlan.isNonRefundable,
              discountPercent: ratePlan.discountPercent ? Number(ratePlan.discountPercent) : null,
              weekdayPrice: ratePlan.weekdayPrice ? Number(ratePlan.weekdayPrice) : null,
              weekendPrice: ratePlan.weekendPrice ? Number(ratePlan.weekendPrice) : null,
            }
          : null,
        null,
        checkIn,
        checkOut,
      )

      // Promo code validation
      let promoRecord = null
      let discountAmount = 0
      if (input.promoCode) {
        const now = new Date()
        promoRecord = await ctx.db.promoCode.findFirst({
          where: {
            code: input.promoCode.toUpperCase(),
            propertyId,
            isActive: true,
            validFrom: { lte: now },
            validUntil: { gte: now },
          },
        })
        if (promoRecord) {
          if (promoRecord.maxUses !== null && promoRecord.usedCount >= promoRecord.maxUses) {
            promoRecord = null
          } else if (promoRecord.roomTypeIds.length > 0 && !promoRecord.roomTypeIds.includes(input.roomTypeId)) {
            promoRecord = null
          } else {
            discountAmount =
              promoRecord.discountType === "PERCENTAGE"
                ? Math.round((pricing.total * Number(promoRecord.discountValue)) / 100)
                : Math.min(Number(promoRecord.discountValue), pricing.total)
          }
        }
      }

      // Find or create guest by email
      let guest = await ctx.db.guest.findUnique({ where: { email: input.email.toLowerCase() } })
      if (!guest) {
        guest = await ctx.db.guest.create({
          data: {
            email: input.email.toLowerCase(),
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            nationality: input.nationality,
            language: input.locale,
          },
        })
      }

      // Generate unique confirmation code
      let confirmationCode = ""
      for (let i = 0; i < 5; i++) {
        const candidate = generateCode()
        const exists = await ctx.db.booking.findUnique({ where: { confirmationCode: candidate } })
        if (!exists) { confirmationCode = candidate; break }
      }
      if (!confirmationCode) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Code generation failed" })

      const specialRequests = [
        input.arrivalTime ? `Arrival: ${input.arrivalTime}` : null,
        input.specialRequests,
      ].filter(Boolean).join("\n") || null

      // Create booking + folio + promo usedCount in one transaction
      const booking = await ctx.db.$transaction(async (tx) => {
        const b = await tx.booking.create({
          data: {
            confirmationCode,
            propertyId,
            guestId: guest!.id,
            roomTypeId: input.roomTypeId,
            ratePlanId: ratePlan?.id ?? null,
            status: "CONFIRMED",
            channel: "ONLINE",
            checkInDate: checkIn,
            checkOutDate: checkOut,
            adults: input.adults,
            children: input.children,
            specialRequests,
            roomPricePerNight: pricing.subtotal / pricing.nights,
            totalNights: pricing.nights,
            promoCodeId: promoRecord?.id ?? null,
            discountAmount: discountAmount > 0 ? discountAmount : null,
            lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
          },
        })

        const folio = await tx.folio.create({
          data: { bookingId: b.id, status: "OPEN" },
        })
        await tx.folioItem.create({
          data: {
            folioId: folio.id,
            type: "ROOM_CHARGE",
            description: `${roomType.name} × ${pricing.nights} đêm`,
            amount: pricing.total,
            quantity: pricing.nights,
            unitPrice: pricing.subtotal / pricing.nights,
            chargeDate: checkIn,
            createdById: "online",
          },
        })

        if (promoRecord) {
          await tx.promoCode.update({
            where: { id: promoRecord.id },
            data: { usedCount: { increment: 1 } },
          })
        }

        return b
      })

      // Send confirmation email async
      const property = await ctx.db.property.findUnique({
        where: { id: propertyId },
        select: { name: true, email: true, address: true, phone: true },
      })
      if (property) {
        void sendBookingConfirmationEmail({
          guestEmail: guest.email,
          guestName: `${guest.firstName} ${guest.lastName}`,
          confirmationCode,
          checkin: input.checkin,
          checkout: input.checkout,
          roomTypeName: roomType.name,
          nights: pricing.nights,
          totalAmount: pricing.total - discountAmount,
          propertyName: property.name,
          propertyEmail: property.email,
          propertyAddress: property.address,
        })
      }

      return { confirmationCode, bookingId: booking.id }
    }),

  // ── Public: get booking by confirmation code + email (for confirmation page)
  getBookingByCode: publicProcedure
    .input(z.object({ code: z.string(), email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const booking = await ctx.db.booking.findFirst({
        where: {
          confirmationCode: input.code.toUpperCase(),
          propertyId,
          guest: { email: input.email.toLowerCase() },
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true } },
          roomType: { select: { name: true, slug: true, photoUrls: true } },
          ratePlan: { select: { name: true, isNonRefundable: true } },
        },
      })
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })

      return {
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString(),
        totalNights: booking.totalNights,
        adults: booking.adults,
        children: booking.children,
        specialRequests: booking.specialRequests,
        roomPricePerNight: Number(booking.roomPricePerNight),
        discountAmount: booking.discountAmount ? Number(booking.discountAmount) : null,
        guest: booking.guest,
        roomType: booking.roomType,
        ratePlan: booking.ratePlan,
      }
    }),

  // ── Public: lookup booking by code + email (no-auth access for guests) ───
  lookupBooking: publicProcedure
    .input(z.object({ code: z.string(), email: z.string().email() }))
    .query(async ({ ctx, input }) => {
      const propertyId = getPropertyId()
      const booking = await ctx.db.booking.findFirst({
        where: {
          confirmationCode: input.code.toUpperCase(),
          propertyId,
          guest: { email: input.email.toLowerCase() },
        },
        include: {
          guest: { select: { firstName: true, lastName: true, email: true } },
          roomType: { select: { name: true, slug: true } },
        },
      })
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" })
      return {
        confirmationCode: booking.confirmationCode,
        status: booking.status,
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString(),
        totalNights: booking.totalNights,
        adults: booking.adults,
        children: booking.children,
        guest: booking.guest,
        roomType: booking.roomType,
      }
    }),

  // ── Public: guest register ────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase()
      const existing = await ctx.db.guest.findUnique({ where: { email } })

      if (existing?.passwordHash) {
        throw new TRPCError({ code: "CONFLICT", message: "EMAIL_EXISTS" })
      }

      const passwordHash = await bcrypt.hash(input.password, 12)

      let guest
      if (existing) {
        // Guest exists (created during booking) — add password
        guest = await ctx.db.guest.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone ?? existing.phone,
          },
        })
      } else {
        guest = await ctx.db.guest.create({
          data: {
            email,
            passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
          },
        })
      }

      const token = await signGuestToken({ guestId: guest.id, email: guest.email })
      return { token, guestId: guest.id, email: guest.email, firstName: guest.firstName }
    }),

  // ── Public: guest login ───────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string(), rememberMe: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase()
      const DUMMY_HASH = "$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      const guest = await ctx.db.guest.findUnique({ where: { email } })
      const hash = guest?.passwordHash ?? DUMMY_HASH
      const valid = await bcrypt.compare(input.password, hash)
      if (!guest || !valid || !guest.isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "INVALID_CREDENTIALS" })
      }
      const token = await signGuestToken({ guestId: guest.id, email: guest.email }, input.rememberMe)
      return { token, guestId: guest.id, email: guest.email, firstName: guest.firstName, rememberMe: input.rememberMe }
    }),

  // ── Guest: get my profile ─────────────────────────────────────────────────
  me: guestProcedure.query(async ({ ctx }) => {
    const guest = await ctx.db.guest.findUnique({
      where: { id: ctx.auth.guestId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, nationality: true },
    })
    if (!guest) throw new TRPCError({ code: "NOT_FOUND", message: "Guest not found" })
    return guest
  }),

  // ── Guest: my bookings ────────────────────────────────────────────────────
  getMyBookings: guestProcedure.query(async ({ ctx }) => {
    const propertyId = getPropertyId()
    const bookings = await ctx.db.booking.findMany({
      where: { guestId: ctx.auth.guestId, propertyId },
      include: {
        roomType: { select: { name: true, slug: true, photoUrls: true } },
      },
      orderBy: { checkInDate: "desc" },
    })
    return bookings.map((b) => ({
      id: b.id,
      confirmationCode: b.confirmationCode,
      status: b.status,
      checkInDate: b.checkInDate.toISOString(),
      checkOutDate: b.checkOutDate.toISOString(),
      totalNights: b.totalNights,
      adults: b.adults,
      children: b.children,
      roomType: b.roomType,
      freeCancelHours: null as number | null,
    }))
  }),

  // ── Guest: cancel booking ─────────────────────────────────────────────────
  cancelMyBooking: guestProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.booking.findFirst({
        where: { id: input.bookingId, guestId: ctx.auth.guestId, status: "CONFIRMED" },
        include: { property: { select: { freeCancelHours: true } } },
      })
      if (!booking) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found or cannot be cancelled" })

      const cancelWindowHours = booking.property.freeCancelHours ?? null
      if (cancelWindowHours !== null) {
        const checkInMs = booking.checkInDate.getTime()
        const nowMs = Date.now()
        const hoursUntilCheckIn = (checkInMs - nowMs) / (1000 * 60 * 60)
        if (hoursUntilCheckIn < cancelWindowHours) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CANCEL_WINDOW_EXPIRED" })
        }
      }

      await ctx.db.booking.update({
        where: { id: input.bookingId },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Guest cancelled online" },
      })

      return { success: true }
    }),

  // ── Public: forgot password ───────────────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase()
      const guest = await ctx.db.guest.findUnique({ where: { email } })
      // Always succeed (don't reveal whether email exists)
      if (!guest?.passwordHash) return { sent: true }

      const token = randomBytes(32).toString("hex")
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await ctx.db.guest.update({
        where: { id: guest.id },
        data: { passwordResetToken: token, passwordResetExpiry: expiry },
      })

      // Send email async
      void sendPasswordResetEmail({ guestEmail: email, guestName: guest.firstName, token })
      return { sent: true }
    }),

  // ── Public: reset password ────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), password: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const guest = await ctx.db.guest.findFirst({
        where: {
          passwordResetToken: input.token,
          passwordResetExpiry: { gt: new Date() },
        },
      })
      if (!guest) throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_OR_EXPIRED_TOKEN" })

      const passwordHash = await bcrypt.hash(input.password, 12)
      await ctx.db.guest.update({
        where: { id: guest.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
      })
      return { success: true }
    }),
})

// ─── Email helpers (no-ops when RESEND_API_KEY absent) ───────────────────────

async function sendBookingConfirmationEmail(params: {
  guestEmail: string
  guestName: string
  confirmationCode: string
  checkin: string
  checkout: string
  roomTypeName: string
  nights: number
  totalAmount: number
  propertyName: string
  propertyEmail: string
  propertyAddress: string
}): Promise<void> {
  const { Resend } = await import("resend")
  const key = process.env["RESEND_API_KEY"]
  if (!key) return
  const resend = new Resend(key)
  const html = `<!DOCTYPE html><html lang="vi"><body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
<h2 style="color:#1d4ed8">${params.propertyName} — Đặt phòng thành công!</h2>
<p>Kính gửi ${params.guestName},</p>
<p>Chúng tôi đã nhận được đặt phòng của bạn. Mã xác nhận của bạn:</p>
<div style="background:#eff6ff;border:2px solid #1d4ed8;border-radius:8px;padding:16px;text-align:center;margin:16px 0">
  <p style="font-size:28px;font-weight:700;letter-spacing:2px;color:#1d4ed8;margin:0">${params.confirmationCode}</p>
</div>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
  <tr><td style="padding:8px;font-weight:600;width:40%">Phòng</td><td style="padding:8px">${params.roomTypeName}</td></tr>
  <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Nhận phòng</td><td style="padding:8px">${params.checkin}</td></tr>
  <tr><td style="padding:8px;font-weight:600">Trả phòng</td><td style="padding:8px">${params.checkout}</td></tr>
  <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Số đêm</td><td style="padding:8px">${params.nights}</td></tr>
  <tr><td style="padding:8px;font-weight:600">Tổng tiền</td><td style="padding:8px">${params.totalAmount.toLocaleString("vi-VN")} VNĐ</td></tr>
</table>
<p>Bạn có thể dùng mã trên để check-in tại kiosk. Cảm ơn bạn đã đặt phòng!</p>
<p style="color:#6b7280;font-size:12px">${params.propertyName} · ${params.propertyAddress}</p>
</body></html>`
  await resend.emails.send({
    from: `${params.propertyName} <noreply@hotel.local>`,
    to: params.guestEmail,
    subject: `Đặt phòng thành công — ${params.confirmationCode}`,
    html,
  }).catch(() => {/* silent fail */})
}

async function sendPasswordResetEmail(params: {
  guestEmail: string
  guestName: string
  token: string
}): Promise<void> {
  const { Resend } = await import("resend")
  const key = process.env["RESEND_API_KEY"]
  if (!key) return
  const resend = new Resend(key)
  const resetUrl = `${process.env["BOOKING_BASE_URL"] ?? ""}/vi/reset-password/${params.token}`
  const html = `<!DOCTYPE html><html lang="vi"><body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
<h2 style="color:#1d4ed8">Đặt lại mật khẩu</h2>
<p>Kính gửi ${params.guestName},</p>
<p>Nhấp vào liên kết dưới đây để đặt lại mật khẩu (hiệu lực 24 giờ):</p>
<p><a href="${resetUrl}" style="color:#1d4ed8">${resetUrl}</a></p>
<p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
</body></html>`
  await resend.emails.send({
    from: "Hotel <noreply@hotel.local>",
    to: params.guestEmail,
    subject: "Đặt lại mật khẩu tài khoản của bạn",
    html,
  }).catch(() => {/* silent fail */})
}
