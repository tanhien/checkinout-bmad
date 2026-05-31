import { z } from "zod"
import { router, staffProcedure } from "../trpc"

export const reportRouter = router({
  // ─── E3-S2: Dashboard data ────────────────────────────────────────────────

  getDashboard: staffProcedure
    .input(z.object({ date: z.string().date("Invalid date") }))
    .query(async ({ ctx, input }) => {
      const propertyId = ctx.propertyId!
      const targetDate = new Date(input.date + "T00:00:00.000Z")
      const nextDate = new Date(targetDate.getTime() + 86_400_000)
      const now = new Date()

      const property = await ctx.db.property.findUnique({
        where: { id: propertyId },
        select: { checkOutHour: true, checkInHour: true },
      })
      const checkOutHour = property?.checkOutHour ?? 12
      const checkInHour = property?.checkInHour ?? 14

      // ── Core data (all in parallel) ────────────────────────────────────────
      const [
        arrivalBookings,
        departureBookings,
        roomStatusGroups,
        totalRooms,
        unassignedCount,
      ] = await Promise.all([
        // Arrivals today — CONFIRMED or CHECKED_IN
        ctx.db.booking.findMany({
          where: {
            propertyId,
            checkInDate: { gte: targetDate, lt: nextDate },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            guest: { select: { firstName: true, lastName: true } },
            rooms: { select: { roomId: true, room: { select: { number: true } } } },
          },
        }),

        // Departures today — CHECKED_IN or CHECKED_OUT
        ctx.db.booking.findMany({
          where: {
            propertyId,
            checkOutDate: { gte: targetDate, lt: nextDate },
            status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
          },
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            checkOutDate: true,
            guest: { select: { firstName: true, lastName: true } },
          },
        }),

        // Room counts by status
        ctx.db.room.groupBy({
          by: ["status"],
          where: { propertyId, isActive: true },
          _count: { id: true },
        }),

        // Total active rooms
        ctx.db.room.count({ where: { propertyId, isActive: true } }),

        // Confirmed arrivals today with no room assigned
        ctx.db.booking.count({
          where: {
            propertyId,
            checkInDate: { gte: targetDate, lt: nextDate },
            status: "CONFIRMED",
            rooms: { none: {} },
          },
        }),
      ])

      // ── Forecast: next 7 days occupancy ───────────────────────────────────
      const forecastCounts = await Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const dayStart = new Date(targetDate.getTime() + i * 86_400_000)
          const dayEnd = new Date(dayStart.getTime() + 86_400_000)
          return ctx.db.booking.count({
            where: {
              propertyId,
              status: { in: ["CONFIRMED", "CHECKED_IN"] },
              checkInDate: { lt: dayEnd },
              checkOutDate: { gt: dayStart },
            },
          })
        }),
      )

      // ── Alerts: dirty rooms assigned to today's arrivals ──────────────────
      const dirtyBeforeCheckinCount = await ctx.db.room.count({
        where: {
          propertyId,
          status: { in: ["DIRTY", "CLEANING"] },
          bookingRooms: {
            some: {
              booking: {
                checkInDate: { gte: targetDate, lt: nextDate },
                status: "CONFIRMED",
              },
            },
          },
        },
      })

      // ── Computed values ───────────────────────────────────────────────────

      const statusMap: Record<string, number> = {}
      for (const row of roomStatusGroups) {
        statusMap[row.status] = row._count.id
      }

      const checkOutDeadline = targetDate.getTime() + checkOutHour * 3_600_000
      const overdueCount = departureBookings.filter(
        (b) => b.status === "CHECKED_IN" && now.getTime() > checkOutDeadline,
      ).length

      const forecast = Array.from({ length: 7 }, (_, i) => {
        const dayStart = new Date(targetDate.getTime() + i * 86_400_000)
        return {
          date: dayStart.toISOString().slice(0, 10),
          occupied: forecastCounts[i] ?? 0,
          total: totalRooms,
        }
      })

      return {
        arrivals: {
          total: arrivalBookings.length,
          checkedIn: arrivalBookings.filter((b) => b.status === "CHECKED_IN").length,
          remaining: arrivalBookings.filter((b) => b.status === "CONFIRMED").length,
          list: arrivalBookings,
        },
        departures: {
          total: departureBookings.length,
          checkedOut: departureBookings.filter((b) => b.status === "CHECKED_OUT").length,
          remaining: departureBookings.filter((b) => b.status === "CHECKED_IN").length,
          overdueCount,
          list: departureBookings,
        },
        roomStatus: {
          occupied: statusMap["OCCUPIED"] ?? 0,
          cleanAvailable: (statusMap["CLEAN"] ?? 0) + (statusMap["INSPECTED"] ?? 0),
          dirty: statusMap["DIRTY"] ?? 0,
          maintenance: statusMap["MAINTENANCE"] ?? 0,
          cleaning: statusMap["CLEANING"] ?? 0,
          total: totalRooms,
        },
        alerts: {
          overdueCount,
          dirtyBeforeCheckinCount,
          unassignedCount,
          total: overdueCount + dirtyBeforeCheckinCount + unassignedCount,
        },
        forecast,
        checkInHour,
        checkOutHour,
        date: input.date,
      }
    }),

  // ─── E3-S8: Reports ──────────────────────────────────────────────────────

  getOccupancy: staffProcedure
    .input(
      z.object({
        from: z.string().date("Invalid date"),
        to:   z.string().date("Invalid date"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const propertyId = ctx.propertyId!
      const from = new Date(input.from + "T00:00:00.000Z")
      const to   = new Date(input.to   + "T00:00:00.000Z")

      const [totalRooms, bookings] = await Promise.all([
        ctx.db.room.count({ where: { propertyId, isActive: true } }),
        ctx.db.booking.findMany({
          where: {
            propertyId,
            status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            checkInDate:  { lt: new Date(to.getTime() + 86_400_000) },
            checkOutDate: { gt: from },
          },
          select: { checkInDate: true, checkOutDate: true },
        }),
      ])

      const days: Array<{ date: string; occupied: number; total: number; pct: number }> = []
      let cur = from
      while (cur <= to) {
        const next = new Date(cur.getTime() + 86_400_000)
        const occupied = bookings.filter(
          (b) => b.checkInDate < next && b.checkOutDate > cur,
        ).length
        days.push({
          date: cur.toISOString().slice(0, 10),
          occupied,
          total: totalRooms,
          pct: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
        })
        cur = next
      }
      return { days, totalRooms }
    }),

  getRevenue: staffProcedure
    .input(
      z.object({
        from:    z.string().date("Invalid date"),
        to:      z.string().date("Invalid date"),
        groupBy: z.enum(["day", "week", "month"]).default("day").optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const propertyId = ctx.propertyId!
      const groupBy = input.groupBy ?? "day"
      const from = new Date(input.from + "T00:00:00.000Z")
      const to   = new Date(input.to   + "T00:00:00.000Z")

      function toNum(v: unknown): number {
        if (typeof v === "number") return v
        if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
          return (v as { toNumber: () => number }).toNumber()
        }
        return Number(String(v ?? 0))
      }

      const [totalRooms, bookings, serviceItems] = await Promise.all([
        ctx.db.room.count({ where: { propertyId, isActive: true } }),
        ctx.db.booking.findMany({
          where: {
            propertyId,
            status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            checkInDate:  { lt: new Date(to.getTime() + 86_400_000) },
            checkOutDate: { gt: from },
          },
          select: {
            checkInDate: true, checkOutDate: true, roomPricePerNight: true,
          },
        }),
        ctx.db.folioItem.findMany({
          where: {
            type: "SERVICE",
            isVoided: false,
            chargeDate: { gte: from, lte: new Date(to.getTime() + 86_400_000) },
            folio: { booking: { propertyId } },
          },
          select: { amount: true, chargeDate: true },
        }),
      ])

      // Build per-day buckets
      const dayMap = new Map<string, { roomRev: number; svcRev: number; occupied: number }>()
      let cur = from
      while (cur <= to) {
        dayMap.set(cur.toISOString().slice(0, 10), { roomRev: 0, svcRev: 0, occupied: 0 })
        cur = new Date(cur.getTime() + 86_400_000)
      }

      for (const b of bookings) {
        const pricePerNight = toNum(b.roomPricePerNight)
        let d = new Date(Math.max(b.checkInDate.getTime(), from.getTime()))
        const end = new Date(Math.min(b.checkOutDate.getTime(), to.getTime() + 86_400_000))
        while (d < end) {
          const key = d.toISOString().slice(0, 10)
          const row = dayMap.get(key)
          if (row) { row.roomRev += pricePerNight; row.occupied += 1 }
          d = new Date(d.getTime() + 86_400_000)
        }
      }

      for (const item of serviceItems) {
        const key = item.chargeDate.toISOString().slice(0, 10)
        const row = dayMap.get(key)
        if (row) row.svcRev += toNum(item.amount)
      }

      // Group by day/week/month
      function bucketKey(date: string): string {
        if (groupBy === "day") return date
        if (groupBy === "week") {
          const d = new Date(date + "T00:00:00.000Z")
          const thu = new Date(d)
          thu.setUTCDate(d.getUTCDate() - d.getUTCDay() + 4)
          const week1 = new Date(Date.UTC(thu.getUTCFullYear(), 0, 4))
          const weekNo = 1 + Math.round((thu.getTime() - week1.getTime()) / 604_800_000)
          return `${thu.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
        }
        return date.slice(0, 7)
      }

      const grouped = new Map<string, { roomRev: number; svcRev: number; roomNights: number }>()
      for (const [date, row] of dayMap) {
        const key = bucketKey(date)
        const prev = grouped.get(key) ?? { roomRev: 0, svcRev: 0, roomNights: 0 }
        prev.roomRev   += row.roomRev
        prev.svcRev    += row.svcRev
        prev.roomNights += row.occupied
        grouped.set(key, prev)
      }

      const totalDays = dayMap.size
      const rows = [...grouped.entries()].map(([period, v]) => {
        const totalRev = Math.round((v.roomRev + v.svcRev) * 100) / 100
        const adr = v.roomNights > 0 ? Math.round((v.roomRev / v.roomNights) * 100) / 100 : 0
        const revpar = totalRooms > 0 && totalDays > 0
          ? Math.round((v.roomRev / totalRooms) * 100) / 100
          : 0
        return {
          period,
          roomRevenue: Math.round(v.roomRev * 100) / 100,
          serviceRevenue: Math.round(v.svcRev * 100) / 100,
          totalRevenue: totalRev,
          adr,
          revpar,
          roomNights: v.roomNights,
        }
      })

      const totals = rows.reduce(
        (acc, r) => ({
          roomRevenue:    acc.roomRevenue    + r.roomRevenue,
          serviceRevenue: acc.serviceRevenue + r.serviceRevenue,
          totalRevenue:   acc.totalRevenue   + r.totalRevenue,
          roomNights:     acc.roomNights     + r.roomNights,
        }),
        { roomRevenue: 0, serviceRevenue: 0, totalRevenue: 0, roomNights: 0 },
      )
      const overallAdr    = totals.roomNights > 0 ? Math.round((totals.roomRevenue / totals.roomNights) * 100) / 100 : 0
      const overallRevpar = totalRooms > 0 && totalDays > 0
        ? Math.round((totals.roomRevenue / totalRooms) * 100) / 100
        : 0

      return { rows, groupBy, totalRooms, totals: { ...totals, adr: overallAdr, revpar: overallRevpar } }
    }),

  getChannels: staffProcedure
    .input(
      z.object({
        from: z.string().date("Invalid date"),
        to:   z.string().date("Invalid date"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const propertyId = ctx.propertyId!
      const from = new Date(input.from + "T00:00:00.000Z")
      const to   = new Date(input.to   + "T00:00:00.000Z")

      function toNum(v: unknown): number {
        if (typeof v === "number") return v
        if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
          return (v as { toNumber: () => number }).toNumber()
        }
        return Number(String(v ?? 0))
      }

      const bookings = await ctx.db.booking.findMany({
        where: {
          propertyId,
          status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
          checkInDate: { gte: from, lte: new Date(to.getTime() + 86_400_000) },
        },
        select: { channel: true, roomPricePerNight: true, totalNights: true },
      })

      const map = new Map<string, { count: number; revenue: number }>()
      for (const b of bookings) {
        const ch = b.channel as string
        const rev = toNum(b.roomPricePerNight) * b.totalNights
        const prev = map.get(ch) ?? { count: 0, revenue: 0 }
        prev.count++
        prev.revenue += rev
        map.set(ch, prev)
      }

      return [...map.entries()].map(([channel, v]) => ({
        channel,
        count: v.count,
        revenue: Math.round(v.revenue * 100) / 100,
      }))
    }),

  getArrivalsAndDepartures: staffProcedure
    .input(z.object({ date: z.string().date("Invalid date") }))
    .query(async ({ ctx, input }) => {
      const propertyId = ctx.propertyId!
      const day  = new Date(input.date + "T00:00:00.000Z")
      const next = new Date(day.getTime() + 86_400_000)

      const [arrivals, departures] = await Promise.all([
        ctx.db.booking.findMany({
          where: {
            propertyId,
            checkInDate: { gte: day, lt: next },
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
          },
          include: {
            guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
            roomType: { select: { name: true } },
            rooms: { select: { room: { select: { number: true } } }, take: 1 },
          },
          orderBy: { checkInDate: "asc" },
        }),
        ctx.db.booking.findMany({
          where: {
            propertyId,
            checkOutDate: { gte: day, lt: next },
            status: { in: ["CHECKED_IN", "CHECKED_OUT"] },
          },
          include: {
            guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
            roomType: { select: { name: true } },
            rooms: { select: { room: { select: { number: true } } }, take: 1 },
          },
          orderBy: { checkOutDate: "asc" },
        }),
      ])

      return {
        date: input.date,
        arrivals: arrivals.map((b) => ({
          id: b.id,
          confirmationCode: b.confirmationCode,
          status: b.status as string,
          guest: b.guest,
          roomType: b.roomType.name,
          roomNumber: b.rooms[0]?.room.number ?? null,
          checkInDate:  b.checkInDate.toISOString().slice(0, 10),
          checkOutDate: b.checkOutDate.toISOString().slice(0, 10),
          totalNights: b.totalNights,
        })),
        departures: departures.map((b) => ({
          id: b.id,
          confirmationCode: b.confirmationCode,
          status: b.status as string,
          guest: b.guest,
          roomType: b.roomType.name,
          roomNumber: b.rooms[0]?.room.number ?? null,
          checkInDate:  b.checkInDate.toISOString().slice(0, 10),
          checkOutDate: b.checkOutDate.toISOString().slice(0, 10),
          totalNights: b.totalNights,
        })),
      }
    }),

  // ─── E3-S2: Housekeeping board ────────────────────────────────────────────

  getHousekeepingBoard: staffProcedure.query(async ({ ctx }) => {
    return ctx.db.room.findMany({
      where: {
        propertyId: ctx.propertyId!,
        assignedToId: ctx.auth.staffId,
        isActive: true,
      },
      include: {
        roomType: { select: { id: true, name: true } },
      },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    })
  }),
})
