"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations()
  const router = useRouter()
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("auth.register.title")}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.register.last_name")}</label>
            <input type="text" value={form.lastName} onChange={update("lastName")} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.register.first_name")}</label>
            <input type="text" value={form.firstName} onChange={update("firstName")} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.register.email")}</label>
          <input type="email" value={form.email} onChange={update("email")} required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.register.phone")}</label>
          <input type="tel" value={form.phone} onChange={update("phone")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.register.password")}</label>
          <input type="password" value={form.password} onChange={update("password")} required minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {loading ? t("common.loading") : t("auth.register.btn")}
        </button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-500">
        {t("auth.register.have_account")}{" "}
        <Link href={`/${locale}/login`} className="text-blue-700 hover:underline">
          {t("auth.register.login_link")}
        </Link>
      </p>
    </div>
  )
}
