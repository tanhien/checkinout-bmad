"use client"

import { useState, useTransition } from "react"
import { createServiceAction, updateServiceAction, toggleServiceAction } from "../actions"

type Service = {
  id: string
  name: string
  category: string
  unit: string
  price: number
  isActive: boolean
}

const CATEGORIES = ["FOOD_BEVERAGE", "LAUNDRY", "SPA", "MINIBAR", "TRANSPORT", "OTHER"]
const CAT_LABEL: Record<string, string> = {
  FOOD_BEVERAGE: "Ăn uống", LAUNDRY: "Giặt ủi", SPA: "Spa",
  MINIBAR: "Minibar", TRANSPORT: "Vận chuyển", OTHER: "Khác",
}

function ServiceRow({
  service,
  onEdit,
  onToggle,
  isPending,
}: {
  service: Service
  onEdit: () => void
  onToggle: () => void
  isPending: boolean
}) {
  return (
    <tr className={!service.isActive ? "opacity-50" : ""}>
      <td className="px-4 py-3 font-medium text-gray-900">{service.name}</td>
      <td className="px-4 py-3 text-gray-600">{CAT_LABEL[service.category] ?? service.category}</td>
      <td className="px-4 py-3 text-gray-600">{service.unit}</td>
      <td className="px-4 py-3 text-right text-gray-900">{service.price.toLocaleString("vi-VN")}đ</td>
      <td className="px-4 py-3 text-center">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${service.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {service.isActive ? "Hoạt động" : "Tắt"}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="text-xs text-blue-600 hover:underline">Sửa</button>
          <button onClick={onToggle} disabled={isPending} className="text-xs text-gray-500 hover:underline">
            {service.isActive ? "Tắt" : "Bật"}
          </button>
        </div>
      </td>
    </tr>
  )
}

function ServiceForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Service
  onSave: (fd: FormData) => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(new FormData(e.currentTarget)) }}
      className="flex items-end gap-3 flex-wrap rounded-lg border border-blue-200 bg-blue-50 p-4"
    >
      <div className="space-y-1 flex-1 min-w-[160px]">
        <label className="text-xs font-medium text-gray-700">Tên dịch vụ *</label>
        <input name="name" required defaultValue={initial?.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1 w-36">
        <label className="text-xs font-medium text-gray-700">Danh mục *</label>
        <select name="category" required defaultValue={initial?.category ?? "OTHER"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          {CATEGORIES.map((c) => <option key={c} value={c}>{CAT_LABEL[c]}</option>)}
        </select>
      </div>
      <div className="space-y-1 w-24">
        <label className="text-xs font-medium text-gray-700">Đơn vị *</label>
        <input name="unit" required defaultValue={initial?.unit} placeholder="suất" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1 w-32">
        <label className="text-xs font-medium text-gray-700">Giá *</label>
        <input type="number" name="price" required min={0} defaultValue={initial?.price} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
        <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "..." : "Lưu"}</button>
      </div>
    </form>
  )
}

export function ServicesClient({ services }: { services: Service[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(fd: FormData) {
    startTransition(async () => {
      const res = await createServiceAction(fd)
      if (res.error) { setError(res.error); return }
      setShowCreate(false); setError(null)
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateServiceAction(id, fd)
      if (res.error) { setError(res.error); return }
      setEditId(null); setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleServiceAction(id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Dịch vụ</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm dịch vụ</button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <ServiceForm onSave={handleCreate} onCancel={() => setShowCreate(false)} isPending={isPending} />
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Tên dịch vụ</th>
              <th className="px-4 py-3 text-left">Danh mục</th>
              <th className="px-4 py-3 text-left">Đơn vị</th>
              <th className="px-4 py-3 text-right">Giá</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((s) => (
              <>
                <ServiceRow key={s.id} service={s} onEdit={() => setEditId(editId === s.id ? null : s.id)} onToggle={() => handleToggle(s.id)} isPending={isPending} />
                {editId === s.id && (
                  <tr key={`edit-${s.id}`}>
                    <td colSpan={6} className="px-4 py-3">
                      <ServiceForm initial={s} onSave={(fd) => handleUpdate(s.id, fd)} onCancel={() => setEditId(null)} isPending={isPending} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có dịch vụ nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
