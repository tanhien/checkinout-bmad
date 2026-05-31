import { type NextRequest, NextResponse } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId") ?? ""
  if (!bookingId) return NextResponse.json([])

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json([], { status: 401 })

  const rooms = await caller.room.availableForBooking({ bookingId })
  return NextResponse.json(rooms)
}
