import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, publicProcedure } from "../trpc"
import { calculatePricing, type RatePlanForPricing } from "../lib/pricing"

export const pricingRouter = router({
  /**
   * Returns a full pricing breakdown for a room type + optional rate plan.
   * Uses publicProcedure so the booking portal can call it without auth.
   */
  calculate: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        roomTypeId: z.string(),
        ratePlanId: z.string().optional(),
        checkIn: z.string().date("Invalid check-in date"),
        checkOut: z.string().date("Invalid check-out date"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { propertyId, roomTypeId, ratePlanId, checkIn, checkOut } = input

      const checkInDate = new Date(checkIn + "T00:00:00.000Z")
      const checkOutDate = new Date(checkOut + "T00:00:00.000Z")

      if (checkOutDate <= checkInDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Check-out must be after check-in",
        })
      }

      // Fetch room type — validates it belongs to the given property
      const roomType = await ctx.db.roomType.findFirst({
        where: { id: roomTypeId, propertyId, isActive: true },
        select: { id: true, name: true, slug: true, basePrice: true },
      })
      if (!roomType) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room type not found" })
      }

      let ratePlan: RatePlanForPricing | null = null
      let priceOverride: number | null = null

      if (ratePlanId) {
        const plan = await ctx.db.ratePlan.findFirst({
          where: { id: ratePlanId, propertyId, isActive: true },
          include: {
            roomTypes: {
              where: { roomTypeId },
              select: { priceOverride: true },
            },
          },
        })
        if (!plan) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Rate plan not found" })
        }

        // If rate plan is linked to specific room types, verify this room type is included
        const totalRoomTypeLinks = await ctx.db.ratePlanRoomType.count({
          where: { ratePlanId },
        })
        if (totalRoomTypeLinks > 0 && plan.roomTypes.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Rate plan does not apply to this room type",
          })
        }

        priceOverride =
          plan.roomTypes[0]?.priceOverride !== null && plan.roomTypes[0]?.priceOverride !== undefined
            ? Number(plan.roomTypes[0].priceOverride)
            : null

        ratePlan = {
          name: plan.name,
          isNonRefundable: plan.isNonRefundable,
          discountPercent: plan.discountPercent !== null ? Number(plan.discountPercent) : null,
          weekdayPrice: plan.weekdayPrice !== null ? Number(plan.weekdayPrice) : null,
          weekendPrice: plan.weekendPrice !== null ? Number(plan.weekendPrice) : null,
        }
      }

      const basePrice = Number(roomType.basePrice)
      const result = calculatePricing(basePrice, ratePlan, priceOverride, checkInDate, checkOutDate)

      return {
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        ratePlanId: ratePlanId ?? null,
        ...result,
      }
    }),
})
