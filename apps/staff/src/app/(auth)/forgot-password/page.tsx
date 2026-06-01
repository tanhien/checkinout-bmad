"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@hotel/ui"
import { Button } from "@hotel/ui"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-5xl">🔑</span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="mt-1 text-sm text-gray-500">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          {sent ? (
            <div>
              <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 mb-4">
                Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu (hiệu lực 24 giờ).
              </div>
              <Link href="/login" className="text-sm text-blue-700 hover:underline">
                ← Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang gửi..." : "Gửi link đặt lại"}
              </Button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
