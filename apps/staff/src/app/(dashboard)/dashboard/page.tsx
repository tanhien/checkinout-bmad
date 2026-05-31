import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { DashboardRefresher } from "./_components/DashboardRefresher"
import { RoomStatusWidget } from "./_components/RoomStatusWidget"
import { ForecastChart } from "./_components/ForecastChart"
import { CallForHelpAlert } from "./_components/CallForHelpAlert"

// ─── Housekeeping view (AC 8) ──────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  CLEAN: "Sạch",
  DIRTY: "Cần dọn",
  CLEANING: "Đang dọn",
  INSPECTED: "Đã kiểm",
  OCCUPIED: "Có khách",
  MAINTENANCE: "Bảo trì",
  RESERVED: "Đã đặt",
}

const STATUS_COLOR: Record<string, string> = {
  CLEAN: "bg-green-100 text-green-800",
  DIRTY: "bg-red-100 text-red-800",
  CLEANING: "bg-purple-100 text-purple-800",
  INSPECTED: "bg-green-100 text-green-800",
  OCCUPIED: "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  RESERVED: "bg-blue-100 text-blue-800",
}

async function HousekeepingDashboard() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const rooms = await caller.report.getHousekeepingBoard()

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Phòng của tôi hôm nay</h1>
      <p className="text-sm text-gray-500 mb-6">{rooms.length} phòng được phân công</p>

      {rooms.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
          <p className="text-gray-400 text-sm">Chưa có phòng nào được phân công cho bạn hôm nay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{room.number}</p>
                  <p className="text-xs text-gray-500">{room.roomType.name} · Tầng {room.floor}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[room.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {STATUS_LABEL[room.status] ?? room.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main front-desk dashboard ─────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  if (session.role === "HOUSEKEEPING") {
    return <HousekeepingDashboard />
  }

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const today = new Date().toISOString().slice(0, 10)
  const data = await caller.report.getDashboard({ date: today })

  const hasAlerts = data.alerts.total > 0

  return (
    <div className="p-6 space-y-6">
      {/* 60s auto-refresh */}
      <DashboardRefresher intervalMs={60_000} />

      {/* E4-S5: Kiosk call-for-help real-time alerts */}
      <CallForHelpAlert propertyId={session.propertyId} />

      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{data.date}</p>
        </div>
        {hasAlerts && (
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {data.alerts.total} cảnh báo
          </span>
        )}
      </div>

      {/* Row 1: Arrivals, Departures, Alerts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Arrivals widget (AC 1) */}
        <Link
          href={"/bookings?filter=arriving-today" as Parameters<typeof Link>[0]["href"]}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-blue-400 transition-shadow block"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Khách đến hôm nay</h2>
          <p className="text-3xl font-bold text-gray-900">{data.arrivals.total}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-700 font-medium">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {data.arrivals.checkedIn} đã check-in
            </span>
            <span className="flex items-center gap-1 text-orange-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              {data.arrivals.remaining} còn lại
            </span>
          </div>
        </Link>

        {/* Departures widget (AC 2) */}
        <Link
          href={"/bookings?filter=departing-today" as Parameters<typeof Link>[0]["href"]}
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 hover:ring-blue-400 transition-shadow block"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Khách đi hôm nay</h2>
          <p className="text-3xl font-bold text-gray-900">{data.departures.total}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-gray-500 font-medium">
              {data.departures.checkedOut} đã checkout
            </span>
            {data.departures.overdueCount > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {data.departures.overdueCount} quá giờ
              </span>
            )}
          </div>
        </Link>

        {/* Alerts widget (AC 4) */}
        <div
          className={`rounded-xl p-5 shadow-sm ring-1 ${hasAlerts ? "bg-red-50 ring-red-200" : "bg-white ring-gray-200"}`}
        >
          <h2 className={`text-sm font-semibold mb-3 ${hasAlerts ? "text-red-800" : "text-gray-700"}`}>
            Cảnh báo
          </h2>
          {hasAlerts ? (
            <ul className="space-y-2 text-sm">
              {data.alerts.overdueCount > 0 && (
                <li className="flex items-center gap-2 text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {data.alerts.overdueCount} checkout quá giờ
                </li>
              )}
              {data.alerts.dirtyBeforeCheckinCount > 0 && (
                <li className="flex items-center gap-2 text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {data.alerts.dirtyBeforeCheckinCount} phòng dirty chưa dọn (có check-in hôm nay)
                </li>
              )}
              {data.alerts.unassignedCount > 0 && (
                <li className="flex items-center gap-2 text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                  {data.alerts.unassignedCount} booking chưa gán phòng
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Không có cảnh báo</p>
          )}
        </div>
      </div>

      {/* Row 2: Room status (WebSocket) + Forecast chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Room status widget with WebSocket (AC 3, 7) */}
        <RoomStatusWidget
          initialCounts={data.roomStatus}
          propertyId={session.propertyId}
        />

        {/* Occupancy forecast (AC 5) */}
        <ForecastChart data={data.forecast} />
      </div>
    </div>
  )
}
