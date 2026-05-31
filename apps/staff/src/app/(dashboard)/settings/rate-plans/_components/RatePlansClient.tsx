"use client"

import { useState, useTransition } from "react"
import { createRatePlanAction, updateRatePlanAction, deleteRatePlanAction } from "../actions"

type RoomType = { id: string; name: string }

type RatePlan = {
  id: string
  name: string
  description: string | null
  isNonRefundable: boolean
  discountPercent: number | null
  minStayNights: number
  weekdayPrice: number | null
  weekendPrice: number | null
  isActive: boolean
  roomTypes: { roomTypeId: string; priceOverride: number | null; roomType: { id: string; name: string } }[]
}

function PlanForm({
  initial,
  roomTypes,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: RatePlan
  roomTypes: RoomType[]
  onSave: (data: Parameters<typeof createRatePlanAction>[0]) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initial?.roomTypes.map((rt) => rt.roomTypeId) ?? []
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    onSave({
      name: fd.get("name") as string,
      description: (fd.get("description") as string) || undefined,
      isNonRefundable: fd.get("isNonRefundable") === "true",
      discountPercent: fd.get("discountPercent") ? Number(fd.get("discountPercent")) : undefined,
      minStayNights: Number(fd.get("minStayNights") ?? 1),
      weekdayPrice: fd.get("weekdayPrice") ? Number(fd.get("weekdayPrice")) : undefined,
      weekendPrice: fd.get("weekendPrice") ? Number(fd.get("weekendPrice")) : undefined,
      roomTypeIds: selectedTypes.map((id) => ({ roomTypeId: id })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Tên gói *</label>
          <input name="name" required defaultValue={initial?.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Ở tối thiểu (đêm)</label>
          <input type="number" name="minStayNights" min={1} defaultValue={initial?.minStayNights ?? 1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-700">Mô tả</label>
        <input name="description" defaultValue={initial?.description ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Giảm giá (%)</label>
          <input type="number" name="discountPercent" min={0} max={100} step={0.5} defaultValue={initial?.discountPercent ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Giá ngày thường</label>
          <input type="number" name="weekdayPrice" min={0} defaultValue={initial?.weekdayPrice ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Giá cuối tuần</label>
          <input type="number" name="weekendPrice" min={0} defaultValue={initial?.weekendPrice ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="isNonRefundable" value="false" />
        <input type="checkbox" name="isNonRefundable" value="true" defaultChecked={initial?.isNonRefundable} className="h-4 w-4 rounded" />
        Không hoàn tiền (Non-refundable)
      </label>
      {roomTypes.length > 0 && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700">Áp dụng cho loại phòng (để trống = tất cả)</label>
          <div className="flex flex-wrap gap-2">
            {roomTypes.map((rt) => (
              <label key={rt.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(rt.id)}
                  onChange={(e) => {
                    setSelectedTypes(prev =>
                      e.target.checked ? [...prev, rt.id] : prev.filter((id) => id !== rt.id)
                    )
                  }}
                  className="h-4 w-4 rounded"
                />
                {rt.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
        <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "..." : "Lưu"}</button>
      </div>
    </form>
  )
}

export function RatePlansClient({ ratePlans, roomTypes }: { ratePlans: RatePlan[]; roomTypes: RoomType[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(data: Parameters<typeof createRatePlanAction>[0]) {
    startTransition(async () => {
      const res = await createRatePlanAction(data)
      if (res.error) { setError(res.error); return }
      setShowCreate(false); setError(null)
    })
  }

  function handleUpdate(id: string, data: Parameters<typeof createRatePlanAction>[0]) {
    startTransition(async () => {
      const res = await updateRatePlanAction(id, data)
      if (res.error) { setError(res.error); return }
      setEditId(null); setError(null)
    })
  }

  function handleDelete(id: string) {
    if (!confirm("Xác nhận xoá gói giá này?")) return
    startTransition(async () => {
      const res = await deleteRatePlanAction(id)
      if (res.error) setError(res.error)
    })
  }

  function fmtNum(n: number | null | undefined) {
    if (n == null) return "—"
    return n.toLocaleString("vi-VN")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Gói giá phòng</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm gói giá</button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <PlanForm roomTypes={roomTypes} onSave={handleCreate} onCancel={() => setShowCreate(false)} isPending={isPending} />
      )}

      <div className="space-y-3">
        {ratePlans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{plan.name}</p>
                {plan.description && <p className="text-sm text-gray-500 mt-0.5">{plan.description}</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  {plan.discountPercent != null && <span>Giảm {plan.discountPercent}%</span>}
                  {plan.weekdayPrice != null && <span>Thường: {fmtNum(plan.weekdayPrice)}đ</span>}
                  {plan.weekendPrice != null && <span>Cuối tuần: {fmtNum(plan.weekendPrice)}đ</span>}
                  {plan.minStayNights > 1 && <span>Tối thiểu {plan.minStayNights} đêm</span>}
                  {plan.isNonRefundable && <span className="text-red-600">Không hoàn tiền</span>}
                </div>
                {plan.roomTypes.length > 0 && (
                  <p className="mt-1 text-xs text-gray-400">Áp dụng: {plan.roomTypes.map((rt) => rt.roomType.name).join(", ")}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4 shrink-0">
                <button onClick={() => setEditId(editId === plan.id ? null : plan.id)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                <button onClick={() => handleDelete(plan.id)} disabled={isPending} className="text-xs text-red-500 hover:underline">Xoá</button>
              </div>
            </div>
            {editId === plan.id && (
              <div className="mt-4">
                <PlanForm
                  initial={plan}
                  roomTypes={roomTypes}
                  onSave={(data) => handleUpdate(plan.id, data)}
                  onCancel={() => setEditId(null)}
                  isPending={isPending}
                />
              </div>
            )}
          </div>
        ))}
        {ratePlans.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">Chưa có gói giá nào</div>
        )}
      </div>
    </div>
  )
}
