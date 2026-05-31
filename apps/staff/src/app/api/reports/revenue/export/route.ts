export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"
import ExcelJS from "exceljs"

export async function GET(req: NextRequest) {
  const caller = await getServerCaller()
  if (!caller) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const from    = searchParams.get("from")    ?? new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const to      = searchParams.get("to")      ?? new Date().toISOString().slice(0, 10)
  const groupBy = (searchParams.get("groupBy") ?? "day") as "day" | "week" | "month"
  const format  = searchParams.get("format")  ?? "csv"

  const { rows, totals } = await caller.report.getRevenue({ from, to, groupBy })

  if (format === "excel") {
    // Build Excel workbook using exceljs
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Revenue")

    ws.columns = [
      { header: "Period",          key: "period",         width: 14 },
      { header: "Room Revenue",    key: "roomRevenue",    width: 16 },
      { header: "Service Revenue", key: "serviceRevenue", width: 18 },
      { header: "Total Revenue",   key: "totalRevenue",   width: 16 },
      { header: "ADR",             key: "adr",            width: 14 },
      { header: "RevPAR",          key: "revpar",         width: 14 },
      { header: "Room Nights",     key: "roomNights",     width: 14 },
    ]

    // Style header row
    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }

    for (const row of rows) ws.addRow(row)

    // Totals row
    const totalsRow = ws.addRow({
      period: "TOTAL",
      roomRevenue:    totals.roomRevenue,
      serviceRevenue: totals.serviceRevenue,
      totalRevenue:   totals.totalRevenue,
      adr: totals.adr,
      revpar: totals.revpar,
      roomNights: totals.roomNights,
    })
    totalsRow.font = { bold: true }
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } }

    const buffer = await wb.xlsx.writeBuffer()
    return new Response(new Uint8Array(buffer as ArrayBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="revenue-${from}-${to}.xlsx"`,
      },
    })
  }

  // CSV
  const header = "Period,RoomRevenue,ServiceRevenue,TotalRevenue,ADR,RevPAR,RoomNights\r\n"
  const csvRows = rows.map((r) =>
    `${r.period},${r.roomRevenue},${r.serviceRevenue},${r.totalRevenue},${r.adr},${r.revpar},${r.roomNights}`,
  ).join("\r\n")

  return new Response(header + csvRows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revenue-${from}-${to}.csv"`,
    },
  })
}
