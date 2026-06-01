"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

type Props = {
  locale: string
  roomTypeId: string
  basePrice: number
  currency: string
  initialCheckin?: string
  initialCheckout?: string
  initialAdults: number
  initialChildren: number
}

function formatPrice(amount: number, currency: string) {
  return amount.toLocaleString("vi-VN") + " " + (currency === "VND" ? "VNĐ" : currency)
}

function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

export function RoomBookingWidget({
  locale,
  roomTypeId,
  basePrice,
  currency,
  initialCheckin,
  initialCheckout,
  initialAdults,
  initialChildren,
}: Props) {
  const t = useTranslations()
  const router = useRouter()

  const todayStr = new Date().toISOString().slice(0, 10)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const [checkin, setCheckin] = useState(initialCheckin ?? todayStr)
  const [checkout, setCheckout] = useState(initialCheckout ?? tomorrowStr)
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)

  const nights = checkin && checkout && checkout > checkin ? diffDays(checkin, checkout) : 0
  const total = nights * basePrice

  function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!checkin || !checkout || checkout <= checkin) return
    const params = new URLSearchParams({
      roomTypeId,
      checkin,
      checkout,
      adults: String(adults),
      children: String(children),
    })
    router.push(`/${locale}/book?${params}`)
  }

  return (
    <form
      onSubmit={handleBook}
      className="sticky top-20 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 space-y-4"
    >
      {/* Price */}
      <div>
        <p className="text-xs text-gray-500">{t("common.from")}</p>
        <p className="text-2xl font-bold text-amber-700">{formatPrice(basePrice, currency)}</p>
        <p className="text-xs text-gray-500">{t("common.per_night")}</p>
      </div>

      {/* Check-in */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t("common.checkin")}
        </label>
        <input
          type="date"
          value={checkin}
          min={todayStr}
          onChange={(e) => {
            setCheckin(e.target.value)
            if (checkout <= e.target.value) {
              setCheckout(new Date(new Date(e.target.value).getTime() + 86400000).toISOString().slice(0, 10))
            }
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          required
        />
      </div>

      {/* Check-out */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          {t("common.checkout")}
        </label>
        <input
          type="date"
          value={checkout}
          min={checkin ? new Date(new Date(checkin).getTime() + 86400000).toISOString().slice(0, 10) : tomorrowStr}
          onChange={(e) => setCheckout(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          required
        />
      </div>

      {/* Guests */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {t("common.adults")}
          </label>
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {t("common.children")}
          </label>
          <select
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {[0, 1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Price summary */}
      {nights > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>{formatPrice(basePrice, currency)} × {nights} {t("common.nights")}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
            <span>{t("common.total")}</span>
            <span>{formatPrice(total, currency)}</span>
          </div>
        </div>
      )}

      {/* Book button */}
      <button
        type="submit"
        disabled={nights <= 0}
        className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t("rooms.book_this")}
      </button>

      <p className="text-center text-xs text-gray-400">{t("book.pay_at_property")}</p>
    </form>
  )
}
