import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.name || !body?.email || !body?.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const key = process.env["RESEND_API_KEY"]
  if (key && body.to) {
    const resend = new Resend(key)
    await resend.emails.send({
      from: "Hotel Contact Form <noreply@hotel.local>",
      to: body.to,
      subject: `Liên hệ từ ${body.name}`,
      html: `<p><b>Tên:</b> ${body.name}</p><p><b>Email:</b> ${body.email}</p><p><b>Nội dung:</b></p><p>${body.message}</p>`,
    }).catch(() => {/* silent fail */})
  }

  return NextResponse.json({ sent: true })
}
