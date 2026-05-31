"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

export function ForgotPasswordForm({ locale: _locale }: { locale: string }) {
  const t = useTranslations()
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
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t("auth.forgot.title")}</h1>
      <p className="text-sm text-gray-500 mb-6">{t("auth.forgot.instruction")}</p>
      {sent ? (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 ring-1 ring-green-200">
          {t("auth.forgot.sent")}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("auth.forgot.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {loading ? t("common.loading") : t("auth.forgot.btn")}
          </button>
        </form>
      )}
    </div>
  )
}
