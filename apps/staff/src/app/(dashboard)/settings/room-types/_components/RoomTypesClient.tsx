"use client"

import { useState, useTransition } from "react"
import { createRoomTypeAction, updateRoomTypeAction, toggleRoomTypeAction } from "../actions"
import { PhotoManager } from "./PhotoManager"

type RoomType = {
  id: string
  name: string
  slug: string
  description: string | null
  areaM2: number | null
  maxAdults: number
  maxChildren: number
  bedType: string
  basePrice: number
  isActive: boolean
  isFeatured: boolean
  photoUrls: string[]
  _count: { rooms: number }
}

const BED_TYPES = ["SINGLE", "DOUBLE", "TWIN", "KING", "QUEEN", "BUNK"]
const BED_LABEL: Record<string, string> = {
  SINGLE: "Đơn", DOUBLE: "Đôi", TWIN: "Twin",
  KING: "King", QUEEN: "Queen", BUNK: "Tầng",
}

function RoomTypeForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: RoomType
  onSave: (fd: FormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)) }}
      className="grid grid-cols-2 gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
    >
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Tên *</label>
        <input name="name" required defaultValue={initial?.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Slug (để trống = tự tạo)</label>
        <input name="slug" defaultValue={initial?.slug} placeholder="deluxe-double" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs font-medium text-gray-700">Mô tả</label>
        <textarea name="description" rows={2} defaultValue={initial?.description ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Loại giường *</label>
        <select name="bedType" required defaultValue={initial?.bedType ?? "DOUBLE"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          {BED_TYPES.map((b) => <option key={b} value={b}>{BED_LABEL[b]}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Giá cơ bản (VNĐ) *</label>
        <input type="number" name="basePrice" required min={1} defaultValue={initial?.basePrice} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Diện tích (m²)</label>
        <input type="number" name="areaM2" min={1} step={0.5} defaultValue={initial?.areaM2 ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Người lớn tối đa *</label>
          <input type="number" name="maxAdults" required min={1} max={10} defaultValue={initial?.maxAdults ?? 2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Trẻ em tối đa</label>
          <input type="number" name="maxChildren" min={0} max={6} defaultValue={initial?.maxChildren ?? 2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="hidden" name="isFeatured" value="false" />
          <input type="checkbox" name="isFeatured" value="true" defaultChecked={initial?.isFeatured} className="h-4 w-4 rounded" />
          Nổi bật (featured)
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
          <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "..." : "Lưu"}</button>
        </div>
      </div>
    </form>
  )
}

export function RoomTypesClient({ roomTypes: initial }: { roomTypes: RoomType[] }) {
  const [roomTypes, setRoomTypes] = useState(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [photosId, setPhotosId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(fd: FormData) {
    startTransition(async () => {
      const res = await createRoomTypeAction(fd)
      if (res.error) { setError(res.error); return }
      setShowCreate(false)
      setError(null)
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateRoomTypeAction(id, fd)
      if (res.error) { setError(res.error); return }
      setEditId(null)
      setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleRoomTypeAction(id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Loại phòng</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
            + Thêm loại phòng
          </button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <RoomTypeForm
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          isPending={isPending}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Tên</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3 text-center">Giường</th>
              <th className="px-4 py-3 text-right">Giá cơ bản</th>
              <th className="px-4 py-3 text-center">Phòng</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roomTypes.map((rt) => (
              <>
                <tr key={rt.id} className={!rt.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {rt.name}
                    {rt.isFeatured && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Featured</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{rt.slug}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{BED_LABEL[rt.bedType] ?? rt.bedType}</td>
                  <td className="px-4 py-3 text-right text-gray-900">{rt.basePrice.toLocaleString("vi-VN")}đ</td>
                  <td className="px-4 py-3 text-center text-gray-600">{rt._count.rooms}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rt.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {rt.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setPhotosId(photosId === rt.id ? null : rt.id)} className="text-xs text-blue-600 hover:underline">Ảnh ({rt.photoUrls.length})</button>
                      <button onClick={() => setEditId(editId === rt.id ? null : rt.id)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                      <button onClick={() => handleToggle(rt.id)} disabled={isPending} className="text-xs text-gray-500 hover:underline">
                        {rt.isActive ? "Tắt" : "Bật"}
                      </button>
                    </div>
                  </td>
                </tr>
                {photosId === rt.id && (
                  <tr key={`photos-${rt.id}`}>
                    <td colSpan={7} className="px-4 py-3 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Quản lý ảnh — {rt.name}</p>
                      <PhotoManager
                        roomTypeId={rt.id}
                        photoUrls={rt.photoUrls}
                        onPhotosChanged={(urls) =>
                          setRoomTypes((prev) => prev.map((r) => r.id === rt.id ? { ...r, photoUrls: urls } : r))
                        }
                      />
                    </td>
                  </tr>
                )}
                {editId === rt.id && (
                  <tr key={`edit-${rt.id}`}>
                    <td colSpan={7} className="px-4 py-3">
                      <RoomTypeForm
                        initial={rt}
                        onSave={(fd) => handleUpdate(rt.id, fd)}
                        onCancel={() => setEditId(null)}
                        isPending={isPending}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {roomTypes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có loại phòng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
