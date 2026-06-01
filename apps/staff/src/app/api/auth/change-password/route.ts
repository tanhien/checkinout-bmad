import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@hotel/db"
import { getStaffSession } from "@/lib/auth"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { oldPassword, newPassword } = body ?? {}
  if (!oldPassword || !newPassword) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 })
  }

  const staff = await db.staff.findUnique({
    where: { id: session.staffId },
    select: { id: true, passwordHash: true },
  })
  if (!staff) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 })

  const valid = await bcrypt.compare(oldPassword, staff.passwordHash)
  if (!valid) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 401 })

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await db.staff.update({ where: { id: staff.id }, data: { passwordHash } })

  return NextResponse.json({ success: true })
}
