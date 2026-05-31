import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, staffProcedure, adminProcedure, publicProcedure } from "../trpc"

export const propertyRouter = router({
  // Get current property config — used by staff dashboard, kiosk, and booking portal
  getConfig: staffProcedure.query(async ({ ctx }) => {
    if (!ctx.propertyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
    }
    const property = await ctx.db.property.findUnique({
      where: { id: ctx.propertyId },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        tagline: true,
        description: true,
        checkInHour: true,
        checkOutHour: true,
        timezone: true,
        currency: true,
        wifiPassword: true,
        breakfastHours: true,
        childMaxAge: true,
        freeCancelHours: true,
        walkinMaxDays: true,
        maxAdvanceDays: true,
        minStayNights: true,
      },
    })
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Property not found" })
    }
    return property
  }),

  // Get public property info for booking portal (no auth required)
  getPublicInfo: publicProcedure.query(async ({ ctx }) => {
    const property = await ctx.db.property.findFirst({
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        tagline: true,
        description: true,
        checkInHour: true,
        checkOutHour: true,
        timezone: true,
        currency: true,
        breakfastHours: true,
        childMaxAge: true,
        freeCancelHours: true,
        maxAdvanceDays: true,
        minStayNights: true,
      },
    })
    if (!property) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Property not configured" })
    }
    return property
  }),

  // Update property config — admin only
  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        type: z
          .enum(["BOUTIQUE", "BUSINESS", "RESORT", "HOSTEL", "SERVICED_APARTMENT", "MOTEL"])
          .optional(),
        address: z.string().min(1).optional(),
        phone: z.string().min(1).optional(),
        email: z.string().email().optional(),
        tagline: z.string().max(200).nullish(),
        description: z.string().nullish(),
        checkInHour: z.number().int().min(0).max(23).optional(),
        checkOutHour: z.number().int().min(0).max(23).optional(),
        timezone: z.string().optional(),
        currency: z.string().length(3).optional(),
        walkinMaxDays: z.number().int().min(0).optional(),
        maxAdvanceDays: z.number().int().min(1).optional(),
        minStayNights: z.number().int().min(1).optional(),
        freeCancelHours: z.number().int().min(0).nullish(),
        childMaxAge: z.number().int().min(0).optional(),
        wifiPassword: z.string().nullish(),
        breakfastHours: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.propertyId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No property in context" })
      }
      const property = await ctx.db.property.update({
        where: { id: ctx.propertyId },
        data: input,
      })
      await ctx.db.auditLog.create({
        data: {
          staffId: ctx.auth.staffId,
          entityType: "Property",
          entityId: property.id,
          action: "UPDATE",
          changes: JSON.parse(JSON.stringify(input)),
        },
      })
      return property
    }),
})
