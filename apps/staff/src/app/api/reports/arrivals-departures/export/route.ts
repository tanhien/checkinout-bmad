import type { NextRequest } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const caller = await getServerCaller()
  if (!caller) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10)

  const { arrivals, departures } = await caller.report.getArrivalsAndDepartures({ date })

  const lines: string[] = ["Type,Code,GuestName,Email,Phone,RoomType,Room,CheckIn,CheckOut,Nights,Status"]

  for (const b of arrivals) {
    lines.push(
      `ARRIVAL,${b.confirmationCode},"${b.guest.firstName} ${b.guest.lastName}",${b.guest.email},${b.guest.phone ?? ""},${b.roomType},${b.roomNumber ?? ""},${b.checkInDate},${b.checkOutDate},${b.totalNights},${b.status}`,
    )
  }
  for (const b of departures) {
    lines.push(
      `DEPARTURE,${b.confirmationCode},"${b.guest.firstName} ${b.guest.lastName}",${b.guest.email},${b.guest.phone ?? ""},${b.roomType},${b.roomNumber ?? ""},${b.checkInDate},${b.checkOutDate},${b.totalNights},${b.status}`,
    )
  }

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arrivals-departures-${date}.csv"`,
    },
  })
}
