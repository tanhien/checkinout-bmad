"use client"

import { useEffect, useState, useTransition } from "react"
import type { RoomCard } from "./types"
import { STATUS_LABEL } from "./RoomGrid"
import { changeRoomStatusAction, setRoomMaintenanceAction } from "../actions"

type HistoryEntry = {
  id: string
  oldStatus: string
  newStatus: string
  note: string | null
  createdAt: string
  staff: { firstName: string; lastName: string; role: string } | null
}

// Client-side mirror of server-side ALLOWED_TRANSITIONS
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DIRTY:       ["CLEANING", "CLEAN", "MAINTENANCE"],
  CLEANING:    ["CLEAN", "INSPECTED", "DIRTY"],
  CLEAN:       ["DIRTY", "MAINTENANCE"],
  INSPECTED:   ["DIRTY", "CLEAN", "MAINTENANCE"],
  MAINTENANCE: ["DIRTY", "CLEAN"],
  OCCUPIED:    ["DIRTY", "MAINTENANCE"],
  RESERVED:    ["DIRTY", "CLEAN"],
}

const STATUS_BADGE: Record<string, string> = {
  CLEAN:       "bg-green-100 text-green-800",
  INSPECTED:   "bg-green-100 text-green-800",
  DIRTY:       "bg-red-100 text-red-800",
  CLEANING:    "bg-purple-100 text-purple-800",
  OCCUPIED:    "bg-gray-100 text-gray-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  RESERVED:    "bg-yellow-100 text-yellow-800",
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Đã đặt",
  CHECKED_IN: "Đang ở",
}

export function RoomDetailPanel({
  room,
  onClose,
  onActionDone,
}: {
  room: RoomCard
  onClose: () => void
  onActionDone: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<"status" | "maintenance" | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [maintNote, setMaintNote] = useState("")
  const [maintDue, setMaintDue] = useState("")
  const [error, setError] = useState("")

  // Fetch history when panel opens
  useEffect(() => {
    setHistoryLoading(true)
    fetch(`/api/rooms/${room.id}/history`)
      .then((r) => r.json())
      .then((data: unknown) => setHistory(Array.isArray(data) ? (data as HistoryEntry[]) : []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [room.id])

  const validTransitions = ALLOWED_TRANSITIONS[room.status] ?? []

  function handleChangeStatus() {
    if (!selectedStatus) return
    setError("")
    startTransition(async () => {
      try {
        await changeRoomStatusAction(room.id, selectedStatus, statusNote || undefined)
        onActionDone()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi đổi trạng thái")
      }
    })
  }

  function handleSetMaintenance() {
    if (!maintNote.trim() || !maintDue) return
    setError("")
    startTransition(async () => {
      try {
        await setRoomMaintenanceAction(room.id, maintNote.trim(), new Date(maintDue).toISOString())
        onActionDone()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi đặt bảo trì")
      }
    })
  }

  const booking = room.currentBooking

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Phòng {room.number}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[room.status] ?? "bg-gray-100 text-gray-700"}`}
              >
                {STATUS_LABEL[room.status] ?? room.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              Tầng {room.floor} · {room.roomType.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Maintenance notice */}
          {room.status === "MAINTENANCE" && room.maintenanceNote && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="text-xs font-semibold text-orange-800">🔧 Đang bảo trì</p>
              <p className="mt-1 text-sm text-orange-700">{room.maintenanceNote}</p>
              {room.maintenanceDue && (
                <p className="mt-1 text-xs text-orange-500">
                  Dự kiến xong: {room.maintenanceDue.slice(0, 10)}
                </p>
              )}
            </div>
          )}

          {/* Current booking */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Booking hiện tại
            </p>
            {booking ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {booking.guest.firstName} {booking.guest.lastName}
                </p>
                <p className="font-mono text-xs text-gray-500">{booking.confirmationCode}</p>
                <p className="text-xs text-gray-500">
                  {booking.checkInDate.slice(0, 10)} → {booking.checkOutDate.slice(0, 10)}
                </p>
                <span className="inline-block rounded px-1.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
                  {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Không có booking</p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {/* Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Thao tác
            </p>
            <div className="space-y-2">
              {/* Change Status */}
              {validTransitions.length > 0 && (
                <div>
                  <button
                    onClick={() => setActiveAction(activeAction === "status" ? null : "status")}
                    className="w-full rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {activeAction === "status" ? "▲ Đổi trạng thái" : "▼ Đổi trạng thái"}
                  </button>
                  {activeAction === "status" && (
                    <div className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">Chọn trạng thái mới...</option>
                        {validTransitions.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s] ?? s}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Ghi chú (tùy chọn)"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        onClick={handleChangeStatus}
                        disabled={!selectedStatus || isPending}
                        className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isPending ? "Đang lưu..." : "Xác nhận đổi trạng thái"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Set Maintenance */}
              {room.status !== "OCCUPIED" && (
                <div>
                  <button
                    onClick={() =>
                      setActiveAction(activeAction === "maintenance" ? null : "maintenance")
                    }
                    className="w-full rounded-lg border border-orange-300 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
                  >
                    {activeAction === "maintenance" ? "▲ Đặt bảo trì" : "🔧 Đặt bảo trì"}
                  </button>
                  {activeAction === "maintenance" && (
                    <div className="mt-2 space-y-2 rounded-lg bg-orange-50 p-3">
                      <textarea
                        placeholder="Lý do / mô tả công việc bảo trì"
                        value={maintNote}
                        onChange={(e) => setMaintNote(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                      />
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">
                          Dự kiến xong
                        </label>
                        <input
                          type="datetime-local"
                          value={maintDue}
                          onChange={(e) => setMaintDue(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={handleSetMaintenance}
                        disabled={!maintNote.trim() || !maintDue || isPending}
                        className="w-full rounded-lg bg-orange-600 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        {isPending ? "Đang lưu..." : "Xác nhận bảo trì"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* History — last 30 days */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Lịch sử 30 ngày
            </p>
            {historyLoading ? (
              <p className="text-sm text-gray-400">Đang tải lịch sử...</p>
            ) : !history || history.length === 0 ? (
              <p className="text-sm text-gray-400">Không có lịch sử trong 30 ngày</p>
            ) : (
              <ol className="relative ml-3 space-y-4 border-l border-gray-200">
                {history.map((entry) => (
                  <li key={entry.id} className="ml-4">
                    <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />
                    <p className="text-xs font-medium text-gray-700">
                      {STATUS_LABEL[entry.oldStatus] ?? entry.oldStatus}
                      {" → "}
                      {STATUS_LABEL[entry.newStatus] ?? entry.newStatus}
                    </p>
                    <p className="text-xs text-gray-400">
                      {entry.createdAt.slice(0, 16).replace("T", " ")} UTC
                      {entry.staff
                        ? ` · ${entry.staff.firstName} ${entry.staff.lastName}`
                        : ""}
                    </p>
                    {entry.note && (
                      <p className="mt-0.5 text-xs text-gray-500">{entry.note}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
