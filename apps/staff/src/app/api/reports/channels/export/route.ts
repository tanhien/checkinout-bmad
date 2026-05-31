import type { NextRequest } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const caller = await getServerCaller()
  if (!caller) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const to   = searchParams.get("to")   ?? new Date().toISOString().slice(0, 10)

  const rows = await caller.report.getChannels({ from, to })

  const header = "Channel,Bookings,Revenue\r\n"
  const csv = header + rows.map((r) => `${r.channel},${r.count},${r.revenue}`).join("\r\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="channels-${from}-${to}.csv"`,
    },
  })
}
