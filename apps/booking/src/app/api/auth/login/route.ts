import { NextRequest, NextResponse } from "next/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { buildGuestCookie, signGuestToken } from "@/lib/auth"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email và mật khẩu là bắt buộc." }, { status: 400 })
  }

  try {
    const caller = await getPortalCaller()
    const result = await caller.portal.login({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe ?? false,
    })

    const token = await signGuestToken({ guestId: result.guestId, email: result.email }, result.rememberMe)
    const response = NextResponse.json({ guestId: result.guestId, email: result.email, firstName: result.firstName })
    response.cookies.set(buildGuestCookie(token, result.rememberMe))
    return response
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Đã xảy ra lỗi."
    if (message.includes("INVALID_CREDENTIALS")) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 })
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi. Vui lòng thử lại." }, { status: 500 })
  }
}
