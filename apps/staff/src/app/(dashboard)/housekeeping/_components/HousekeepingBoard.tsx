"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createStaffSocket } from "@/lib/socket"
import type { RoomStatusChangedEvent } from "@hotel/types"
import type { HousekeepingRoom, HousekeepingStaff } from "./types"
import { updateRoomStatusAction, assignHousekeepingAction } from "../actions"

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS: { status: string; label: string; headerColor: string }[] = [
  { status: "DIRTY",     label: "Cần dọn",  headerColor: "bg-red-500"    },
  { status: "CLEANING",  label: "Đang dọn", headerColor: "bg-purple-500" },
  { status: "CLEAN",     label: "Đã dọn",   headerColor: "bg-green-500"  },
  { status: "INSPECTED", label: "Đã kiểm",  headerColor: "bg-green-700"  },
]

// Housekeeping-relevant transitions (subset of ALLOWED_TRANSITIONS in room.ts)
const TRANSITIONS: Record<string, { to: string; label: string; color: string }[]> = {
  DIRTY:     [{ to: "CLEANING", label: "Bắt đầu dọn", color: "bg-purple-600 hover:bg-purple-700" }],
  CLEANING:  [
    { to: "CLEAN",     label: "Hoàn thành",    color: "bg-green-600 hover:bg-green-700" },
    { to: "INSPECTED", label: "Đã kiểm tra",   color: "bg-green-700 hover:bg-green-800" },
  ],
  CLEAN:     [{ to: "INSPECTED", label: "Đánh dấu đã kiểm", color: "bg-green-700 hover:bg-green-800" }],
  INSPECTED: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isUrgent(upcomingCheckIn: string | null, checkInHour: number): boolean {
  if (!upcomingCheckIn) return false
  const checkInTime = new Date(upcomingCheckIn).getTime() + checkInHour * 3_600_000
  return checkInTime - Date.now() < 2 * 3_600_000
}

function formatElapsed(startIso: string): string {
  const ms = Date.now() - new Date(startIso).getTime()
  const totalMin = Math.floor(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}g ${m}p` : `${m}p`
}

// ─── CleaningTimer ────────────────────────────────────────────────────────────

function CleaningTimer({ startAt }: { startAt: string }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(startAt))

  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(startAt)), 60_000)
    return () => clearInterval(id)
  }, [startAt])

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
      ⏱ {elapsed}
    </span>
  )
}

// ─── RoomCard ─────────────────────────────────────────────────────────────────

function RoomCard({
  room,
  checkInHour,
  canAssign,
  isManager,
  housekeepingStaff,
  onStatusChange,
  onAssign,
  isPendingId,
}: {
  room: HousekeepingRoom
  checkInHour: number
  canAssign: boolean
  isManager: boolean
  housekeepingStaff: HousekeepingStaff[]
  onStatusChange: (roomId: string, newStatus: string) => void
  onAssign: (roomId: string, staffId: string | null) => void
  isPendingId: string | null
}) {
  const urgent = isUrgent(room.upcomingCheckIn, checkInHour)
  const transitions = TRANSITIONS[room.status] ?? []
  const loading = isPendingId === room.id

  return (
    <div
      className={`rounded-xl border bg-white p-3 shadow-sm space-y-2 ${
        urgent ? "border-orange-400 ring-1 ring-orange-300" : "border-gray-200"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-base font-bold text-gray-900 leading-tight">Phòng {room.number}</p>
          <p className="text-xs text-gray-500 leading-tight">
            T{room.floor} · {room.roomType.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {urgent && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
              URGENT
            </span>
          )}
          {isManager && room.status === "CLEANING" && room.cleaningStartAt && (
            <CleaningTimer startAt={room.cleaningStartAt} />
          )}
        </div>
      </div>

      {/* Assigned to */}
      {room.assignedTo && (
        <p className="text-xs text-gray-500">
          👤 {room.assignedTo.firstName} {room.assignedTo.lastName}
        </p>
      )}

      {/* Status transition buttons — min 44px height for touch */}
      {transitions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {transitions.map((t) => (
            <button
              key={t.to}
              onClick={() => onStatusChange(room.id, t.to)}
              disabled={loading}
              className={`min-h-[44px] w-full rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity ${t.color} disabled:opacity-50`}
            >
              {loading ? "..." : t.label}
            </button>
          ))}
        </div>
      )}

      {/* Assign dropdown — Manager / Front Desk only */}
      {canAssign && housekeepingStaff.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-0.5">Phân công</label>
          <div className="flex gap-1.5">
            <select
              defaultValue={room.assignedTo?.id ?? ""}
              onChange={(e) => onAssign(room.id, e.target.value || null)}
              disabled={loading}
              className="min-h-[44px] flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-50"
            >
              <option value="">— Chọn nhân viên —</option>
              {housekeepingStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
            {room.assignedTo && (
              <button
                onClick={() => onAssign(room.id, null)}
                disabled={loading}
                title="Bỏ phân công"
                className="min-h-[44px] rounded-lg border border-gray-300 px-2 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  rooms,
  checkInHour,
  canAssign,
  isManager,
  housekeepingStaff,
  onStatusChange,
  onAssign,
  isPendingId,
}: {
  column: (typeof COLUMNS)[number]
  rooms: HousekeepingRoom[]
  checkInHour: number
  canAssign: boolean
  isManager: boolean
  housekeepingStaff: HousekeepingStaff[]
  onStatusChange: (roomId: string, newStatus: string) => void
  onAssign: (roomId: string, staffId: string | null) => void
  isPendingId: string | null
}) {
  return (
    <div className="flex min-w-[260px] flex-1 flex-col rounded-xl bg-gray-100 pb-2">
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-xl px-4 py-2.5 ${column.headerColor}`}>
        <span className="text-sm font-semibold text-white">{column.label}</span>
        <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-bold text-white">
          {rooms.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {rooms.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">Không có phòng</p>
        ) : (
          rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              checkInHour={checkInHour}
              canAssign={canAssign}
              isManager={isManager}
              housekeepingStaff={housekeepingStaff}
              onStatusChange={onStatusChange}
              onAssign={onAssign}
              isPendingId={isPendingId}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── HousekeepingBoard ────────────────────────────────────────────────────────

export function HousekeepingBoard({
  rooms: initialRooms,
  checkInHour,
  housekeepingStaff,
  propertyId,
  canAssign,
  isManager,
}: {
  rooms: HousekeepingRoom[]
  checkInHour: number
  housekeepingStaff: HousekeepingStaff[]
  propertyId: string
  canAssign: boolean
  isManager: boolean
}) {
  const router = useRouter()
  const [rooms, setRooms] = useState(initialRooms)
  const [isPendingId, setIsPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const pendingRef = useRef<string | null>(null)

  // Re-sync after server refresh
  useEffect(() => {
    setRooms(initialRooms)
  }, [initialRooms])

  // Socket.io: realtime status updates from any device
  useEffect(() => {
    const socket = createStaffSocket()
    socket.on("room:statusChanged", (evt: RoomStatusChangedEvent) => {
      if (evt.propertyId !== propertyId) return
      const boardStatuses = new Set(["DIRTY", "CLEANING", "CLEAN", "INSPECTED"])
      setRooms((prev) => {
        if (boardStatuses.has(evt.newStatus)) {
          // Update or add the room (it may be appearing on the board for the first time)
          const exists = prev.some((r) => r.id === evt.roomId)
          if (exists) {
            return prev.map((r) =>
              r.id === evt.roomId
                ? {
                    ...r,
                    status: evt.newStatus,
                    // Clear cleaningStartAt when leaving CLEANING; set it when entering
                    cleaningStartAt:
                      evt.newStatus === "CLEANING"
                        ? (r.cleaningStartAt ?? new Date().toISOString())
                        : evt.oldStatus === "CLEANING"
                          ? null
                          : r.cleaningStartAt,
                  }
                : r,
            )
          }
          // Room not in local state (e.g. status changed from OCCUPIED to DIRTY by checkout)
          // — let a full refresh pick it up
          router.refresh()
          return prev
        }
        // Room left the board (went to OCCUPIED/MAINTENANCE/RESERVED)
        return prev.filter((r) => r.id !== evt.roomId)
      })
    })
    return () => {
      socket.disconnect()
    }
  }, [propertyId, router])

  function handleStatusChange(roomId: string, newStatus: string) {
    if (pendingRef.current) return
    pendingRef.current = roomId
    setIsPendingId(roomId)
    startTransition(async () => {
      try {
        await updateRoomStatusAction(roomId, newStatus)
        router.refresh()
      } finally {
        pendingRef.current = null
        setIsPendingId(null)
      }
    })
  }

  function handleAssign(roomId: string, staffId: string | null) {
    if (pendingRef.current) return
    pendingRef.current = roomId
    setIsPendingId(roomId)
    startTransition(async () => {
      try {
        await assignHousekeepingAction(roomId, staffId)
        // Update local state immediately for the assign label
        setRooms((prev) =>
          prev.map((r) => {
            if (r.id !== roomId) return r
            const staff = staffId ? housekeepingStaff.find((s) => s.id === staffId) ?? null : null
            return { ...r, assignedTo: staff }
          }),
        )
        router.refresh()
      } finally {
        pendingRef.current = null
        setIsPendingId(null)
      }
    })
  }

  return (
    // Horizontal scroll on mobile; side-by-side on larger screens
    <div className="flex-1 overflow-x-auto">
      <div className="flex h-full min-h-0 gap-3 p-4 lg:p-6" style={{ minWidth: "max-content" }}>
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            column={col}
            rooms={rooms.filter((r) => r.status === col.status)}
            checkInHour={checkInHour}
            canAssign={canAssign}
            isManager={isManager}
            housekeepingStaff={housekeepingStaff}
            onStatusChange={handleStatusChange}
            onAssign={handleAssign}
            isPendingId={isPendingId}
          />
        ))}
      </div>
    </div>
  )
}
