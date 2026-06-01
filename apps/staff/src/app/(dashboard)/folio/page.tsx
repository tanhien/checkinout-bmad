import Link from "next/link"
import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ"
}

type FolioRow = {
  id: string
  bookingId: string
  confirmationCode: string
  bookingStatus: string
  checkInDate: string
  checkOutDate: string
  guestName: string
  roomNumber: string
  chargesTotal: number
  paymentsTotal: number
  balance: number
}

const STATUS_META: Record<string, { label: string; badge: string; row: string }> = {
  CONFIRMED:   { label: "Xác nhận",     badge: "bg-blue-100 text-blue-800",   row: "" },
  CHECKED_IN:  { label: "Đang lưu trú", badge: "bg-green-100 text-green-800", row: "bg-green-50/30" },
  CHECKED_OUT: { label: "Đã trả phòng", badge: "bg-orange-100 text-orange-700 font-semibold", row: "bg-orange-50/30" },
  CANCELLED:   { label: "Đã hủy",       badge: "bg-red-100 text-red-700",     row: "" },
}

function StatCard({ label, value, sub, color = "gray" }: { label: string; value: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    gray:   "bg-white ring-1 ring-gray-200",
    red:    "bg-red-50 ring-1 ring-red-200",
    green:  "bg-green-50 ring-1 ring-green-200",
    orange: "bg-orange-50 ring-1 ring-orange-200",
    blue:   "bg-blue-50 ring-1 ring-blue-200",
  }
  const textColor: Record<string, string> = {
    gray: "text-gray-900", red: "text-red-700", green: "text-green-700",
    orange: "text-orange-700", blue: "text-blue-700",
  }
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${textColor[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function FolioTable({ folios, emptyMsg }: { folios: FolioRow[]; emptyMsg: string }) {
  if (folios.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">{emptyMsg}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide bg-gray-50/60">
            <th className="px-4 py-2.5 text-left">Phòng / Mã</th>
            <th className="px-4 py-2.5 text-left">Khách</th>
            <th className="px-4 py-2.5 text-left">Ngày lưu trú</th>
            <th className="px-4 py-2.5 text-left">Trạng thái</th>
            <th className="px-4 py-2.5 text-right">Phí</th>
            <th className="px-4 py-2.5 text-right">Đã TT</th>
            <th className="px-4 py-2.5 text-right">Còn lại</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {folios.map((f) => {
            const meta = STATUS_META[f.bookingStatus]
            const isOverdue = f.bookingStatus === "CHECKED_OUT" && f.balance > 0
            return (
              <tr key={f.id} className={`hover:bg-gray-50 transition-colors ${meta?.row ?? ""} ${isOverdue ? "ring-inset ring-1 ring-orange-200" : ""}`}>
                <td className="px-4 py-3">
                  <div className="font-semibold text-gray-900">
                    {f.roomNumber !== "—" ? `Phòng ${f.roomNumber}` : (
                      <span className="text-gray-400 font-normal italic text-xs">Chưa xếp phòng</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{f.confirmationCode}</div>
                </td>
                <td className="px-4 py-3 text-gray-800 font-medium">{f.guestName}</td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {f.checkInDate}<br className="sm:hidden" />
                  <span className="hidden sm:inline"> → </span>
                  {f.checkOutDate}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${meta?.badge ?? "bg-gray-100 text-gray-600"}`}>
                      {meta?.label ?? f.bookingStatus}
                    </span>
                    {isOverdue && <span className="text-xs text-orange-600 font-medium">⚠ Quá hạn</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmtVnd(f.chargesTotal)}</td>
                <td className="px-4 py-3 text-right text-green-600 tabular-nums">{fmtVnd(f.paymentsTotal)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  <span className={`font-bold ${f.balance > 0 ? (isOverdue ? "text-orange-600" : "text-red-600") : "text-green-600"}`}>
                    {fmtVnd(f.balance)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/bookings/${f.bookingId}/folio` as `/bookings/${string}`}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors ${
                      isOverdue ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Mở folio →
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function FolioListPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const folios = await caller.folio.listOpen()

  const checkedIn   = folios.filter((f) => f.bookingStatus === "CHECKED_IN")
  const confirmed   = folios.filter((f) => f.bookingStatus === "CONFIRMED")
  const checkedOut  = folios.filter((f) => f.bookingStatus === "CHECKED_OUT")
  const other       = folios.filter((f) => !["CHECKED_IN", "CONFIRMED", "CHECKED_OUT"].includes(f.bookingStatus))

  const totalBalance     = folios.reduce((s, f) => s + f.balance, 0)
  const overdueBalance   = checkedOut.reduce((s, f) => s + f.balance, 0)
  const activeBalance    = checkedIn.reduce((s, f) => s + f.balance, 0)

  const sections = [
    { key: "overdue", title: "Đã trả phòng — Chưa thanh toán", items: checkedOut, emptyMsg: "", urgent: true },
    { key: "checkin", title: "Đang lưu trú", items: checkedIn, emptyMsg: "Không có khách đang lưu trú", urgent: false },
    { key: "confirmed", title: "Đặt phòng xác nhận", items: confirmed, emptyMsg: "", urgent: false },
    { key: "other", title: "Khác", items: other, emptyMsg: "", urgent: false },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Folio & Thanh toán</h1>
        <p className="text-sm text-gray-500 mt-0.5">{folios.length} folio đang mở</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng chưa thanh toán"
          value={fmtVnd(totalBalance)}
          sub={`${folios.length} folio`}
          color={totalBalance > 0 ? "red" : "green"}
        />
        <StatCard
          label="Quá hạn (đã trả phòng)"
          value={fmtVnd(overdueBalance)}
          sub={`${checkedOut.length} booking`}
          color={overdueBalance > 0 ? "orange" : "gray"}
        />
        <StatCard
          label="Đang lưu trú"
          value={fmtVnd(activeBalance)}
          sub={`${checkedIn.length} phòng`}
          color="blue"
        />
        <StatCard
          label="Xác nhận (chưa nhận phòng)"
          value={fmtVnd(confirmed.reduce((s, f) => s + f.balance, 0))}
          sub={`${confirmed.length} booking`}
          color="gray"
        />
      </div>

      {/* All settled */}
      {folios.length === 0 && (
        <div className="rounded-xl bg-green-50 ring-1 ring-green-200 p-12 text-center">
          <p className="text-5xl mb-3">✅</p>
          <p className="text-gray-700 font-semibold text-lg">Tất cả folio đã được quyết toán</p>
          <p className="text-gray-500 text-sm mt-1">Không có folio nào đang mở</p>
        </div>
      )}

      {/* Sections */}
      {sections.map(({ key, title, items, emptyMsg, urgent }) =>
        items.length === 0 && !emptyMsg ? null : (
          <section key={key}>
            <div className="flex items-center gap-2 mb-3">
              {urgent && items.length > 0 && (
                <span className="text-orange-500 text-base">⚠️</span>
              )}
              <h2 className={`text-sm font-semibold uppercase tracking-wide ${
                urgent && items.length > 0 ? "text-orange-700" : "text-gray-500"
              }`}>
                {title}
              </h2>
              {items.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  urgent ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                }`}>
                  {items.length}
                </span>
              )}
            </div>

            <div className={`rounded-xl bg-white shadow-sm overflow-hidden ${
              urgent && items.length > 0
                ? "ring-2 ring-orange-300"
                : "ring-1 ring-gray-200"
            }`}>
              <FolioTable folios={items} emptyMsg={emptyMsg} />
            </div>
          </section>
        )
      )}
    </div>
  )
}
