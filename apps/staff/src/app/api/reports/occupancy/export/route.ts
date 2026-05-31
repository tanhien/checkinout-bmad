import type { NextRequest } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const caller = await getServerCaller()
  if (!caller) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from") ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const to   = searchParams.get("to")   ?? new Date().toISOString().slice(0, 10)

  const { days } = await caller.report.getOccupancy({ from, to })

  const header = "Date,Occupied,Total,Occupancy%\r\n"
  const rows = days.map((d) => `${d.date},${d.occupied},${d.total},${d.pct}`).join("\r\n")
  const csv = header + rows

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="occupancy-${from}-${to}.csv"`,
    },
  })
}
