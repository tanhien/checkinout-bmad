"use client"

import { useState, useTransition } from "react"
import { createPromoAction, togglePromoAction } from "../actions"

type PromoCode = {
  id: string
  code: string
  description: string | null
  discountType: string
  discountValue: number
  maxUses: number | null
  usedCount: number
  validFrom: string
  validUntil: string
  roomTypeIds: string[]
  isActive: boolean
}

type RoomType = { id: string; name: string }

export function PromoCodesClient({ promos, roomTypes }: { promos: PromoCode[]; roomTypes: RoomType[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set("roomTypeIds", selectedTypes.join(","))
    startTransition(async () => {
      const res = await createPromoAction(fd)
      if (res.error) { setError(res.error); return }
      setShowCreate(false); setSelectedTypes([]); setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await togglePromoAction(id)
      if (res.error) setError(res.error)
    })
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString("vi-VN")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Mã khuyến mãi</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm mã</button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Mã code * (sẽ chuyển thành CHỮ HOA)</label>
              <input name="code" required placeholder="SUMMER20" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none uppercase" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Mô tả</label>
              <input name="description" placeholder="Khuyến mãi hè 2026" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Loại giảm *</label>
              <select name="discountType" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                <option value="PERCENTAGE">Phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Số tiền cố định</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Giá trị *</label>
              <input type="number" name="discountValue" required min={0} step={0.01} placeholder="20" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Có hiệu lực từ *</label>
              <input type="date" name="validFrom" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Có hiệu lực đến *</label>
              <input type="date" name="validUntil" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Số lần dùng tối đa (để trống = không giới hạn)</label>
              <input type="number" name="maxUses" min={1} placeholder="100" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>

          {roomTypes.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Giới hạn loại phòng (để trống = tất cả)</label>
              <div className="flex flex-wrap gap-2">
                {roomTypes.map((rt) => (
                  <label key={rt.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(rt.id)}
                      onChange={(e) =>
                        setSelectedTypes(prev =>
                          e.target.checked ? [...prev, rt.id] : prev.filter((id) => id !== rt.id)
                        )
                      }
                      className="h-4 w-4 rounded"
                    />
                    {rt.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowCreate(false); setSelectedTypes([]) }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "..." : "Tạo mã"}</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Mã code</th>
              <th className="px-4 py-3 text-left">Giảm giá</th>
              <th className="px-4 py-3 text-center">Đã dùng</th>
              <th className="px-4 py-3 text-center">Hiệu lực</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {promos.map((p) => {
              const now = new Date()
              const expired = new Date(p.validUntil) < now
              return (
                <tr key={p.id} className={!p.isActive || expired ? "opacity-60" : ""}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-900">{p.code}</span>
                    {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.discountType === "PERCENTAGE"
                      ? `${p.discountValue}%`
                      : `${p.discountValue.toLocaleString("vi-VN")}đ`}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {p.usedCount}{p.maxUses != null ? ` / ${p.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {fmtDate(p.validFrom)} → {fmtDate(p.validUntil)}
                    {expired && <span className="ml-1 text-red-500">(hết hạn)</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(p.id)} disabled={isPending} className="text-xs text-gray-500 hover:underline">
                      {p.isActive ? "Tắt" : "Bật"}
                    </button>
                  </td>
                </tr>
              )
            })}
            {promos.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có mã khuyến mãi nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
