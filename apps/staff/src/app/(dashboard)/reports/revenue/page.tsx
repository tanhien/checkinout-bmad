import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangeControls } from "../_components/DateRangeControls"
import { RevenueChart } from "./_components/RevenueChart"

function prevPeriod(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime() + 86_400_000
  const prevTo  = new Date(new Date(from).getTime() - 86_400_000).toISOString().slice(0, 10)
  const prevFrom = new Date(new Date(from).getTime() - ms).toISOString().slice(0, 10)
  return { from: prevFrom, to: prevTo }
}

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ"
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const sp = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const from    = typeof sp.from    === "string" ? sp.from    : new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const to      = typeof sp.to      === "string" ? sp.to      : today
  const compare = sp.compare === "true"
  const groupBy = (typeof sp.groupBy === "string" ? sp.groupBy : "day") as "day" | "week" | "month"

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [current, compareData] = await Promise.all([
    caller.report.getRevenue({ from, to, groupBy }),
    compare ? caller.report.getRevenue({ ...prevPeriod(from, to), groupBy }) : Promise.resolve(null),
  ])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Doanh thu</h2>
          <p className="text-sm text-gray-500">
            Tổng: {fmtVnd(current.totals.totalRevenue)} · {from} → {to}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Group-by selector */}
          <select
            defaultValue={groupBy}
            onChange={(e) => {
              const url = new URL(window.location.href)
              url.searchParams.set("groupBy", e.target.value)
              window.location.href = url.toString()
            }}
            suppressHydrationWarning
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          >
            <option value="day">Theo ngày</option>
            <option value="week">Theo tuần</option>
            <option value="month">Theo tháng</option>
          </select>
          <DateRangeControls initialFrom={from} initialTo={to} initialCompare={compare} extraParams={{ groupBy }} />
          <a
            href={`/api/reports/revenue/export?from=${from}&to=${to}&groupBy=${groupBy}`}
            download={`revenue-${from}-${to}.csv`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ↓ CSV
          </a>
          <a
            href={`/api/reports/revenue/export?from=${from}&to=${to}&groupBy=${groupBy}&format=excel`}
            download={`revenue-${from}-${to}.xlsx`}
            className="rounded-lg border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
          >
            ↓ Excel
          </a>
        </div>
      </div>

      {/* KPI boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <p className="text-xs text-gray-400 mb-1">Doanh thu phòng</p>
          <p className="text-lg font-bold text-gray-900">{fmtVnd(current.totals.roomRevenue)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <p className="text-xs text-gray-400 mb-1">Doanh thu dịch vụ</p>
          <p className="text-lg font-bold text-gray-900">{fmtVnd(current.totals.serviceRevenue)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <p className="text-xs text-gray-400 mb-1">ADR</p>
          <p className="text-lg font-bold text-gray-900">{fmtVnd(current.totals.adr)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
          <p className="text-xs text-gray-400 mb-1">RevPAR</p>
          <p className="text-lg font-bold text-gray-900">{fmtVnd(current.totals.revpar)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <RevenueChart current={current.rows} compare={compareData?.rows} />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Kỳ</th>
              <th className="px-4 py-3 text-right">Phòng</th>
              <th className="px-4 py-3 text-right">DV</th>
              <th className="px-4 py-3 text-right">Tổng</th>
              <th className="px-4 py-3 text-right">ADR</th>
              <th className="px-4 py-3 text-right">RevPAR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {current.rows.map((row) => (
              <tr key={row.period} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-700">{row.period}</td>
                <td className="px-4 py-2 text-right text-gray-700">{fmtVnd(row.roomRevenue)}</td>
                <td className="px-4 py-2 text-right text-gray-700">{fmtVnd(row.serviceRevenue)}</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">{fmtVnd(row.totalRevenue)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{fmtVnd(row.adr)}</td>
                <td className="px-4 py-2 text-right text-gray-500">{fmtVnd(row.revpar)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-4 py-2">Tổng cộng</td>
              <td className="px-4 py-2 text-right">{fmtVnd(current.totals.roomRevenue)}</td>
              <td className="px-4 py-2 text-right">{fmtVnd(current.totals.serviceRevenue)}</td>
              <td className="px-4 py-2 text-right">{fmtVnd(current.totals.totalRevenue)}</td>
              <td className="px-4 py-2 text-right">{fmtVnd(current.totals.adr)}</td>
              <td className="px-4 py-2 text-right">{fmtVnd(current.totals.revpar)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
