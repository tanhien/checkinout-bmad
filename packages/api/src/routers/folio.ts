import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, managerProcedure } from "../trpc"

const paymentMethodEnum = z.enum(["CASH", "CARD", "BANK_TRANSFER", "DEMO", "OTHER"])
const discountTypeEnum = z.enum(["PERCENTAGE", "FIXED_AMOUNT"])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(String(v))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function computeTotals(
  items: Array<{ amount: unknown; isVoided: boolean }>,
  payments: Array<{ amount: unknown }>,
): { chargesTotal: number; paymentsTotal: number; balance: number } {
  const charges = items.filter((i) => !i.isVoided).reduce((s, i) => s + toNum(i.amount), 0)
  const paid = payments.reduce((s, p) => s + toNum(p.amount), 0)
  return {
    chargesTotal: round2(charges),
    paymentsTotal: round2(paid),
    balance: round2(charges - paid),
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const folioRouter = router({
  // AC 1 — full folio with items, payments, and computed totals
  getByBooking: staffProcedure
    .input(z.object({ bookingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const folio = await ctx.db.folio.findFirst({
        where: { bookingId: input.bookingId, booking: { propertyId: ctx.propertyId! } },
        include: {
          booking: {
            select: {
              id: true,
              confirmationCode: true,
              status: true,
              checkInDate: true,
              checkOutDate: true,
              totalNights: true,
              roomType: { select: { id: true, name: true } },
              guest: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          items: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { createdAt: "asc" } },
        },
      })

      if (!folio) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      }

      return { ...folio, ...computeTotals(folio.items, folio.payments) }
    }),

  // AC 2 — add service charge + auto-calculate tax (AC 5)
  addServiceCharge: staffProcedure
    .input(
      z.object({
        folioId: z.string(),
        serviceId: z.string().optional(),
        description: z.string().min(1).max(500),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
        chargeDate: z.string().date("Invalid date"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { folioId, serviceId, description, quantity, unitPrice, chargeDate } = input

      const folio = await ctx.db.folio.findFirst({
        where: { id: folioId, booking: { propertyId: ctx.propertyId! } },
        select: { id: true, status: true },
      })
      if (!folio) throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      if (folio.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folio is already settled" })
      }

      if (serviceId) {
        const svc = await ctx.db.service.findFirst({
          where: { id: serviceId, propertyId: ctx.propertyId!, isActive: true },
          select: { id: true },
        })
        if (!svc) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" })
      }

      const amount = round2(quantity * unitPrice)
      const chargeDateParsed = new Date(chargeDate + "T00:00:00.000Z")

      // Load applicable tax rates for service charges
      const taxRates = await ctx.db.taxRate.findMany({
        where: { propertyId: ctx.propertyId!, isActive: true, appliesTo: { in: ["SERVICE", "ALL"] } },
      })

      await ctx.db.$transaction(async (tx) => {
        await tx.folioItem.create({
          data: {
            folioId,
            type: "SERVICE",
            description,
            quantity,
            unitPrice,
            amount,
            serviceId: serviceId ?? null,
            chargeDate: chargeDateParsed,
            createdById: ctx.auth.staffId,
          },
        })

        for (const tax of taxRates) {
          const taxAmount = round2(amount * toNum(tax.rate) / 100)
          await tx.folioItem.create({
            data: {
              folioId,
              type: "TAX",
              description: tax.name,
              quantity: 1,
              unitPrice: taxAmount,
              amount: taxAmount,
              chargeDate: chargeDateParsed,
              createdById: ctx.auth.staffId,
            },
          })
        }
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Folio",
          entityId: folioId,
          action: "ADD_SERVICE_CHARGE",
          changes: JSON.parse(JSON.stringify({ description, quantity, unitPrice, amount, serviceId })),
        },
      })

      return ctx.db.folio.findUniqueOrThrow({
        where: { id: folioId },
        include: {
          items: { orderBy: { createdAt: "asc" } },
          payments: { orderBy: { createdAt: "asc" } },
        },
      })
    }),

  // AC 3 — soft void item, folio must be OPEN
  voidItem: staffProcedure
    .input(
      z.object({
        folioItemId: z.string(),
        reason: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { folioItemId, reason } = input

      const item = await ctx.db.folioItem.findFirst({
        where: {
          id: folioItemId,
          folio: { booking: { propertyId: ctx.propertyId! } },
        },
        include: { folio: { select: { id: true, status: true } } },
      })
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Folio item not found" })
      if (item.isVoided) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Item is already voided" })
      }
      if (item.folio.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot void items on a settled folio" })
      }

      const updated = await ctx.db.folioItem.update({
        where: { id: folioItemId },
        data: {
          isVoided: true,
          voidReason: reason,
          voidedAt: new Date(),
          voidedById: ctx.auth.staffId,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "FolioItem",
          entityId: folioItemId,
          action: "VOID",
          changes: JSON.parse(
            JSON.stringify({ reason, amount: String(updated.amount), type: updated.type }),
          ),
        },
      })

      return updated
    }),

  // AC 4 — record payment against folio
  addPayment: staffProcedure
    .input(
      z.object({
        folioId: z.string(),
        method: paymentMethodEnum,
        amount: z.number().positive(),
        reference: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { folioId, method, amount, reference } = input

      const folio = await ctx.db.folio.findFirst({
        where: { id: folioId, booking: { propertyId: ctx.propertyId! } },
        select: { id: true, status: true },
      })
      if (!folio) throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      if (folio.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folio is already settled" })
      }

      const payment = await ctx.db.payment.create({
        data: {
          folioId,
          method,
          amount,
          reference: reference ?? null,
          createdById: ctx.auth.staffId,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Folio",
          entityId: folioId,
          action: "ADD_PAYMENT",
          changes: JSON.parse(JSON.stringify({ method, amount, reference })),
        },
      })

      return payment
    }),

  // AC 6 — settle: validate CHECKED_OUT booking + payments ≥ charges
  settle: staffProcedure
    .input(z.object({ folioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const folio = await ctx.db.folio.findFirst({
        where: { id: input.folioId, booking: { propertyId: ctx.propertyId! } },
        include: {
          booking: { select: { id: true, status: true } },
          items: { select: { amount: true, isVoided: true } },
          payments: { select: { amount: true } },
        },
      })
      if (!folio) throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      if (folio.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folio is already settled" })
      }
      if (folio.booking.status !== "CHECKED_OUT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only settle a folio after the guest has checked out",
        })
      }

      const { chargesTotal, paymentsTotal } = computeTotals(folio.items, folio.payments)
      if (paymentsTotal < chargesTotal) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient payment: charges ${chargesTotal}, paid ${paymentsTotal}`,
        })
      }

      const settled = await ctx.db.folio.update({
        where: { id: input.folioId },
        data: { status: "SETTLED", settledAt: new Date(), settledById: ctx.auth.staffId },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Folio",
          entityId: input.folioId,
          action: "SETTLE",
          changes: { chargesTotal, paymentsTotal },
        },
      })

      return settled
    }),

  // AC 7 — reopen: manager only, folio must be SETTLED
  reopen: managerProcedure
    .input(
      z.object({
        folioId: z.string(),
        reason: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { folioId, reason } = input

      const folio = await ctx.db.folio.findFirst({
        where: { id: folioId, booking: { propertyId: ctx.propertyId! } },
        select: { id: true, status: true },
      })
      if (!folio) throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      if (folio.status !== "SETTLED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folio is not settled" })
      }

      const reopened = await ctx.db.folio.update({
        where: { id: folioId },
        data: { status: "OPEN", settledAt: null, settledById: null },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Folio",
          entityId: folioId,
          action: "REOPEN",
          changes: { reason },
        },
      })

      return reopened
    }),

  // AC 8 — discount: >10% requires Manager or Admin
  addDiscount: staffProcedure
    .input(
      z.object({
        folioId: z.string(),
        type: discountTypeEnum,
        value: z.number().positive(),
        reason: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { folioId, type, value, reason } = input

      // Role check before loading data so we fail fast
      if (type === "PERCENTAGE" && value > 10) {
        const role = ctx.auth.role
        if (role !== "MANAGER" && role !== "ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Discounts greater than 10% require Manager or Admin role",
          })
        }
      }

      const folio = await ctx.db.folio.findFirst({
        where: { id: folioId, booking: { propertyId: ctx.propertyId! } },
        include: {
          items: { select: { amount: true, isVoided: true, type: true } },
        },
      })
      if (!folio) throw new TRPCError({ code: "NOT_FOUND", message: "Folio not found" })
      if (folio.status !== "OPEN") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folio is already settled" })
      }

      let discountAmount: number
      if (type === "PERCENTAGE") {
        // Base = sum of non-voided, non-discount items
        const base = folio.items
          .filter((i) => !i.isVoided && i.type !== "DISCOUNT")
          .reduce((s, i) => s + toNum(i.amount), 0)
        discountAmount = round2(base * value / 100)
      } else {
        discountAmount = round2(value)
      }

      const description =
        type === "PERCENTAGE" ? `${value}% discount — ${reason}` : `Discount — ${reason}`

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      const item = await ctx.db.folioItem.create({
        data: {
          folioId,
          type: "DISCOUNT",
          description,
          quantity: 1,
          unitPrice: -discountAmount,
          amount: -discountAmount,
          chargeDate: today,
          createdById: ctx.auth.staffId,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Folio",
          entityId: folioId,
          action: "ADD_DISCOUNT",
          changes: JSON.parse(
            JSON.stringify({ type, value, discountAmount: -discountAmount, reason }),
          ),
        },
      })

      return item
    }),
})
