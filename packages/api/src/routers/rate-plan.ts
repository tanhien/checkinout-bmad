import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, managerProcedure } from "../trpc"

const ratePlanInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullish(),
  isNonRefundable: z.boolean().default(false),
  discountPercent: z.number().min(0).max(100).nullish(),
  minStayNights: z.number().int().min(1).default(1),
  weekdayPrice: z.number().positive().nullish(),
  weekendPrice: z.number().positive().nullish(),
  // Optional: link to specific room types. Empty / omitted = applies to all.
  roomTypeIds: z
    .array(
      z.object({
        roomTypeId: z.string(),
        priceOverride: z.number().positive().nullish(),
      })
    )
    .default([]),
})

export const ratePlanRouter = router({
  list: managerProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    return ctx.db.ratePlan.findMany({
      where: { propertyId: ctx.propertyId, isActive: true },
      include: {
        roomTypes: {
          include: { roomType: { select: { id: true, name: true, slug: true } } },
        },
      },
      orderBy: { name: "asc" },
    })
  }),

  create: managerProcedure
    .input(ratePlanInput)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const { roomTypeIds, ...planData } = input

      // Validate all referenced room types belong to this property
      if (roomTypeIds.length > 0) {
        const ids = roomTypeIds.map((r) => r.roomTypeId)
        const valid = await ctx.db.roomType.findMany({
          where: { id: { in: ids }, propertyId: ctx.propertyId },
          select: { id: true },
        })
        if (valid.length !== ids.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more room types not found for this property",
          })
        }
      }

      const ratePlan = await ctx.db.ratePlan.create({
        data: {
          propertyId: ctx.propertyId,
          ...planData,
          roomTypes: roomTypeIds.length > 0
            ? { create: roomTypeIds.map((r) => ({ roomTypeId: r.roomTypeId, priceOverride: r.priceOverride })) }
            : undefined,
        },
        include: {
          roomTypes: {
            include: { roomType: { select: { id: true, name: true } } },
          },
        },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RatePlan",
          entityId: ratePlan.id,
          action: "CREATE",
          changes: JSON.parse(
            JSON.stringify({ name: planData.name, discountPercent: planData.discountPercent })
          ),
        },
      })

      return ratePlan
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().nullish(),
        isNonRefundable: z.boolean().optional(),
        discountPercent: z.number().min(0).max(100).nullish(),
        minStayNights: z.number().int().min(1).optional(),
        weekdayPrice: z.number().positive().nullish(),
        weekendPrice: z.number().positive().nullish(),
        // If provided, replaces all existing room type links
        roomTypeIds: z
          .array(
            z.object({
              roomTypeId: z.string(),
              priceOverride: z.number().positive().nullish(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const { id, roomTypeIds, ...data } = input

      const existing = await ctx.db.ratePlan.findFirst({
        where: { id, propertyId: ctx.propertyId, isActive: true },
      })
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rate plan not found" })
      }

      if (roomTypeIds !== undefined && roomTypeIds.length > 0) {
        const ids = roomTypeIds.map((r) => r.roomTypeId)
        const valid = await ctx.db.roomType.findMany({
          where: { id: { in: ids }, propertyId: ctx.propertyId },
          select: { id: true },
        })
        if (valid.length !== ids.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "One or more room types not found for this property",
          })
        }
      }

      const updated = await ctx.db.$transaction(async (tx) => {
        if (roomTypeIds !== undefined) {
          // Replace all linked room types
          await tx.ratePlanRoomType.deleteMany({ where: { ratePlanId: id } })
          if (roomTypeIds.length > 0) {
            await tx.ratePlanRoomType.createMany({
              data: roomTypeIds.map((r) => ({
                ratePlanId: id,
                roomTypeId: r.roomTypeId,
                priceOverride: r.priceOverride ?? null,
              })),
            })
          }
        }

        return tx.ratePlan.update({
          where: { id },
          data,
          include: {
            roomTypes: {
              include: { roomType: { select: { id: true, name: true } } },
            },
          },
        })
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RatePlan",
          entityId: id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify({ ...data, roomTypesUpdated: roomTypeIds !== undefined })),
        },
      })

      return updated
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }

      const existing = await ctx.db.ratePlan.findFirst({
        where: { id: input.id, propertyId: ctx.propertyId, isActive: true },
      })
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Rate plan not found" })
      }

      const deleted = await ctx.db.ratePlan.update({
        where: { id: input.id },
        data: { isActive: false },
      })

      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "RatePlan",
          entityId: input.id,
          action: "DEACTIVATE",
          changes: { isActive: false },
        },
      })

      return deleted
    }),
})
