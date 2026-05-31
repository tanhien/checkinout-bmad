import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangeControls } from "../_components/DateRangeControls"
import { ChannelChart } from "./_components/ChannelChart"

const CHANNEL_LABEL: Record<string, string> = {
  DIRECT: "Trực tiếp", PHONE: "Điện thoại", WALK_IN: "Walk-in",
  OTA: "OTA", KIOSK: "Kiosk",
}

export default async function ChannelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const sp = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const from = typeof sp.from === "string" ? sp.from : new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
  const to   = typeof sp.to   === "string" ? sp.to   : today

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const rows = await caller.report.getChannels({ from, to })
  const totalCount   = rows.reduce((s, r) => s + r.count, 0)
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Kênh bán phòng</h2>
          <p className="text-sm text-gray-500">
            {totalCount} bookings · {from} → {to}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeControls initialFrom={from} initialTo={to} initialCompare={false} showCompare={false} />
          <a
            href={`/api/reports/channels/export?from=${from}&to=${to}`}
            download={`channels-${from}-${to}.csv`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ↓ CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Pie chart */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <ChannelChart rows={rows} />
        </div>

        {/* Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 overflow-hidden self-start">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Kênh</th>
                <th className="px-4 py-3 text-right">Bookings</th>
                <th className="px-4 py-3 text-right">%</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.sort((a, b) => b.count - a.count).map((row) => (
                <tr key={row.channel} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {CHANNEL_LABEL[row.channel] ?? row.channel}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">{row.count}</td>
                  <td className="px-4 py-2 text-right text-gray-500">
                    {totalCount > 0 ? Math.round((row.count / totalCount) * 100) : 0}%
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {row.revenue.toLocaleString("vi-VN")} đ
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td className="px-4 py-2">Tổng</td>
                <td className="px-4 py-2 text-right">{totalCount}</td>
                <td className="px-4 py-2 text-right">100%</td>
                <td className="px-4 py-2 text-right">{totalRevenue.toLocaleString("vi-VN")} đ</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
