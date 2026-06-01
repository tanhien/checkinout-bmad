import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(req: NextRequest) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const from = sp.get("from") ?? ""
  const to = sp.get("to") ?? ""
  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 })

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await caller.report.getChannels({ from, to })
  const lines = [
    "Kênh,Số booking,Doanh thu (VND)",
    ...data.map((d) => `${d.channel},${d.count},${d.revenue}`),
  ]

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="channels-${from}-to-${to}.csv"`,
    },
  })
}
