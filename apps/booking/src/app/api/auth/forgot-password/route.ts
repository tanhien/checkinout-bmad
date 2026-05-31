import { NextRequest, NextResponse } from "next/server"
import { getPortalCaller } from "@/lib/portal-caller"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.email) return NextResponse.json({ error: "Email là bắt buộc." }, { status: 400 })

  try {
    const caller = await getPortalCaller()
    await caller.portal.forgotPassword({ email: body.email })
    return NextResponse.json({ sent: true })
  } catch {
    return NextResponse.json({ sent: true }) // Always succeed to prevent email enumeration
  }
}
