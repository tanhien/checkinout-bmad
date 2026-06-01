import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(req: NextRequest) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["ADMIN", "MANAGER", "ACCOUNTANT", "FRONT_DESK"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const date = sp.get("date") ?? ""
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 })

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await caller.report.getArrivalsAndDepartures({ date })
  const header = "Type,Mã đặt phòng,Khách,Email,SĐT,Loại phòng,Số phòng,Check-in,Check-out,Trạng thái"
  const rows = [
    ...data.arrivals.map(
      (b) => `Arrival,${b.confirmationCode},${b.guest.firstName} ${b.guest.lastName},${b.guest.email},${b.guest.phone ?? ""},${b.roomType},${b.roomNumber ?? ""},${b.checkInDate},${b.checkOutDate},${b.status}`,
    ),
    ...data.departures.map(
      (b) => `Departure,${b.confirmationCode},${b.guest.firstName} ${b.guest.lastName},${b.guest.email},${b.guest.phone ?? ""},${b.roomType},${b.roomNumber ?? ""},${b.checkInDate},${b.checkOutDate},${b.status}`,
    ),
  ]

  return new NextResponse([header, ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arrivals-departures-${date}.csv"`,
    },
  })
}
