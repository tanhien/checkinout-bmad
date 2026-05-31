"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type RoomType = { id: string; name: string }

const STATUSES = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "CONFIRMED", label: "Đã đặt" },
  { value: "CHECKED_IN", label: "Đang ở" },
  { value: "CHECKED_OUT", label: "Đã trả phòng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "NO_SHOW", label: "Không đến" },
]

const CHANNELS = [
  { value: "", label: "Tất cả kênh" },
  { value: "DIRECT", label: "Trực tiếp" },
  { value: "PHONE", label: "Điện thoại" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTA", label: "OTA" },
  { value: "KIOSK", label: "Kiosk" },
]

const SORT_OPTIONS = [
  { value: "checkIn", label: "Ngày check-in" },
  { value: "createdAt", label: "Ngày tạo" },
]

export function BookingFilters({
  roomTypes,
  initialSearch,
  initialStatus,
  initialChannel,
  initialRoomTypeId,
  initialCheckInFrom,
  initialCheckInTo,
}: {
  roomTypes: RoomType[]
  initialSearch: string
  initialStatus: string
  initialChannel: string
  initialRoomTypeId: string
  initialCheckInFrom?: string
  initialCheckInTo?: string
}) {
  const router = useRouter()
  const currentParams = useSearchParams()

  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [channel, setChannel] = useState(initialChannel)
  const [roomTypeId, setRoomTypeId] = useState(initialRoomTypeId)
  const [checkInFrom, setCheckInFrom] = useState(initialCheckInFrom ?? "")
  const [checkInTo, setCheckInTo] = useState(initialCheckInTo ?? "")
  const [sortBy, setSortBy] = useState(currentParams.get("sortBy") ?? "checkIn")

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushFilters = useCallback(
    (overrides: Record<string, string>) => {
      const sp = new URLSearchParams()
      const merged = {
        search,
        status,
        channel,
        roomTypeId,
        checkInFrom,
        checkInTo,
        sortBy,
        ...overrides,
      }
      for (const [k, v] of Object.entries(merged)) {
        if (v) sp.set(k, v)
      }
      sp.delete("page")
      sp.delete("filter")
      router.push(`/bookings?${sp.toString()}` as `/bookings?${string}`)
    },
    [search, status, channel, roomTypeId, checkInFrom, checkInTo, sortBy, router],
  )

  // Debounced search
  function handleSearchChange(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pushFilters({ search: value })
    }, 300)
  }

  // Immediate filter change (dropdowns, dates)
  function handleFilterChange(key: string, value: string) {
    switch (key) {
      case "status": setStatus(value); break
      case "channel": setChannel(value); break
      case "roomTypeId": setRoomTypeId(value); break
      case "checkInFrom": setCheckInFrom(value); break
      case "checkInTo": setCheckInTo(value); break
      case "sortBy": setSortBy(value); break
    }
    pushFilters({ [key]: value })
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 space-y-3">
      {/* Row 1: Search */}
      <input
        type="text"
        placeholder="Tìm mã đặt phòng, tên khách, SĐT, số phòng..."
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* Row 2: Dropdowns + date range */}
      <div className="flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={channel}
          onChange={(e) => handleFilterChange("channel", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          value={roomTypeId}
          onChange={(e) => handleFilterChange("roomTypeId", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Tất cả loại phòng</option>
          {roomTypes.map((rt) => (
            <option key={rt.id} value={rt.id}>{rt.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-500">Check-in:</span>
          <input
            type="date"
            value={checkInFrom}
            onChange={(e) => handleFilterChange("checkInFrom", e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={checkInTo}
            onChange={(e) => handleFilterChange("checkInTo", e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>Sắp xếp: {o.label}</option>
          ))}
        </select>

        {(search || status || channel || roomTypeId || checkInFrom || checkInTo) && (
          <button
            onClick={() => {
              setSearch("")
              setStatus("")
              setChannel("")
              setRoomTypeId("")
              setCheckInFrom("")
              setCheckInTo("")
              router.push("/bookings")
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}
