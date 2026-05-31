import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { BookingActions } from "./_components/BookingActions"

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Đã đặt",
  CHECKED_IN: "Đang ở",
  CHECKED_OUT: "Đã trả phòng",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Không đến",
}

const ACTION_LABEL: Record<string, string> = {
  CREATE: "Tạo booking",
  UPDATE: "Cập nhật",
  CANCEL: "Hủy booking",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  NO_SHOW: "Đánh dấu không đến",
  ASSIGN: "Gán phòng",
  UNASSIGN: "Bỏ gán phòng",
  BULK_CREATE: "Tạo hàng loạt",
  STATUS_CHANGE: "Đổi trạng thái",
  MAINTENANCE: "Bảo trì",
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (v != null && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(String(v ?? 0))
}

function fmtVnd(amount: unknown): string {
  return toNum(amount).toLocaleString("vi-VN") + " VND"
}

function fmtDate(d: Date | null): string {
  if (!d) return "—"
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(d: Date | null): string {
  if (!d) return "—"
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC"
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const { id: bookingId } = await params

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const property = await caller.property.getConfig()
  const booking = await caller.booking.getById({ bookingId })

  // Check-in window: now >= checkInDate + checkInHour
  const now = new Date()
  const checkInHour = property.checkInHour ?? 14
  const earliestCheckIn = new Date(booking.checkInDate.getTime() + checkInHour * 3_600_000)
  const canCheckIn = now >= earliestCheckIn

  // Folio totals
  const folio = booking.folio
  const chargesTotal = folio
    ? folio.items
        .filter((i) => !i.isVoided)
        .reduce((sum, i) => sum + toNum(i.amount), 0)
    : 0
  const paymentsTotal = folio
    ? folio.payments.reduce((sum, p) => sum + toNum(p.amount), 0)
    : 0
  const balance = chargesTotal - paymentsTotal

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={"/bookings" as Parameters<typeof Link>[0]["href"]} className="hover:text-gray-700">
          Đặt phòng
        </Link>
        <span>/</span>
        <span className="font-mono text-gray-700">{booking.confirmationCode}</span>
      </div>

      {/* Blacklist banner */}
      {booking.guest.tag === "BLACKLIST" && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4">
          <p className="text-sm font-semibold text-red-800">
            Khách trong danh sách Blacklist — Cần xác nhận từ Manager trước khi tiến hành
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 font-mono">
              {booking.confirmationCode}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_BADGE[booking.status] ?? "bg-gray-100 text-gray-700"}`}
            >
              {STATUS_LABEL[booking.status] ?? booking.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Check-in: {fmtDate(booking.checkInDate)} · Check-out: {fmtDate(booking.checkOutDate)} ·{" "}
            {booking.totalNights} đêm
          </p>
        </div>

        {/* Actions */}
        <BookingActions
          bookingId={bookingId}
          status={booking.status}
          hasRooms={booking.rooms.length > 0}
          canCheckIn={canCheckIn}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Guest info */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Khách hàng</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Tên:</span>
              <span className="text-gray-900 font-medium">
                {booking.guest.firstName} {booking.guest.lastName}
                {booking.guest.tag === "VIP" && (
                  <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">VIP</span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Email:</span>
              <span className="text-gray-700">{booking.guest.email}</span>
            </div>
            {booking.guest.phone && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">Điện thoại:</span>
                <span className="text-gray-700">{booking.guest.phone}</span>
              </div>
            )}
            {booking.guest.nationality && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">Quốc tịch:</span>
                <span className="text-gray-700">{booking.guest.nationality}</span>
              </div>
            )}
          </div>
        </div>

        {/* Booking info */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Chi tiết đặt phòng</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Loại phòng:</span>
              <span className="text-gray-900">{booking.roomType.name}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Số khách:</span>
              <span className="text-gray-700">
                {booking.adults} người lớn{booking.children > 0 ? `, ${booking.children} trẻ em` : ""}
              </span>
            </div>
            {booking.ratePlan && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0">Gói giá:</span>
                <span className="text-gray-700">
                  {booking.ratePlan.name}
                  {booking.ratePlan.isNonRefundable && (
                    <span className="ml-1.5 text-xs text-orange-600">(không hoàn tiền)</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-24 shrink-0">Giá/đêm:</span>
              <span className="text-gray-700">{fmtVnd(booking.roomPricePerNight)}</span>
            </div>
            {booking.specialRequests && (
              <div className="flex gap-2">
                <span className="text-gray-500 w-24 shrink-0 mt-0.5">Yêu cầu:</span>
                <span className="text-gray-700 whitespace-pre-line">{booking.specialRequests}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assigned rooms */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Phòng được gán</h2>
          {booking.rooms.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa gán phòng</p>
          ) : (
            <ul className="space-y-2">
              {booking.rooms.map((br) => (
                <li key={br.id} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold text-gray-900 text-base">
                    Phòng {br.room.number}
                  </span>
                  <span className="text-gray-500">Tầng {br.room.floor}</span>
                  <span className="text-xs text-gray-400">
                    {br.room.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {booking.actualCheckIn && (
            <p className="mt-3 text-xs text-gray-400">
              Check-in lúc: {fmtDateTime(booking.actualCheckIn)}
            </p>
          )}
          {booking.actualCheckOut && (
            <p className="text-xs text-gray-400">
              Check-out lúc: {fmtDateTime(booking.actualCheckOut)}
            </p>
          )}
        </div>

        {/* Folio summary */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Folio</h2>
            <Link
              href={`/bookings/${bookingId}/folio` as `/bookings/${string}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Quản lý folio →
            </Link>
          </div>
          {!folio ? (
            <p className="text-sm text-gray-400">Không có folio</p>
          ) : (
            <div className="space-y-3">
              {/* Items */}
              <div className="space-y-1.5">
                {folio.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex justify-between text-sm ${item.isVoided ? "line-through text-gray-400" : "text-gray-700"}`}
                  >
                    <span className="flex-1 mr-2">
                      {item.description}
                      {toNum(item.quantity) > 1 && (
                        <span className="text-xs text-gray-400 ml-1">×{toNum(item.quantity)}</span>
                      )}
                    </span>
                    <span className={toNum(item.amount) < 0 ? "text-green-600" : ""}>
                      {fmtVnd(item.amount)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1.5 text-sm">
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Tổng phí</span>
                  <span>{fmtVnd(chargesTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Đã thanh toán</span>
                  <span className="text-green-600">−{fmtVnd(paymentsTotal)}</span>
                </div>
                <div
                  className={`flex justify-between font-semibold text-base pt-1 border-t border-gray-100 ${balance > 0 ? "text-red-600" : balance < 0 ? "text-gray-500" : "text-green-600"}`}
                >
                  <span>Còn lại</span>
                  <span>{fmtVnd(balance)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-400 pt-1">
                <span>
                  Folio:{" "}
                  <span className={folio.status === "SETTLED" ? "text-green-600" : "text-gray-500"}>
                    {folio.status === "SETTLED" ? "Đã thanh toán" : "Chưa thanh toán"}
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit log timeline */}
      {booking.auditLogs.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Lịch sử</h2>
          <ol className="relative border-l border-gray-200 space-y-4 ml-3">
            {booking.auditLogs.map((log) => (
              <li key={log.id} className="ml-4">
                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-400" />
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  <span className="text-xs text-gray-400">
                    {log.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC
                  </span>
                </div>
                {log.staff && (
                  <p className="text-xs text-gray-500">
                    {log.staff.firstName} {log.staff.lastName} · {log.staff.role}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
