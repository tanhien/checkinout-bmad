"use client"

import { useState, useTransition } from "react"
import { createRoomAction, bulkCreateRoomsAction, toggleRoomActiveAction } from "../actions"

type Room = {
  id: string
  number: string
  floor: number
  status: string
  isActive: boolean
  roomType: { id: string; name: string }
}

type RoomType = { id: string; name: string }

const STATUS_COLOR: Record<string, string> = {
  CLEAN: "bg-green-100 text-green-700",
  DIRTY: "bg-red-100 text-red-700",
  CLEANING: "bg-purple-100 text-purple-700",
  INSPECTED: "bg-green-100 text-green-800",
  OCCUPIED: "bg-gray-200 text-gray-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
}

export function RoomsClient({ rooms, roomTypes }: { rooms: Room[]; roomTypes: RoomType[] }) {
  const [mode, setMode] = useState<"none" | "single" | "bulk">("none")
  const [error, setError] = useState<string | null>(null)
  const [bulkText, setBulkText] = useState("")
  const [isPending, startTransition] = useTransition()

  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b)
  const [filterFloor, setFilterFloor] = useState<number | null>(null)
  const displayed = filterFloor !== null ? rooms.filter((r) => r.floor === filterFloor) : rooms

  function handleSingle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createRoomAction(fd)
      if (res.error) { setError(res.error); return }
      setMode("none"); setError(null)
    })
  }

  function handleBulk() {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean)
    const parsed: { number: string; floor: number; roomTypeId: string }[] = []
    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim())
      if (parts.length < 3) { setError(`Dòng không hợp lệ: "${line}"`); return }
      parsed.push({ number: parts[0]!, floor: Number(parts[1]), roomTypeId: parts[2]! })
    }
    if (parsed.length === 0) { setError("Không có dữ liệu"); return }
    startTransition(async () => {
      const res = await bulkCreateRoomsAction(parsed)
      if (res.error) { setError(res.error); return }
      setMode("none"); setBulkText(""); setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleRoomActiveAction(id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Phòng ({rooms.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode(mode === "single" ? "none" : "single")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            + Thêm phòng
          </button>
          <button onClick={() => setMode(mode === "bulk" ? "none" : "bulk")} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
            + Tạo hàng loạt
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {mode === "single" && (
        <form onSubmit={handleSingle} className="flex items-end gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Số phòng *</label>
            <input name="number" required placeholder="101" className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Tầng *</label>
            <input type="number" name="floor" required min={0} placeholder="1" className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium text-gray-700">Loại phòng *</label>
            <select name="roomTypeId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Chọn...</option>
              {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">Thêm</button>
          <button type="button" onClick={() => setMode("none")} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
        </form>
      )}

      {mode === "bulk" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <p className="text-xs text-gray-600">Mỗi dòng: <code className="bg-white px-1 py-0.5 rounded">số_phòng, tầng, roomTypeId</code></p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={6}
            placeholder={"101, 1, clx...\n102, 1, clx...\n201, 2, clx..."}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button onClick={handleBulk} disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {isPending ? "Đang tạo..." : "Tạo hàng loạt"}
            </button>
            <button onClick={() => setMode("none")} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
          </div>
        </div>
      )}

      {/* Floor filter tabs */}
      {floors.length > 1 && (
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterFloor(null)}
            className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap ${filterFloor === null ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            Tất cả
          </button>
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setFilterFloor(f)}
              className={`rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap ${filterFloor === f ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50"}`}
            >
              Tầng {f}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Phòng</th>
              <th className="px-4 py-3 text-left">Tầng</th>
              <th className="px-4 py-3 text-left">Loại phòng</th>
              <th className="px-4 py-3 text-center">Tình trạng</th>
              <th className="px-4 py-3 text-center">Hoạt động</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.map((room) => (
              <tr key={room.id} className={!room.isActive ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-gray-900">{room.number}</td>
                <td className="px-4 py-3 text-gray-600">{room.floor}</td>
                <td className="px-4 py-3 text-gray-600">{room.roomType.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[room.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {room.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${room.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {room.isActive ? "Có" : "Không"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(room.id)}
                    disabled={isPending}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    {room.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}
            {displayed.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có phòng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
