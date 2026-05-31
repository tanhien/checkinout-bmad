import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, adminProcedure } from "../trpc"

export const serviceRouter = router({
  list: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.service.findMany({
      where: { propertyId: ctx.propertyId, isActive: true },
      select: { id: true, name: true, category: true, unit: true, price: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
  }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.service.findMany({
      where: { propertyId: ctx.propertyId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        category: z.enum(["FOOD_BEVERAGE", "LAUNDRY", "SPA", "MINIBAR", "TRANSPORT", "OTHER"]),
        unit: z.string().min(1).max(50),
        price: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const service = await ctx.db.service.create({
        data: { propertyId: ctx.propertyId, ...input },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Service",
          entityId: service.id,
          action: "CREATE",
          changes: { name: input.name, category: input.category, price: String(input.price) },
        },
      })
      return service
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        category: z.enum(["FOOD_BEVERAGE", "LAUNDRY", "SPA", "MINIBAR", "TRANSPORT", "OTHER"]).optional(),
        unit: z.string().min(1).max(50).optional(),
        price: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input
      const service = await ctx.db.service.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" })

      const updated = await ctx.db.service.update({ where: { id }, data })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Service",
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
      const service = await ctx.db.service.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId },
      })
      if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Service not found" })

      const updated = await ctx.db.service.update({
        where: { id: input.id },
        data: { isActive: !service.isActive },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Service",
          entityId: input.id,
          action: updated.isActive ? "ACTIVATE" : "DEACTIVATE",
          changes: { isActive: updated.isActive },
        },
      })
      return updated
    }),
})
