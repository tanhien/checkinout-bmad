"use client"

import { useState, useTransition } from "react"
import { createStaffAction, updateStaffRoleAction, toggleStaffActiveAction } from "../actions"

type StaffMember = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

type StaffRole = "ADMIN" | "MANAGER" | "FRONT_DESK" | "HOUSEKEEPING" | "ACCOUNTANT"

const ROLES: StaffRole[] = ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING", "ACCOUNTANT"]

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Quản trị", MANAGER: "Quản lý", FRONT_DESK: "Lễ tân",
  HOUSEKEEPING: "Buồng phòng", ACCOUNTANT: "Kế toán",
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  MANAGER: "bg-purple-100 text-purple-700",
  FRONT_DESK: "bg-blue-100 text-blue-700",
  HOUSEKEEPING: "bg-green-100 text-green-700",
  ACCOUNTANT: "bg-amber-100 text-amber-700",
}

export function StaffClient({ staffList, currentStaffId }: { staffList: StaffMember[]; currentStaffId: string }) {
  const [showCreate, setShowCreate] = useState(false)
  const [newStaffCreds, setNewStaffCreds] = useState<{ name: string; password: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [editRoleId, setEditRoleId] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = `${fd.get("firstName") as string} ${fd.get("lastName") as string}`
    startTransition(async () => {
      const res = await createStaffAction(fd)
      if (res.error) { setError(res.error); return }
      setShowCreate(false)
      setError(null)
      if (res.tempPassword) {
        setNewStaffCreds({ name, password: res.tempPassword })
      }
    })
  }

  function handleRoleChange(id: string, role: StaffRole) {
    startTransition(async () => {
      const res = await updateStaffRoleAction(id, role)
      if (res.error) { setError(res.error); return }
      setEditRoleId(null); setError(null)
    })
  }

  function handleToggle(id: string) {
    startTransition(async () => {
      const res = await toggleStaffActiveAction(id)
      if (res.error) setError(res.error)
    })
  }

  function fmtDate(iso: string | null) {
    if (!iso) return "Chưa đăng nhập"
    return new Date(iso).toLocaleDateString("vi-VN")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Nhân viên ({staffList.length})</h2>
        {!showCreate && (
          <button onClick={() => setShowCreate(true)} className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Thêm nhân viên</button>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {newStaffCreds && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">Tài khoản đã tạo cho {newStaffCreds.name}</p>
          <p className="text-sm text-green-700">Mật khẩu tạm thời: <code className="rounded bg-white px-2 py-0.5 font-mono font-bold">{newStaffCreds.password}</code></p>
          <p className="text-xs text-green-600">Vui lòng thông báo mật khẩu này cho nhân viên và yêu cầu đổi mật khẩu sau khi đăng nhập lần đầu.</p>
          <button onClick={() => setNewStaffCreds(null)} className="text-xs text-green-700 hover:underline">Đóng</button>
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Họ *</label>
              <input name="lastName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Tên *</label>
              <input name="firstName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Email *</label>
              <input type="email" name="email" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Chức vụ *</label>
              <select name="role" required defaultValue="FRONT_DESK" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-500">Mật khẩu tạm thời sẽ được tạo tự động và hiển thị sau khi tạo tài khoản.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{isPending ? "Đang tạo..." : "Tạo tài khoản"}</button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Họ tên</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-center">Chức vụ</th>
              <th className="px-4 py-3 text-center">Đăng nhập lần cuối</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffList.map((s) => (
              <tr key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {s.lastName} {s.firstName}
                  {s.id === currentStaffId && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Bạn</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">{s.email}</td>
                <td className="px-4 py-3 text-center">
                  {editRoleId === s.id ? (
                    <select
                      defaultValue={s.role}
                      onChange={(e) => handleRoleChange(s.id, e.target.value as StaffRole)}
                      disabled={isPending}
                      className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLOR[s.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABEL[s.role] ?? s.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtDate(s.lastLoginAt)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {s.isActive ? "Hoạt động" : "Vô hiệu"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.id !== currentStaffId && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditRoleId(editRoleId === s.id ? null : s.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Đổi role
                      </button>
                      <button
                        onClick={() => handleToggle(s.id)}
                        disabled={isPending}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        {s.isActive ? "Vô hiệu hoá" : "Kích hoạt"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {staffList.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">Chưa có nhân viên nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
