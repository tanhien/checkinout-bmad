import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangePicker } from "../_components/DateRangePicker"
import { OccupancyChart } from "../_components/OccupancyChart"

function defaultDates() {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today.getTime() - 29 * 86_400_000).toISOString().slice(0, 10)
  return { from, to }
}

export default async function OccupancyReportPage({
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

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const data = await caller.report.getOccupancy({ from, to })

  const avgPct =
    data.days.length > 0
      ? Math.round(data.days.reduce((s, d) => s + d.pct, 0) / data.days.length)
      : 0
  const maxPct = data.days.length > 0 ? Math.max(...data.days.map((d) => d.pct)) : 0
  const minPct = data.days.length > 0 ? Math.min(...data.days.map((d) => d.pct)) : 0

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker initialFrom={from} initialTo={to} />
        <a
          href={`/api/reports/occupancy?from=${from}&to=${to}`}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Xuất CSV
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Avg. công suất", value: `${avgPct}%` },
          { label: "Cao nhất", value: `${maxPct}%` },
          { label: "Thấp nhất", value: `${minPct}%` },
          { label: "Tổng phòng", value: String(data.totalRooms) },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <OccupancyChart data={data.days} />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Ngày", "Đang ở", "Tổng phòng", "Công suất"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 ${h === "Ngày" ? "text-left" : "text-right"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.days.map((d) => (
                <tr key={d.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{d.date}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{d.occupied}</td>
                  <td className="px-4 py-2.5 text-right text-gray-700">{d.total}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`font-semibold ${d.pct >= 80 ? "text-green-600" : d.pct >= 50 ? "text-blue-600" : "text-gray-500"}`}
                    >
                      {d.pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
