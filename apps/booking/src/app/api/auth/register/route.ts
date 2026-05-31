import { NextRequest, NextResponse } from "next/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { buildGuestCookie, signGuestToken } from "@/lib/auth"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 })
  }

  try {
    const caller = await getPortalCaller()
    const result = await caller.portal.register({
      email: body.email,
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
    })

    const token = await signGuestToken({ guestId: result.guestId, email: result.email })
    const response = NextResponse.json({ guestId: result.guestId, email: result.email, firstName: result.firstName })
    response.cookies.set(buildGuestCookie(token))
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("EMAIL_EXISTS")) {
      return NextResponse.json({ error: "Email này đã được sử dụng." }, { status: 409 })
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi. Vui lòng thử lại." }, { status: 500 })
  }
}
