import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, managerProcedure } from "../trpc"

export const promoCodeRouter = router({
  list: managerProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.promoCode.findMany({
      where: { propertyId: ctx.propertyId },
      orderBy: { createdAt: "desc" },
    })
  }),

  create: managerProcedure
    .input(
      z.object({
        code: z.string().min(3).max(50).toUpperCase(),
        description: z.string().max(500).optional(),
        discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
        discountValue: z.number().positive(),
        maxUses: z.number().int().positive().optional(),
        validFrom: z.string().datetime({ offset: true }),
        validUntil: z.string().datetime({ offset: true }),
        roomTypeIds: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const code = input.code.toUpperCase()

      const existing = await ctx.db.promoCode.findFirst({
        where: { code, propertyId: ctx.propertyId },
      })
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: `Code "${code}" already exists` })
      }

      const validFrom = new Date(input.validFrom)
      const validUntil = new Date(input.validUntil)
      if (validUntil <= validFrom) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "validUntil must be after validFrom" })
      }

      if (input.roomTypeIds.length > 0) {
        const valid = await ctx.db.roomType.findMany({
          where: { id: { in: input.roomTypeIds }, propertyId: ctx.propertyId },
          select: { id: true },
        })
        if (valid.length !== input.roomTypeIds.length) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "One or more room types not found" })
        }
      }

      const promo = await ctx.db.promoCode.create({
        data: {
          propertyId: ctx.propertyId,
          code,
          description: input.description ?? null,
          discountType: input.discountType,
          discountValue: input.discountValue,
          maxUses: input.maxUses ?? null,
          validFrom,
          validUntil,
          roomTypeIds: input.roomTypeIds,
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "PromoCode",
          entityId: promo.id,
          action: "CREATE",
          changes: { code, discountType: input.discountType, discountValue: String(input.discountValue) },
        },
      })

      return promo
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        description: z.string().max(500).nullish(),
        maxUses: z.number().int().positive().nullish(),
        validFrom: z.string().datetime({ offset: true }).optional(),
        validUntil: z.string().datetime({ offset: true }).optional(),
        roomTypeIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input

      const promo = await ctx.db.promoCode.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!promo) throw new TRPCError({ code: "NOT_FOUND", message: "Promo code not found" })

      const updateData: Record<string, unknown> = {}
      if (data.description !== undefined) updateData["description"] = data.description
      if (data.maxUses !== undefined) updateData["maxUses"] = data.maxUses
      if (data.validFrom !== undefined) updateData["validFrom"] = new Date(data.validFrom)
      if (data.validUntil !== undefined) updateData["validUntil"] = new Date(data.validUntil)
      if (data.roomTypeIds !== undefined) updateData["roomTypeIds"] = data.roomTypeIds

      const updated = await ctx.db.promoCode.update({ where: { id }, data: updateData })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "PromoCode",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(updateData)),
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
      const promo = await ctx.db.promoCode.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId },
      })
      if (!promo) throw new TRPCError({ code: "NOT_FOUND", message: "Promo code not found" })

      const updated = await ctx.db.promoCode.update({
        where: { id: input.id },
        data: { isActive: !promo.isActive },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "PromoCode",
          entityId: input.id,
          action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
          changes: { isActive: updated.isActive },
        },
      })
      return updated
    }),
})
