import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DateRangePicker } from "../_components/DateRangePicker"
import { ChannelChart } from "../_components/ChannelChart"

const CHANNEL_LABEL: Record<string, string> = {
  DIRECT: "Trực tiếp",
  KIOSK: "Kiosk",
  PHONE: "Điện thoại",
  WALK_IN: "Walk-in",
  OTA: "OTA",
  ONLINE: "Online",
}

function fmtVND(n: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫"
}

function defaultDates() {
  const today = new Date()
  const to = today.toISOString().slice(0, 10)
  const from = new Date(today.getTime() - 29 * 86_400_000).toISOString().slice(0, 10)
  return { from, to }
}

export default async function ChannelsReportPage({
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

  const data = await caller.report.getChannels({ from, to })
  const totalBookings = data.reduce((s, d) => s + d.count, 0)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangePicker initialFrom={from} initialTo={to} />
        <a
          href={`/api/reports/channels?from=${from}&to=${to}`}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Xuất CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-500">Tổng booking</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <p className="text-xs text-gray-500">Tổng doanh thu</p>
          <p className="mt-1 text-lg font-bold text-gray-900">{fmtVND(totalRevenue)}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
          Không có dữ liệu trong khoảng thời gian này
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ChannelChart data={data} />

          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {["Kênh", "Booking", "%", "Doanh thu"].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 ${h === "Kênh" ? "text-left" : "text-right"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {data.map((d) => (
                    <tr key={d.channel} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-700">
                        {CHANNEL_LABEL[d.channel] ?? d.channel}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">{d.count}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500">
                        {totalBookings > 0
                          ? Math.round((d.count / totalBookings) * 100)
                          : 0}
                        %
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-700">
                        {fmtVND(d.revenue)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-4 py-2.5 text-gray-900">Tổng</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">{totalBookings}</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">100%</td>
                    <td className="px-4 py-2.5 text-right text-gray-900">{fmtVND(totalRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
