"use client"

import { useState, useTransition } from "react"
import { createTaxAction, updateTaxAction, toggleTaxAction } from "../actions"

type TaxRate = {
  id: string
  name: string
  rate: number
  appliesTo: string
  isActive: boolean
}

const APPLIES_LABEL: Record<string, string> = {
  ROOM: "Phòng", SERVICE: "Dịch vụ", ALL: "Tất cả",
}

function TaxForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: TaxRate
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
        <label className="text-xs font-medium text-gray-700">Tên thuế *</label>
        <input name="name" required defaultValue={initial?.name} placeholder="VAT 10%" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1 w-28">
        <label className="text-xs font-medium text-gray-700">Tỷ lệ (%) *</label>
        <input type="number" name="rate" required min={0} max={100} step={0.01} defaultValue={initial?.rate} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
      </div>
      <div className="space-y-1 w-36">
        <label className="text-xs font-medium text-gray-700">Áp dụng cho</label>
        <select name="appliesTo" defaultValue={initial?.appliesTo ?? "ALL"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
          <option value="ALL">Tất cả</option>
          <option value="ROOM">Phòng</option>
          <option value="SERVICE">Dịch vụ</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
        <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "..." : "Lưu"}</button>
      </div>
    </form>
  )
}

export function TaxesClient({ taxes }: { taxes: TaxRate[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate(fd: FormData) {
    startTransition(async () => {
      const res = await createTaxAction(fd)
      if (res.error) { setError(res.error); return }
      setShowCreate(false); setError(null)
    })
  }

  function handleUpdate(id: string, fd: FormData) {
    startTransition(async () => {
      const res = await updateTaxAction(id, fd)
      if (res.error) { setError(res.error); return }
      setEditId(null); setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleTaxAction(id)
      if (res.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Thuế</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm thuế</button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showCreate && (
        <TaxForm onSave={handleCreate} onCancel={() => setShowCreate(false)} isPending={isPending} />
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Tên thuế</th>
              <th className="px-4 py-3 text-center">Tỷ lệ</th>
              <th className="px-4 py-3 text-center">Áp dụng cho</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {taxes.map((t) => (
              <>
                <tr key={t.id} className={!t.isActive ? "opacity-50" : ""}>
                  <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-center text-gray-900">{t.rate}%</td>
                  <td className="px-4 py-3 text-center text-gray-600">{APPLIES_LABEL[t.appliesTo] ?? t.appliesTo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {t.isActive ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditId(editId === t.id ? null : t.id)} className="text-xs text-blue-600 hover:underline">Sửa</button>
                      <button onClick={() => handleToggle(t.id)} disabled={isPending} className="text-xs text-gray-500 hover:underline">{t.isActive ? "Tắt" : "Bật"}</button>
                    </div>
                  </td>
                </tr>
                {editId === t.id && (
                  <tr key={`edit-${t.id}`}>
                    <td colSpan={5} className="px-4 py-3">
                      <TaxForm initial={t} onSave={(fd) => handleUpdate(t.id, fd)} onCancel={() => setEditId(null)} isPending={isPending} />
                    </td>
                  </tr>
                )}
              </>
            ))}
            {taxes.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có cài đặt thuế nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
