import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@hotel/db"
import { Resend } from "resend"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.email) return NextResponse.json({ sent: true }) // Always succeed

  const staff = await db.staff.findUnique({
    where: { email: String(body.email).toLowerCase() },
    select: { id: true, firstName: true, email: true, isActive: true },
  })

  if (staff?.isActive) {
    const token = randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await db.staff.update({
      where: { id: staff.id },
      data: { passwordResetToken: token, passwordResetExpiry: expiry },
    })

    const key = process.env["RESEND_API_KEY"]
    if (key) {
      const resend = new Resend(key)
      const url = `${process.env["NEXTAUTH_URL"] ?? "http://localhost:3001"}/set-password/${token}?type=reset`
      await resend.emails.send({
        from: "Hotel System <noreply@hotel.local>",
        to: staff.email,
        subject: "Đặt lại mật khẩu tài khoản nhân viên",
        html: `<p>Kính gửi ${staff.firstName},</p><p><a href="${url}">Nhấp vào đây để đặt lại mật khẩu</a> (hiệu lực 24 giờ)</p>`,
      }).catch(() => {/* silent fail */})
    }
  }

  return NextResponse.json({ sent: true })
}
