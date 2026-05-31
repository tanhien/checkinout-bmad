import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, adminProcedure, staffProcedure } from "../trpc"

export const taxRateRouter = router({
  list: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.taxRate.findMany({
      where: { propertyId: ctx.propertyId },
      orderBy: { name: "asc" },
    })
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        rate: z.number().min(0).max(100),
        appliesTo: z.enum(["ROOM", "SERVICE", "ALL"]).default("ALL"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const taxRate = await ctx.db.taxRate.create({
        data: { propertyId: ctx.propertyId, ...input },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "TaxRate",
          entityId: taxRate.id,
          action: "CREATE",
          changes: { name: input.name, rate: String(input.rate), appliesTo: input.appliesTo },
        },
      })
      return taxRate
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        rate: z.number().min(0).max(100).optional(),
        appliesTo: z.enum(["ROOM", "SERVICE", "ALL"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input

      const existing = await ctx.db.taxRate.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Tax rate not found" })

      const updated = await ctx.db.taxRate.update({ where: { id }, data })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "TaxRate",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(data)),
        },
      })
      return updated
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const existing = await ctx.db.taxRate.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId },
      })
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Tax rate not found" })

      const updated = await ctx.db.taxRate.update({
        where: { id: input.id },
        data: { isActive: !existing.isActive },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "TaxRate",
          entityId: input.id,
          action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
          changes: { isActive: updated.isActive },
        },
      })
      return updated
    }),
})
