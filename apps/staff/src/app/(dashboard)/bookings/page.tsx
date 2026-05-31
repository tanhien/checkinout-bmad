import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { BookingFilters } from "./_components/BookingFilters"

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

const CHANNEL_BADGE: Record<string, string> = {
  DIRECT: "bg-gray-100 text-gray-700",
  KIOSK: "bg-purple-100 text-purple-700",
  PHONE: "bg-blue-100 text-blue-700",
  WALK_IN: "bg-green-100 text-green-700",
  OTA: "bg-orange-100 text-orange-700",
}

const CHANNEL_LABEL: Record<string, string> = {
  DIRECT: "Trực tiếp",
  KIOSK: "Kiosk",
  PHONE: "Điện thoại",
  WALK_IN: "Walk-in",
  OTA: "OTA",
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const params = await searchParams
  const get = (k: string) => (Array.isArray(params[k]) ? (params[k] as string[])[0] : (params[k] as string | undefined)) ?? ""

  // Dashboard filter shortcuts
  const filter = get("filter")
  const today = new Date().toISOString().slice(0, 10)

  let checkInFrom = get("checkInFrom")
  let checkInTo = get("checkInTo")
  let checkOutFrom = get("checkOutFrom")
  let checkOutTo = get("checkOutTo")

  if (filter === "arriving-today") {
    checkInFrom = today
    checkInTo = today
  } else if (filter === "departing-today") {
    checkOutFrom = today
    checkOutTo = today
  }

  const page = Math.max(1, parseInt(get("page") || "1", 10))
  const status = get("status") as "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW" | undefined || undefined
  const search = get("search") || undefined
  const roomTypeId = get("roomTypeId") || undefined
  const channel = get("channel") as "DIRECT" | "KIOSK" | "PHONE" | "WALK_IN" | "OTA" | undefined || undefined
  const sortBy = (get("sortBy") || "checkIn") as "checkIn" | "createdAt"

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [data, roomTypes] = await Promise.all([
    caller.booking.list({
      page,
      status,
      search,
      roomTypeId,
      channel,
      sortBy,
      ...(checkInFrom ? { checkInFrom } : {}),
      ...(checkInTo ? { checkInTo } : {}),
      ...(checkOutFrom ? { checkOutFrom } : {}),
      ...(checkOutTo ? { checkOutTo } : {}),
    }),
    caller.roomType.list(),
  ])

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Danh sách đặt phòng</h1>
          <p className="text-sm text-gray-500">{data.total} kết quả</p>
        </div>
        <Link
          href={"/bookings/new" as Parameters<typeof Link>[0]["href"]}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          + Tạo booking mới
        </Link>
      </div>

      {/* Filters */}
      <BookingFilters
        roomTypes={roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
        initialSearch={search ?? ""}
        initialStatus={status ?? ""}
        initialChannel={channel ?? ""}
        initialRoomTypeId={roomTypeId ?? ""}
        initialCheckInFrom={checkInFrom}
        initialCheckInTo={checkInTo}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {data.bookings.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Không tìm thấy booking nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Mã đặt phòng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Khách
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Loại phòng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Kênh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {data.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/bookings/${b.id}` as Parameters<typeof Link>[0]["href"]}
                        className="font-mono text-xs text-blue-600 hover:underline"
                      >
                        {b.confirmationCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <span className="font-medium">
                        {b.guest.firstName} {b.guest.lastName}
                      </span>
                      {b.guest.tag === "BLACKLIST" && (
                        <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                          Blacklist
                        </span>
                      )}
                      {b.guest.tag === "VIP" && (
                        <span className="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700">
                          VIP
                        </span>
                      )}
                      {b.rooms[0]?.room.number && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          Phòng {b.rooms[0].room.number}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{b.roomType.name}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {b.checkInDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {b.checkOutDate.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${CHANNEL_BADGE[b.channel] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {CHANNEL_LABEL[b.channel] ?? b.channel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Trang {data.page} / {data.totalPages} · {data.total} kết quả
          </span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link
                href={buildPageUrl(params, filter, data.page - 1) as Parameters<typeof Link>[0]["href"]}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                ← Trước
              </Link>
            )}
            {data.page < data.totalPages && (
              <Link
                href={buildPageUrl(params, filter, data.page + 1) as Parameters<typeof Link>[0]["href"]}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Sau →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function buildPageUrl(
  params: Record<string, string | string[]>,
  filter: string,
  page: number,
): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (k !== "page") sp.set(k, Array.isArray(v) ? v[0]! : v)
  }
  // Keep filter param if it's a dashboard shortcut and no explicit date params
  if (filter && !params.checkInFrom && !params.checkInTo) {
    sp.set("filter", filter)
  }
  sp.set("page", String(page))
  return `/bookings?${sp.toString()}`
}
