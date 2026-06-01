export const runtime = "nodejs"

import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import ExcelJS from "exceljs"

export async function GET(req: NextRequest) {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const from = sp.get("from") ?? ""
  const to = sp.get("to") ?? ""
  const groupBy = (sp.get("groupBy") ?? "day") as "day" | "week" | "month"
  const format = sp.get("format") ?? "csv"

  if (!from || !to) return NextResponse.json({ error: "from and to required" }, { status: 400 })

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await caller.report.getRevenue({ from, to, groupBy })

  if (format === "xlsx") {
    const wb = new ExcelJS.Workbook()
    wb.creator = "Hotel Staff"
    wb.created = new Date()
    const ws = wb.addWorksheet("Doanh thu")

    ws.columns = [
      { header: "Kỳ", key: "period", width: 16 },
      { header: "DT Phòng (₫)", key: "roomRevenue", width: 20 },
      { header: "DT Dịch vụ (₫)", key: "serviceRevenue", width: 20 },
      { header: "Tổng DT (₫)", key: "totalRevenue", width: 20 },
      { header: "Đêm phòng", key: "roomNights", width: 14 },
      { header: "ADR (₫)", key: "adr", width: 18 },
      { header: "RevPAR (₫)", key: "revpar", width: 18 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }

    for (const r of data.rows) {
      ws.addRow({
        period: r.period,
        roomRevenue: r.roomRevenue,
        serviceRevenue: r.serviceRevenue,
        totalRevenue: r.totalRevenue,
        roomNights: r.roomNights,
        adr: r.adr,
        revpar: r.revpar,
      })
    }

    const totalsRow = ws.addRow({
      period: "Tổng",
      roomRevenue: data.totals.roomRevenue,
      serviceRevenue: data.totals.serviceRevenue,
      totalRevenue: data.totals.totalRevenue,
      roomNights: data.totals.roomNights,
      adr: data.totals.adr,
      revpar: data.totals.revpar,
    })
    totalsRow.font = { bold: true }
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } }

    for (let col = 2; col <= 7; col++) {
      ws.getColumn(col).numFmt = "#,##0"
    }

    const buffer = await wb.xlsx.writeBuffer()
    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="revenue-${from}-to-${to}.xlsx"`,
      },
    })
  }

  // CSV
  const lines = [
    "Kỳ,DT Phòng,DT Dịch vụ,Tổng DT,Đêm phòng,ADR,RevPAR",
    ...data.rows.map(
      (r) => `${r.period},${r.roomRevenue},${r.serviceRevenue},${r.totalRevenue},${r.roomNights},${r.adr},${r.revpar}`,
    ),
    `Tổng,${data.totals.roomRevenue},${data.totals.serviceRevenue},${data.totals.totalRevenue},${data.totals.roomNights},${data.totals.adr},${data.totals.revpar}`,
  ]

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="revenue-${from}-to-${to}.csv"`,
    },
  })
}
