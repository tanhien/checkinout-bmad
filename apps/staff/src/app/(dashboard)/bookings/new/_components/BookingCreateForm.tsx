"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBookingAction } from "../../actions"

type RoomType = { id: string; name: string; basePrice: number }
type RatePlan = { id: string; name: string; isNonRefundable: boolean }
type GuestResult = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  tag: string
  _count: { bookings: number }
}

export function BookingCreateForm({
  roomTypes,
  ratePlans,
}: {
  roomTypes: RoomType[]
  ratePlans: RatePlan[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  // Guest state
  const [guestSearch, setGuestSearch] = useState("")
  const [guestResults, setGuestResults] = useState<GuestResult[]>([])
  const [selectedGuest, setSelectedGuest] = useState<GuestResult | null>(null)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestFirstName, setGuestFirstName] = useState("")
  const [guestLastName, setGuestLastName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Booking fields
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? "")
  const [ratePlanId, setRatePlanId] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [channel, setChannel] = useState<"DIRECT" | "PHONE" | "WALK_IN" | "OTA" | "KIOSK">("DIRECT")
  const [specialRequests, setSpecialRequests] = useState("")

  // Availability
  const [availability, setAvailability] = useState<number | null>(null)
  const [checkingAvail, setCheckingAvail] = useState(false)

  const checkAvailability = useCallback(
    async (ci: string, co: string, rtId: string) => {
      if (!ci || !co || !rtId) return
      setCheckingAvail(true)
      try {
        const resp = await fetch(
          `/api/availability?checkIn=${ci}&checkOut=${co}&roomTypeId=${rtId}&adults=${adults}`,
        )
        const data = (await resp.json()) as { available: number }
        setAvailability(data.available)
      } catch {
        setAvailability(null)
      } finally {
        setCheckingAvail(false)
      }
    },
    [adults],
  )

  function handleDateChange(field: "checkIn" | "checkOut", value: string) {
    const newCheckIn = field === "checkIn" ? value : checkIn
    const newCheckOut = field === "checkOut" ? value : checkOut
    if (field === "checkIn") setCheckIn(value)
    else setCheckOut(value)
    if (newCheckIn && newCheckOut && roomTypeId) {
      void checkAvailability(newCheckIn, newCheckOut, roomTypeId)
    }
  }

  function handleRoomTypeChange(id: string) {
    setRoomTypeId(id)
    setAvailability(null)
    if (checkIn && checkOut) void checkAvailability(checkIn, checkOut, id)
  }

  // Guest search
  async function handleGuestSearch(q: string) {
    setGuestSearch(q)
    setSelectedGuest(null)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (q.length < 2) { setGuestResults([]); return }
    searchDebounce.current = setTimeout(async () => {
      const resp = await fetch(`/api/guests/search?q=${encodeURIComponent(q)}`)
      const data = (await resp.json()) as GuestResult[]
      setGuestResults(data)
    }, 300)
  }

  function selectGuest(g: GuestResult) {
    setSelectedGuest(g)
    setGuestSearch(`${g.firstName} ${g.lastName}`)
    setGuestResults([])
    setShowGuestForm(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!checkIn || !checkOut) { setError("Vui lòng chọn ngày check-in và check-out"); return }
    if (!roomTypeId) { setError("Vui lòng chọn loại phòng"); return }
    if (!selectedGuest && !showGuestForm) { setError("Vui lòng chọn hoặc tạo khách hàng"); return }
    if (showGuestForm && (!guestFirstName || !guestLastName || !guestEmail)) {
      setError("Vui lòng điền đầy đủ thông tin khách hàng")
      return
    }
    if (availability !== null && availability === 0) {
      setError("Không còn phòng trống cho ngày đã chọn")
      return
    }

    startTransition(async () => {
      try {
        const result = await createBookingAction({
          guestId: selectedGuest?.id,
          guestFirstName: showGuestForm ? guestFirstName : undefined,
          guestLastName: showGuestForm ? guestLastName : undefined,
          guestEmail: showGuestForm ? guestEmail : undefined,
          guestPhone: showGuestForm ? guestPhone : undefined,
          roomTypeId,
          ratePlanId: ratePlanId || undefined,
          checkIn,
          checkOut,
          adults,
          children,
          channel,
          specialRequests: specialRequests || undefined,
        })
        router.push(`/bookings/${result.id}` as `/bookings/${string}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi khi tạo booking")
      }
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Guest section */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Thông tin khách</h2>

        {!showGuestForm ? (
          <>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm khách theo tên, email, SĐT..."
                value={guestSearch}
                onChange={(e) => void handleGuestSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {guestResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                  {guestResults.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => selectGuest(g)}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="font-medium text-gray-900">
                        {g.firstName} {g.lastName}
                      </span>
                      <span className="ml-2 text-gray-500">{g.email}</span>
                      {g.phone && <span className="ml-2 text-gray-400">· {g.phone}</span>}
                      {g.tag === "BLACKLIST" && (
                        <span className="ml-2 text-xs text-red-600 font-medium">BLACKLIST</span>
                      )}
                      {g.tag === "VIP" && (
                        <span className="ml-2 text-xs text-yellow-600 font-medium">VIP</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedGuest && (
              <div className={`rounded-lg px-4 py-3 text-sm ${selectedGuest.tag === "BLACKLIST" ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                {selectedGuest.tag === "BLACKLIST" && (
                  <p className="font-semibold text-red-700 mb-1">Khách trong danh sách Blacklist — cần xác nhận Manager</p>
                )}
                <p className="text-gray-700 font-medium">
                  {selectedGuest.firstName} {selectedGuest.lastName}
                </p>
                <p className="text-gray-500">{selectedGuest.email} · {selectedGuest._count.bookings} lần ở</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => { setShowGuestForm(true); setSelectedGuest(null); setGuestSearch(""); setGuestResults([]) }}
              className="text-sm text-blue-600 hover:underline"
            >
              + Tạo khách hàng mới
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Họ *</label>
                <input
                  type="text"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  placeholder="Nguyễn"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tên *</label>
                <input
                  type="text"
                  value={guestFirstName}
                  onChange={(e) => setGuestFirstName(e.target.value)}
                  placeholder="Văn A"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="guest@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowGuestForm(false)}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Quay lại tìm kiếm
            </button>
          </div>
        )}
      </div>

      {/* Booking details section */}
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Chi tiết đặt phòng</h2>

        {/* Room type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Loại phòng *</label>
          <select
            value={roomTypeId}
            onChange={(e) => handleRoomTypeChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            required
          >
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name} — {rt.basePrice.toLocaleString("vi-VN")} VND/đêm
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Check-in *</label>
            <input
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => handleDateChange("checkIn", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Check-out *</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => handleDateChange("checkOut", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Availability indicator */}
        {(checkIn && checkOut && roomTypeId) && (
          <div className="text-sm">
            {checkingAvail ? (
              <span className="text-gray-400">Đang kiểm tra phòng trống...</span>
            ) : availability !== null ? (
              <span className={`font-medium ${availability > 0 ? "text-green-600" : "text-red-600"}`}>
                {availability > 0 ? `${availability} phòng còn trống` : "Hết phòng cho ngày đã chọn"}
              </span>
            ) : null}
          </div>
        )}

        {/* Adults, children */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Người lớn *</label>
            <input
              type="number"
              min={1}
              max={10}
              value={adults}
              onChange={(e) => setAdults(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trẻ em</label>
            <input
              type="number"
              min={0}
              max={10}
              value={children}
              onChange={(e) => setChildren(parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Rate plan (only show if available) */}
        {ratePlans.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Gói giá</label>
            <select
              value={ratePlanId}
              onChange={(e) => setRatePlanId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Giá cơ bản</option>
              {ratePlans.map((rp) => (
                <option key={rp.id} value={rp.id}>
                  {rp.name}{rp.isNonRefundable ? " (không hoàn tiền)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Channel */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Kênh đặt phòng</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as typeof channel)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="DIRECT">Trực tiếp</option>
            <option value="PHONE">Điện thoại</option>
            <option value="WALK_IN">Walk-in</option>
            <option value="OTA">OTA</option>
            <option value="KIOSK">Kiosk</option>
          </select>
        </div>

        {/* Special requests */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Yêu cầu đặc biệt</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Phòng tầng cao, xa thang máy..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Đang tạo..." : "Tạo booking"}
        </button>
      </div>
    </form>
  )
}
