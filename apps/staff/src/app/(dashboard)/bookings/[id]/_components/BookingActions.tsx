"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  cancelBookingAction,
  checkInBookingAction,
  checkOutBookingAction,
  markNoShowAction,
  assignRoomAction,
} from "../../actions"

type AvailableRoom = { id: string; number: string; floor: number; status: string }

export function BookingActions({
  bookingId,
  status,
  hasRooms,
  canCheckIn,
}: {
  bookingId: string
  status: string
  hasRooms: boolean
  canCheckIn: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Cancel dialog
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")

  // Assign room dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [loadingRooms, setLoadingRooms] = useState(false)

  async function loadAvailableRooms() {
    setLoadingRooms(true)
    try {
      const resp = await fetch(`/api/rooms/available?bookingId=${bookingId}`)
      const data = (await resp.json()) as AvailableRoom[]
      setAvailableRooms(data)
      setSelectedRoomId(data[0]?.id ?? "")
    } catch {
      setAvailableRooms([])
    } finally {
      setLoadingRooms(false)
    }
  }

  function handleAction(fn: () => Promise<void>) {
    setError("")
    setSuccessMsg("")
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
      }
    })
  }

  function handleCheckIn() {
    handleAction(async () => {
      await checkInBookingAction(bookingId)
      setSuccessMsg("Check-in thành công!")
    })
  }

  function handleCheckOut() {
    handleAction(async () => {
      const result = await checkOutBookingAction(bookingId)
      setSuccessMsg(
        result.folioUnsettled
          ? "Check-out thành công. Lưu ý: Folio chưa được thanh toán."
          : "Check-out thành công!",
      )
    })
  }

  function handleNoShow() {
    if (!confirm("Xác nhận đánh dấu khách không đến?")) return
    handleAction(async () => {
      await markNoShowAction(bookingId)
      setSuccessMsg("Đã đánh dấu không đến.")
    })
  }

  function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cancelReason.trim()) return
    setShowCancelDialog(false)
    handleAction(async () => {
      await cancelBookingAction(bookingId, cancelReason)
      setSuccessMsg("Đã hủy booking.")
      setCancelReason("")
    })
  }

  function handleAssignRoom() {
    setShowAssignDialog(true)
    void loadAvailableRooms()
  }

  function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRoomId) return
    setShowAssignDialog(false)
    handleAction(async () => {
      await assignRoomAction(bookingId, selectedRoomId)
      setSuccessMsg("Đã gán phòng thành công!")
    })
  }

  return (
    <div className="space-y-3">
      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {/* CONFIRMED: Assign room (if no room) */}
        {status === "CONFIRMED" && !hasRooms && (
          <button
            onClick={handleAssignRoom}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Gán phòng
          </button>
        )}

        {/* CONFIRMED: Check-in (if room assigned, window open) */}
        {status === "CONFIRMED" && hasRooms && (
          <button
            onClick={handleCheckIn}
            disabled={isPending || !canCheckIn}
            title={!canCheckIn ? "Chưa đến giờ check-in" : undefined}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Check-in
          </button>
        )}

        {/* CONFIRMED: Cancel */}
        {status === "CONFIRMED" && (
          <>
            <button
              onClick={handleNoShow}
              disabled={isPending}
              className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50"
            >
              Không đến
            </button>
            <button
              onClick={() => setShowCancelDialog(true)}
              disabled={isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Hủy booking
            </button>
          </>
        )}

        {/* CHECKED_IN: Check-out */}
        {status === "CHECKED_IN" && (
          <button
            onClick={handleCheckOut}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Check-out
          </button>
        )}
      </div>

      {/* Cancel dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Xác nhận hủy booking</h3>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Lý do hủy *</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Nhập lý do hủy..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowCancelDialog(false); setCancelReason("") }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={!cancelReason.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Xác nhận hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign room dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Chọn phòng</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              {loadingRooms ? (
                <p className="text-sm text-gray-400 text-center py-4">Đang tải danh sách phòng...</p>
              ) : availableRooms.length === 0 ? (
                <p className="text-sm text-red-600 text-center py-4">
                  Không có phòng sạch nào của loại này hiện tại
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableRooms.map((room) => (
                    <label
                      key={room.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${selectedRoomId === room.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <input
                        type="radio"
                        name="roomId"
                        value={room.id}
                        checked={selectedRoomId === room.id}
                        onChange={() => setSelectedRoomId(room.id)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">Phòng {room.number}</span>
                        <span className="ml-2 text-xs text-gray-500">Tầng {room.floor}</span>
                        <span className={`ml-2 text-xs font-medium ${room.status === "INSPECTED" ? "text-green-600" : "text-green-500"}`}>
                          {room.status === "INSPECTED" ? "Đã kiểm" : "Sạch"}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAssignDialog(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedRoomId || availableRooms.length === 0}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Gán phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
