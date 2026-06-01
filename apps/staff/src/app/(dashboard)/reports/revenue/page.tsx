import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangePicker } from "../_components/DateRangePicker"
import { RevenueChart } from "../_components/RevenueChart"

function fmtVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫"
}

function defaultDates() {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today.getTime() - 29 * 86_400_000).toISOString().slice(0, 10)
  return { from, to }
}

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")
  if (!["ADMIN", "MANAGER", "ACCOUNTANT"].includes(session.role)) redirect("/unauthorized")

  const sp = await searchParams
  const get = (k: string): string =>
    (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined)) ?? ""

  const defaults = defaultDates()
  const from = get("from") || defaults.from
  const to = get("to") || defaults.to
  const groupBy = (get("groupBy") || "day") as "day" | "week" | "month"
  const compare = get("compare") === "1"

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const fromMs = new Date(from + "T00:00:00.000Z").getTime()
  const toMs = new Date(to + "T00:00:00.000Z").getTime()
  const prevTo = new Date(fromMs - 86_400_000).toISOString().slice(0, 10)
  const prevFrom = new Date(fromMs - (toMs - fromMs) - 86_400_000).toISOString().slice(0, 10)

  const [current, prev] = await Promise.all([
    caller.report.getRevenue({ from, to, groupBy }),
    compare ? caller.report.getRevenue({ from: prevFrom, to: prevTo, groupBy }) : null,
  ])

  const groupLabel = groupBy === "day" ? "Ngày" : groupBy === "week" ? "Tuần" : "Tháng"

  function buildUrl(overrides: Record<string, string>): string {
    const base = new URLSearchParams({
      from,
      to,
      groupBy,
      ...(compare ? { compare: "1" } : {}),
      ...overrides,
    })
    return `/reports/revenue?${base.toString()}`
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker initialFrom={from} initialTo={to} />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200">
            {(["day", "week", "month"] as const).map((g) => (
              <a
                key={g}
                href={buildUrl({ groupBy: g })}
                className={[
                  "px-3 py-1.5 text-sm font-medium transition-colors",
                  groupBy === g
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                {g === "day" ? "Ngày" : g === "week" ? "Tuần" : "Tháng"}
              </a>
            ))}
          </div>

          <a
            href={buildUrl({ compare: compare ? "0" : "1" })}
            className={[
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              compare
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            ].join(" ")}
          >
            So sánh kỳ trước
          </a>

          <a
            href={`/api/reports/revenue?from=${from}&to=${to}&groupBy=${groupBy}&format=csv`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            CSV
          </a>
          <a
            href={`/api/reports/revenue?from=${from}&to=${to}&groupBy=${groupBy}&format=xlsx`}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Excel
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tổng doanh thu", value: fmtVND(current.totals.totalRevenue) },
          { label: "DT phòng", value: fmtVND(current.totals.roomRevenue) },
          { label: "ADR", value: fmtVND(current.totals.adr) },
          { label: "RevPAR", value: fmtVND(current.totals.revpar) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <RevenueChart current={current.rows} compare={prev?.rows} groupBy={groupBy} />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[groupLabel, "DT Phòng", "DT Dịch vụ", "Tổng DT", "Đêm phòng", "ADR", "RevPAR"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 ${h === groupLabel ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {current.rows.map((r) => (
                <tr key={r.period} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{r.period}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmtVND(r.roomRevenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmtVND(r.serviceRevenue)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{fmtVND(r.totalRevenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{r.roomNights}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmtVND(r.adr)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{fmtVND(r.revpar)}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-gray-900">Tổng</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(current.totals.roomRevenue)}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(current.totals.serviceRevenue)}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(current.totals.totalRevenue)}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{current.totals.roomNights}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(current.totals.adr)}</td>
                <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(current.totals.revpar)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
