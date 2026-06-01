"use client"

import { useState, useTransition } from "react"
import { Input } from "@hotel/ui"
import { Button } from "@hotel/ui"

export function ChangePasswordForm() {
  const [form, setForm] = useState({ old: "", next: "", confirm: "" })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.next !== form.confirm) { setError("Mật khẩu xác nhận không khớp."); return }
    if (form.next.length < 8) { setError("Mật khẩu mới phải ít nhất 8 ký tự."); return }
    if (!/[A-Z]/.test(form.next)) { setError("Mật khẩu mới phải có ít nhất 1 chữ hoa."); return }
    if (!/[0-9]/.test(form.next)) { setError("Mật khẩu mới phải có ít nhất 1 chữ số."); return }

    startTransition(async () => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: form.old, newPassword: form.next }),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ old: "", next: "", confirm: "" })
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Đã xảy ra lỗi.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Mật khẩu đã được đổi thành công.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
        <Input type="password" value={form.old} onChange={update("old")} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mật khẩu mới (≥8 ký tự, 1 chữ hoa, 1 số)
        </label>
        <Input type="password" value={form.next} onChange={update("next")} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
        <Input type="password" value={form.confirm} onChange={update("confirm")} required />
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Đang lưu..." : "Đổi mật khẩu"}
      </Button>
    </form>
  )
}
