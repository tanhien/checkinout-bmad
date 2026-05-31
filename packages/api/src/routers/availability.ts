import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { router, publicProcedure } from "../trpc"

export const availabilityRouter = router({
  /**
   * Returns room types with available room count for the given date range.
   *
   * Availability formula:
   *   availableCount = (active non-MAINTENANCE rooms of this type)
   *                  - (CONFIRMED or CHECKED_IN bookings overlapping the date range)
   *
   * This handles both assigned rooms (room.status = RESERVED/OCCUPIED) and
   * unassigned bookings — each booking consumes one unit of room type inventory.
   */
  check: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        checkIn: z.string().date("Invalid check-in date"),
        checkOut: z.string().date("Invalid check-out date"),
        roomTypeId: z.string().optional(),
        adults: z.number().int().min(1),
        children: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { propertyId, checkIn, checkOut, roomTypeId, adults, children } = input

      const checkInDate = new Date(checkIn + "T00:00:00.000Z")
      const checkOutDate = new Date(checkOut + "T00:00:00.000Z")

      if (checkOutDate <= checkInDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Check-out must be after check-in",
        })
      }

      // Fetch active room types that can accommodate the requested guests
      const roomTypes = await ctx.db.roomType.findMany({
        where: {
          propertyId,
          isActive: true,
          ...(roomTypeId ? { id: roomTypeId } : {}),
          maxAdults: { gte: adults },
          maxChildren: { gte: children },
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
          basePrice: true,
          photoUrls: true,
          isFeatured: true,
          amenities: {
            include: {
              amenity: { select: { id: true, name: true, icon: true, category: true } },
            },
          },
          // Count active rooms, excluding those under maintenance (permanently unavailable)
          _count: {
            select: {
              rooms: { where: { isActive: true, status: { not: "MAINTENANCE" } } },
            },
          },
        },
      })

      if (roomTypes.length === 0) return []

      // Count CONFIRMED / CHECKED_IN bookings per room type that overlap the requested range.
      // Overlap condition: booking.checkInDate < requestedCheckOut AND booking.checkOutDate > requestedCheckIn
      const roomTypeIds = roomTypes.map((rt) => rt.id)
      const bookingCounts = await ctx.db.booking.groupBy({
        by: ["roomTypeId"],
        where: {
          propertyId,
          roomTypeId: { in: roomTypeIds },
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
        _count: { id: true },
      })

      const bookingCountMap = new Map(bookingCounts.map((b) => [b.roomTypeId, b._count.id]))

      return roomTypes.map((rt) => {
        const totalRooms = rt._count.rooms
        const bookedCount = bookingCountMap.get(rt.id) ?? 0
        const availableCount = Math.max(0, totalRooms - bookedCount)
        const { _count, ...rtFields } = rt
        return {
          ...rtFields,
          availableCount,
          isAvailable: availableCount > 0,
        }
      })
    }),

  /**
   * Returns a map of date → available (true/false) for the given room type,
   * covering 3 calendar months starting from `month` (YYYY-MM).
   */
  getCalendar: publicProcedure
    .input(
      z.object({
        propertyId: z.string(),
        roomTypeId: z.string(),
        month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { propertyId, roomTypeId, month } = input

      const [yearStr, monthStr] = month.split("-")
      const year = parseInt(yearStr!, 10)
      const monthNum = parseInt(monthStr!, 10)

      if (monthNum < 1 || monthNum > 12) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid month value" })
      }

      // 3-month window: [startDate, endDate)
      const startDate = new Date(Date.UTC(year, monthNum - 1, 1))
      const endDate = new Date(Date.UTC(year, monthNum - 1 + 3, 1))

      // Total active non-maintenance rooms for this room type
      const totalRooms = await ctx.db.room.count({
        where: {
          propertyId,
          roomTypeId,
          isActive: true,
          status: { not: "MAINTENANCE" },
        },
      })

      const calendar: Record<string, boolean> = {}
      const cursor = new Date(startDate)

      if (totalRooms === 0) {
        while (cursor < endDate) {
          calendar[toDateKey(cursor)] = false
          cursor.setUTCDate(cursor.getUTCDate() + 1)
        }
        return calendar
      }

      // Fetch all active bookings that touch the 3-month window (2 queries total)
      const bookings = await ctx.db.booking.findMany({
        where: {
          propertyId,
          roomTypeId,
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkInDate: { lt: endDate },
          checkOutDate: { gt: startDate },
        },
        select: { checkInDate: true, checkOutDate: true },
      })

      // For each day, count bookings that include that day and mark availability
      while (cursor < endDate) {
        const dayStart = new Date(cursor)
        const dayEnd = new Date(cursor)
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

        // Overlap: booking.checkInDate < dayEnd AND booking.checkOutDate > dayStart
        let overlappingCount = 0
        for (const b of bookings) {
          if (b.checkInDate < dayEnd && b.checkOutDate > dayStart) {
            overlappingCount++
          }
        }

        calendar[toDateKey(cursor)] = overlappingCount < totalRooms
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }

      return calendar
    }),
})

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}
