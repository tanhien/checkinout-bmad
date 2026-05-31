"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function SearchWidget({ locale }: { locale: string }) {
  const t = useTranslations()
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const [checkin, setCheckin] = useState(today)
  const [checkout, setCheckout] = useState(tomorrow)
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(0)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ checkin, checkout, adults: String(adults), children: String(children) })
    router.push(`/${locale}/rooms?${params}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("common.checkin")}</label>
        <input
          type="date"
          value={checkin}
          min={today}
          onChange={(e) => setCheckin(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("common.checkout")}</label>
        <input
          type="date"
          value={checkout}
          min={checkin || today}
          onChange={(e) => setCheckout(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("common.adults")}</label>
        <select
          value={adults}
          onChange={(e) => setAdults(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">{t("common.children")}</label>
        <select
          value={children}
          onChange={(e) => setChildren(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-xl bg-blue-700 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors h-[38px]"
      >
        {t("home.search.btn")}
      </button>
    </form>
  )
}
