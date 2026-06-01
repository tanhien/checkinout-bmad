import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@hotel/db"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  const { token, type, password } = body ?? {}

  if (!token || !type || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Mật khẩu không đủ yêu cầu (≥8 ký tự, 1 chữ hoa, 1 số)" }, { status: 400 })
  }

  const now = new Date()
  const staff = type === "onboarding"
    ? await db.staff.findFirst({ where: { onboardingToken: token, passwordResetExpiry: { gt: now } } })
    : await db.staff.findFirst({ where: { passwordResetToken: token, passwordResetExpiry: { gt: now } } })

  if (!staff) return NextResponse.json({ error: "Link không hợp lệ hoặc đã hết hạn." }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)
  await db.staff.update({
    where: { id: staff.id },
    data: { passwordHash, onboardingToken: null, passwordResetToken: null, passwordResetExpiry: null },
  })

  return NextResponse.json({ success: true })
}
