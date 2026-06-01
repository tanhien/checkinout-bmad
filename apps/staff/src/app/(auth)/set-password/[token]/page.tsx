"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@hotel/ui"
import { Button } from "@hotel/ui"

export default function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = (searchParams.get("type") ?? "onboarding") as "onboarding" | "reset"
  const { token } = use(params)

  const [info, setInfo] = useState<{ firstName?: string; email?: string } | null>(null)
  const [tokenInvalid, setTokenInvalid] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/auth/validate-token?token=${token}&type=${type}`)
      .then((r) => r.json())
      .then((data: { valid?: boolean; firstName?: string; email?: string; error?: string }) => {
        if (data.valid) setInfo({ firstName: data.firstName, email: data.email })
        else setTokenInvalid(true)
      })
      .catch(() => setTokenInvalid(true))
  }, [token, type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return }
    if (!/[A-Z]/.test(password)) { setError("Mật khẩu phải có ít nhất 1 chữ hoa."); return }
    if (!/[0-9]/.test(password)) { setError("Mật khẩu phải có ít nhất 1 chữ số."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type, password }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push("/login"), 2500)
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Đã xảy ra lỗi.")
      }
    } catch {
      setError("Lỗi kết nối.")
    } finally {
      setLoading(false)
    }
  }

  if (tokenInvalid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200 text-center max-w-sm w-full">
          <span className="text-4xl">❌</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">Link không hợp lệ hoặc đã hết hạn</h2>
          <p className="mt-2 text-sm text-gray-500">Vui lòng yêu cầu link mới từ quản trị viên.</p>
          <a href="/login" className="mt-4 block text-sm text-blue-700 hover:underline">← Đăng nhập</a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-5xl">🔐</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            {type === "onboarding" ? "Thiết lập mật khẩu" : "Đặt lại mật khẩu"}
          </h1>
          {info?.firstName && (
            <p className="mt-1 text-sm text-gray-500">Xin chào {info.firstName}</p>
          )}
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {done ? (
            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-green-700 font-medium">Mật khẩu đã được đặt thành công!</p>
              <p className="text-sm text-gray-500 mt-1">Đang chuyển hướng đến trang đăng nhập...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới (≥8 ký tự, 1 chữ hoa, 1 số)
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu
                </label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading || !info} className="w-full">
                {loading ? "Đang lưu..." : "Đặt mật khẩu"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
