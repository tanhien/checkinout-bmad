"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"

export function ResetPasswordForm({ locale, token }: { locale: string; token: string }) {
  const t = useTranslations()
  const [password, setPassword] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t("common.error"))
        return
      }
      setDone(true)
    } catch {
      setError(t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("auth.reset.title")}</h1>
      {done ? (
        <div>
          <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200 mb-4">
            {t("auth.reset.success")}
          </div>
          <Link href={`/${locale}/login`} className="text-sm text-blue-700 hover:underline">{t("auth.login.btn")}</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.reset.password")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {loading ? t("common.loading") : t("auth.reset.btn")}
          </button>
        </form>
      )}
    </div>
  )
}
