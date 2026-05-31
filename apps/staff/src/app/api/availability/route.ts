import { type NextRequest, NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const checkIn = searchParams.get("checkIn") ?? ""
  const checkOut = searchParams.get("checkOut") ?? ""
  const roomTypeId = searchParams.get("roomTypeId") ?? ""
  const adults = Math.max(1, parseInt(searchParams.get("adults") ?? "1", 10))

  if (!checkIn || !checkOut || !roomTypeId) {
    return NextResponse.json({ available: 0 })
  }

  const session = await getStaffSession()
  if (!session) return NextResponse.json({ available: 0 }, { status: 401 })

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json({ available: 0 }, { status: 401 })

  const roomTypes = await caller.availability.check({
    propertyId: session.propertyId,
    checkIn,
    checkOut,
    roomTypeId,
    adults,
    children: 0,
  })

  const match = roomTypes.find((r) => r.id === roomTypeId)
  return NextResponse.json({ available: match?.availableCount ?? 0 })
}
