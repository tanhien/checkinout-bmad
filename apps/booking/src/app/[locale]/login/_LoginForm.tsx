"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function LoginForm({ locale }: { locale: string }) {
  const t = useTranslations()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? t("common.error"))
        return
      }
      router.push(`/${locale}/my-bookings`)
      router.refresh()
    } catch {
      setError(t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("auth.login.title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.login.email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.login.password")}</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-blue-700 rounded" />
          <span className="text-xs text-gray-600">{t("auth.login.remember")}</span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {loading ? t("common.loading") : t("auth.login.btn")}
        </button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm text-center">
        <Link href={`/${locale}/forgot-password`} className="text-blue-700 hover:underline">
          {t("auth.login.forgot")}
        </Link>
        <p className="text-gray-500">
          {t("auth.login.no_account")}{" "}
          <Link href={`/${locale}/register`} className="text-blue-700 hover:underline">
            {t("auth.login.register_link")}
          </Link>
        </p>
      </div>
    </div>
  )
}
