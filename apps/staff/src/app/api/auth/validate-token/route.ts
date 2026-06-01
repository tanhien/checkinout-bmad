import { NextRequest, NextResponse } from "next/server"
import { db } from "@hotel/db"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const type = searchParams.get("type") as "onboarding" | "reset" | null

  if (!token || !type) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  const now = new Date()
  const staff = type === "onboarding"
    ? await db.staff.findFirst({
        where: { onboardingToken: token, passwordResetExpiry: { gt: now } },
        select: { id: true, firstName: true, email: true },
      })
    : await db.staff.findFirst({
        where: { passwordResetToken: token, passwordResetExpiry: { gt: now } },
        select: { id: true, firstName: true, email: true },
      })

  if (!staff) return NextResponse.json({ valid: false, error: "Token invalid or expired" })
  return NextResponse.json({ valid: true, staffId: staff.id, firstName: staff.firstName, email: staff.email })
}
