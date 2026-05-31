import { NextRequest, NextResponse } from "next/server"
import { getPortalCaller } from "@/lib/portal-caller"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json().catch(() => null)
  if (!body?.token || !body?.password) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc." }, { status: 400 })
  }

  try {
    const caller = await getPortalCaller()
    await caller.portal.resetPassword({ token: body.token, password: body.password })
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("INVALID_OR_EXPIRED_TOKEN")) {
      return NextResponse.json({ error: "Liên kết không hợp lệ hoặc đã hết hạn." }, { status: 400 })
    }
    return NextResponse.json({ error: "Đã xảy ra lỗi. Vui lòng thử lại." }, { status: 500 })
  }
}
