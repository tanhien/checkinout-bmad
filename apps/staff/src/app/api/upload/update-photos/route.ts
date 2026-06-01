import { NextRequest, NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getStaffSession()
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.roomTypeId || !Array.isArray(body.photoUrls)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json({ error: "No caller" }, { status: 500 })

  await caller.roomType.updatePhotos({ id: body.roomTypeId, photoUrls: body.photoUrls })
  return NextResponse.json({ success: true })
}
