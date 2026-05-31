import Link from "next/link"
import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { GuestProfileClient } from "./_components/GuestProfileClient"

// ─── Avatar helpers (same as search page) ────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-green-500", "bg-amber-500",
  "bg-pink-500",  "bg-teal-500",  "bg-indigo-500", "bg-rose-500",
]

function avatarBg(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!
}

function initials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase()
}

// ─── Status / channel labels ──────────────────────────────────────────────────

const BOOKING_STATUS_BADGE: Record<string, string> = {
  CONFIRMED:   "bg-blue-100 text-blue-800",
  CHECKED_IN:  "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-800",
  NO_SHOW:     "bg-orange-100 text-orange-800",
}
const BOOKING_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Đã đặt", CHECKED_IN: "Đang ở", CHECKED_OUT: "Đã trả",
  CANCELLED: "Đã hủy", NO_SHOW: "Không đến",
}

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const { id: guestId } = await params

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const guest = await caller.guest.getProfile({ guestId })

  const isManager = ["MANAGER", "ADMIN"].includes(session.role)
  const bg = avatarBg(guest.id)

  // Serialize for client
  const guestForClient = {
    id: guest.id,
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    nationality: guest.nationality,
    dateOfBirth: guest.dateOfBirth?.toISOString() ?? null,
    tag: guest.tag as string,
    language: guest.language,
  }

  const notesForClient = guest.notes.map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt.toISOString(),
    author: n.author,
  }))

  const totalBookings = guest.bookings.length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/guests" className="hover:text-gray-700">
          Khách hàng
        </Link>
        <span>/</span>
        <span className="text-gray-700">
          {guest.firstName} {guest.lastName}
        </span>
      </div>

      {/* VIP banner */}
      {guest.tag === "VIP" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-3">
          <p className="text-sm font-medium text-yellow-800">
            ⭐ Khách VIP — Ưu tiên phục vụ và giao tiếp cá nhân hóa
          </p>
        </div>
      )}

      {/* Blacklist banner */}
      {guest.tag === "BLACKLIST" && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-800">
            🚫 Khách Blacklist — Cần xác nhận từ Manager trước khi tạo booking
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white ${bg}`}
        >
          {initials(guest.firstName, guest.lastName)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {guest.firstName} {guest.lastName}
          </h1>
          <p className="text-sm text-gray-500">
            {guest.email} · {totalBookings} lần ở
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Contact + Notes (client-interactive) */}
        <div className="lg:col-span-1 space-y-6">
          <GuestProfileClient
            guest={guestForClient}
            notes={notesForClient}
            isManager={isManager}
          />
        </div>

        {/* Right: Booking history (server-rendered) */}
        <div className="lg:col-span-1">
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Lịch sử đặt phòng{" "}
              <span className="text-gray-400 font-normal">(10 gần nhất)</span>
            </h2>

            {guest.bookings.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có booking nào</p>
            ) : (
              <div className="space-y-2">
                {guest.bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}` as `/bookings/${string}`}
                    className="block rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        {b.confirmationCode}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${BOOKING_STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {b.roomType.name} ·{" "}
                      {b.checkInDate.toISOString().slice(0, 10)} →{" "}
                      {b.checkOutDate.toISOString().slice(0, 10)} ·{" "}
                      {b.totalNights} đêm
                    </p>
                    {b.rooms[0] && (
                      <p className="text-xs text-gray-400">
                        Phòng {b.rooms[0].room.number}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
