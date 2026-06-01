"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc"

type LookupResult = {
  confirmationCode: string
  status: string
  checkInDate: string
  checkOutDate: string
  totalNights: number
  adults: number
  children: number
  guest: { firstName: string; lastName: string; email: string }
  roomType: { name: string; slug: string }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function BookingLookup({ locale }: { locale: string }) {
  const t = useTranslations()
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [result, setResult] = useState<LookupResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setLoading(true)
    try {
      const booking = await trpc.portal.lookupBooking.query({ code: code.toUpperCase(), email })
      setResult(booking)
    } catch {
      setError(t("bookings.lookup.not_found"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t("bookings.lookup.title")}</h1>
      <form onSubmit={handleLookup} className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("bookings.lookup.code")}</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="HTL-2025-ABC123"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("bookings.lookup.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {loading ? t("common.loading") : t("bookings.lookup.btn")}
        </button>
      </form>

      {result && (
        <div className="rounded-xl bg-blue-50 p-5 ring-1 ring-blue-100 space-y-2 text-sm">
          <p className="font-bold text-blue-800 font-mono text-base">{result.confirmationCode}</p>
          <p className="font-semibold text-gray-900">{result.roomType.name}</p>
          <p className="text-gray-600">{formatDate(result.checkInDate)} → {formatDate(result.checkOutDate)} · {result.totalNights} đêm</p>
          <p className="text-gray-600">{result.guest.lastName} {result.guest.firstName}</p>
          <div className="pt-2">
            <Link
              href={`/${locale}/booking/${result.confirmationCode}?email=${encodeURIComponent(result.guest.email)}`}
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              {t("confirmation.manage")} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
