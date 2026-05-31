import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, adminProcedure } from "../trpc"

export const amenityRouter = router({
  list: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.amenity.findMany({
      where: { propertyId: ctx.propertyId },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        icon: z.string().min(1).max(50),
        category: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const amenity = await ctx.db.amenity.create({
        data: {
          propertyId: ctx.propertyId,
          name: input.name,
          icon: input.icon,
          category: input.category,
        },
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Amenity",
          entityId: amenity.id,
          action: "CREATE",
          changes: { name: input.name, category: input.category },
        },
      })
      return amenity
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        icon: z.string().min(1).max(50).optional(),
        category: z.string().min(1).max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const { id, ...data } = input

      const amenity = await ctx.db.amenity.findFirst({
        where: { id, propertyId: ctx.propertyId },
      })
      if (!amenity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Amenity not found" })
      }

      const updated = await ctx.db.amenity.update({
        where: { id },
        data,
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Amenity",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(data)),
        },
      })

      return updated
    }),
})
