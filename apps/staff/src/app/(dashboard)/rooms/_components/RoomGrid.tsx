"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createStaffSocket } from "@/lib/socket"
import type { RoomStatusChangedEvent } from "@hotel/types"
import type { RoomCard } from "./types"
import { RoomDetailPanel } from "./RoomDetailPanel"

export const STATUS_LABEL: Record<string, string> = {
  CLEAN: "Sạch",
  DIRTY: "Cần dọn",
  CLEANING: "Đang dọn",
  INSPECTED: "Đã kiểm",
  OCCUPIED: "Có khách",
  MAINTENANCE: "Bảo trì",
  RESERVED: "Đã đặt",
}

const STATUS_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  CLEAN:       { bg: "bg-green-50",   border: "border-green-300",  text: "text-green-700"  },
  INSPECTED:   { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-800"  },
  DIRTY:       { bg: "bg-red-50",     border: "border-red-300",    text: "text-red-700"    },
  CLEANING:    { bg: "bg-purple-50",  border: "border-purple-300", text: "text-purple-700" },
  OCCUPIED:    { bg: "bg-gray-100",   border: "border-gray-300",   text: "text-gray-700"   },
  MAINTENANCE: { bg: "bg-orange-50",  border: "border-orange-300", text: "text-orange-700" },
  RESERVED:    { bg: "bg-yellow-50",  border: "border-yellow-300", text: "text-yellow-700" },
}

function RoomCardItem({
  room,
  isSelected,
  onClick,
}: {
  room: RoomCard
  isSelected: boolean
  onClick: () => void
}) {
  const color = STATUS_COLOR[room.status] ?? { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-600" }
  const guestName = room.currentBooking
    ? `${room.currentBooking.guest.firstName} ${room.currentBooking.guest.lastName}`
    : null

  const maintenanceTooltip =
    room.status === "MAINTENANCE" && room.maintenanceNote
      ? `${room.maintenanceNote}${room.maintenanceDue ? " • Dự kiến: " + room.maintenanceDue.slice(0, 10) : ""}`
      : undefined

  return (
    <button
      onClick={onClick}
      title={maintenanceTooltip}
      className={`
        relative rounded-xl border-2 p-3 text-left w-full transition-all hover:shadow-md
        ${color.bg} ${color.border}
        ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 shadow-md" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-base font-bold text-gray-900 leading-tight">{room.number}</span>
        {room.status === "MAINTENANCE" && (
          <span className="text-base" title={maintenanceTooltip}>🔧</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight truncate">
        T{room.floor} · {room.roomType.name}
      </p>
      <span className={`mt-1.5 block text-xs font-semibold ${color.text}`}>
        {STATUS_LABEL[room.status] ?? room.status}
      </span>
      {guestName && (
        <p className="mt-0.5 text-xs text-gray-600 truncate">{guestName}</p>
      )}
    </button>
  )
}

export function RoomGrid({
  rooms: initialRooms,
  propertyId,
}: {
  rooms: RoomCard[]
  propertyId: string
}) {
  const router = useRouter()
  const [rooms, setRooms] = useState(initialRooms)
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all")
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  // Re-sync when server re-renders after router.refresh()
  useEffect(() => {
    setRooms(initialRooms)
  }, [initialRooms])

  // Socket.io: realtime card color updates from any staff action
  useEffect(() => {
    const socket = createStaffSocket()
    socket.on("room:statusChanged", (evt: RoomStatusChangedEvent) => {
      if (evt.propertyId !== propertyId) return
      setRooms((prev) =>
        prev.map((r) => (r.id === evt.roomId ? { ...r, status: evt.newStatus } : r)),
      )
    })
    return () => {
      socket.disconnect()
    }
  }, [propertyId])

  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b)
  const displayed = selectedFloor === "all" ? rooms : rooms.filter((r) => r.floor === selectedFloor)
  const selectedRoom = selectedRoomId ? (rooms.find((r) => r.id === selectedRoomId) ?? null) : null

  return (
    <>
      {/* Floor tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedFloor("all")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedFloor === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          Tất cả ({rooms.length})
        </button>
        {floors.map((f) => {
          const count = rooms.filter((r) => r.floor === f).length
          return (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedFloor === f
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              Tầng {f} ({count})
            </button>
          )
        })}
      </div>

      {/* Room grid */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
        {displayed.map((room) => (
          <RoomCardItem
            key={room.id}
            room={room}
            isSelected={room.id === selectedRoomId}
            onClick={() =>
              setSelectedRoomId((prev) => (prev === room.id ? null : room.id))
            }
          />
        ))}
        {displayed.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-gray-400">
            Không có phòng ở tầng này
          </p>
        )}
      </div>

      {/* Slide-over detail panel */}
      {selectedRoom && (
        <RoomDetailPanel
          room={selectedRoom}
          onClose={() => setSelectedRoomId(null)}
          onActionDone={() => {
            setSelectedRoomId(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
