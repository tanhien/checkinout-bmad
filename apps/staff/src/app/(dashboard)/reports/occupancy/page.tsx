import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangeControls } from "../_components/DateRangeControls"
import { OccupancyChart } from "./_components/OccupancyChart"

function prevPeriod(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime() + 86_400_000
  const prevTo  = new Date(new Date(from).getTime() - 86_400_000).toISOString().slice(0, 10)
  const prevFrom = new Date(new Date(from).getTime() - ms).toISOString().slice(0, 10)
  return { from: prevFrom, to: prevTo }
}

export default async function OccupancyPage({
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

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [current, compareData] = await Promise.all([
    caller.report.getOccupancy({ from, to }),
    compare ? caller.report.getOccupancy(prevPeriod(from, to)) : Promise.resolve(null),
  ])

  const avgPct = current.days.length > 0
    ? Math.round(current.days.reduce((s, d) => s + d.pct, 0) / current.days.length)
    : 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Công suất phòng</h2>
          <p className="text-sm text-gray-500">
            TB {avgPct}% · {from} → {to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeControls initialFrom={from} initialTo={to} initialCompare={compare} />
          <a
            href={`/api/reports/occupancy/export?from=${from}&to=${to}`}
            download={`occupancy-${from}-${to}.csv`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ↓ CSV
          </a>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
        <OccupancyChart
          current={current.days}
          compare={compareData?.days}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Ngày</th>
              <th className="px-4 py-3 text-right">Có khách</th>
              <th className="px-4 py-3 text-right">Tổng phòng</th>
              <th className="px-4 py-3 text-right">Công suất</th>
              {compare && <th className="px-4 py-3 text-right">Kỳ trước</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {current.days.map((row, i) => (
              <tr key={row.date} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-700">{row.date}</td>
                <td className="px-4 py-2 text-right text-gray-700">{row.occupied}</td>
                <td className="px-4 py-2 text-right text-gray-500">{row.total}</td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">{row.pct}%</td>
                {compare && (
                  <td className="px-4 py-2 text-right text-blue-400">
                    {compareData?.days[i]?.pct ?? "—"}%
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td className="px-4 py-2 text-gray-700">Trung bình</td>
              <td className="px-4 py-2 text-right text-gray-700">
                {Math.round(current.days.reduce((s, d) => s + d.occupied, 0) / (current.days.length || 1))}
              </td>
              <td className="px-4 py-2 text-right text-gray-500">{current.totalRooms}</td>
              <td className="px-4 py-2 text-right text-gray-900">{avgPct}%</td>
              {compare && <td />}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
