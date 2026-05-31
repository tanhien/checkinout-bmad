import Link from "next/link"
import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED:  "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT:"bg-gray-100 text-gray-700",
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Đã đặt", CHECKED_IN: "Đang ở", CHECKED_OUT: "Đã trả",
}

export default async function ArrivalsDeparturesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const sp = await searchParams
  const today = new Date().toISOString().slice(0, 10)
  const date  = typeof sp.date === "string" ? sp.date : today

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const data = await caller.report.getArrivalsAndDepartures({ date })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Đến & Đi</h2>
          <p className="text-sm text-gray-500">
            {data.arrivals.length} đến · {data.departures.length} đi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            defaultValue={date}
            onBlur={(e) => {
              if (e.target.value) window.location.href = `?date=${e.target.value}`
            }}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
          />
          <a
            href={`/api/reports/arrivals-departures/export?date=${date}`}
            download={`arrivals-${date}.csv`}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            ↓ CSV
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Arrivals */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 bg-green-50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-green-800">
              ✈ Đến hôm nay ({data.arrivals.length})
            </h3>
          </div>
          {data.arrivals.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Không có khách đến</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.arrivals.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}` as `/bookings/${string}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {b.guest.firstName} {b.guest.lastName}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? "bg-gray-100"}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{b.confirmationCode}</span> ·{" "}
                    {b.roomType}{b.roomNumber ? ` · Phòng ${b.roomNumber}` : " · Chưa gán phòng"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.checkInDate} → {b.checkOutDate} · {b.totalNights} đêm
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Departures */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-gray-700">
              🚪 Trả phòng hôm nay ({data.departures.length})
            </h3>
          </div>
          {data.departures.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Không có khách trả phòng</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.departures.map((b) => (
                <Link
                  key={b.id}
                  href={`/bookings/${b.id}` as `/bookings/${string}`}
                  className="block px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {b.guest.firstName} {b.guest.lastName}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[b.status] ?? "bg-gray-100"}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-mono">{b.confirmationCode}</span> ·{" "}
                    {b.roomType}{b.roomNumber ? ` · Phòng ${b.roomNumber}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {b.checkInDate} → {b.checkOutDate}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
