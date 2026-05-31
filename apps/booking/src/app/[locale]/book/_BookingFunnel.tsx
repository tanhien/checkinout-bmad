"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc"

type RoomType = {
  id: string
  slug: string
  name: string
  basePrice: number
  photoUrls: string[]
  pricing: { total: number; nights: number; subtotal: number } | null
}

type PromoResult = {
  valid: boolean
  promoId?: string
  promoName?: string
  discountAmount?: number
  reason?: string
}

type GuestForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  idNumber: string
  arrivalTime: string
  specialRequests: string
}

const STEPS = ["book.step1", "book.step2", "book.step3", "book.step4"] as const

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " VNĐ"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function BookingFunnel({
  locale,
  roomType,
  checkin,
  checkout,
  adults,
  children,
}: {
  locale: string
  roomType: RoomType
  checkin: string
  checkout: string
  adults: number
  children: number
}) {
  const t = useTranslations()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Step 1 state
  const [promoCode, setPromoCode] = useState("")
  const [promoResult, setPromoResult] = useState<PromoResult | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [selectedRatePlanId, setSelectedRatePlanId] = useState<string | undefined>()

  // Step 2 state
  const [guest, setGuest] = useState<GuestForm>({
    firstName: "", lastName: "", email: "", phone: "",
    nationality: "", idNumber: "", arrivalTime: "", specialRequests: "",
  })

  // Step 3 state
  const [agreed, setAgreed] = useState(false)

  // Error state
  const [error, setError] = useState<string | null>(null)

  const nights = roomType.pricing?.nights ?? 1
  const subtotal = roomType.pricing?.total ?? roomType.basePrice * nights
  const discountAmt = promoResult?.valid ? (promoResult.discountAmount ?? 0) : 0
  const total = Math.max(0, subtotal - discountAmt)

  async function applyPromo() {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const result = await trpc.portal.validatePromoCode.query({
        code: promoCode.trim(),
        roomTypeId: roomType.id,
        totalAmount: subtotal,
      })
      setPromoResult(result)
    } catch {
      setPromoResult({ valid: false, reason: "INVALID_CODE" })
    } finally {
      setPromoLoading(false)
    }
  }

  async function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await trpc.portal.createBooking.mutate({
          roomTypeId: roomType.id,
          ratePlanId: selectedRatePlanId,
          checkin,
          checkout,
          adults,
          children,
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone || undefined,
          nationality: guest.nationality || undefined,
          idNumber: guest.idNumber || undefined,
          arrivalTime: guest.arrivalTime || undefined,
          specialRequests: guest.specialRequests || undefined,
          promoCode: promoResult?.valid ? promoCode.trim() : undefined,
          locale: locale as "vi" | "en",
        })
        router.push(`/${locale}/booking/${result.confirmationCode}?email=${encodeURIComponent(guest.email)}`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ""
        if (msg.includes("NO_AVAILABILITY")) {
          setError(t("book.no_availability"))
        } else {
          setError(t("common.error"))
        }
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${i < step ? "bg-blue-700 text-white" : i === step ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">{t(s)}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-700 rounded-full transition-all duration-300"
            style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Confirm selection + promo */}
      {step === 0 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-6">{t("book.step1")}</h1>

          {/* Room summary */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">{roomType.name}</h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{t("book.summary.dates")}: {formatDate(checkin)} → {formatDate(checkout)} ({nights} {t("common.nights")})</p>
              <p>{t("book.summary.guests")}: {adults} người lớn{children > 0 ? `, ${children} trẻ em` : ""}</p>
              <p className="font-semibold text-blue-700 text-base mt-2">{formatVND(subtotal)}</p>
            </div>
          </div>

          {/* Promo code */}
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200 mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">{t("book.promo.label")}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder={t("book.promo.placeholder")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="rounded-lg bg-gray-700 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {promoLoading ? "..." : t("book.promo.apply")}
              </button>
            </div>
            {promoResult?.valid && (
              <p className="text-sm text-green-700 mt-2 font-medium">
                {t("book.promo.valid")} {formatVND(promoResult.discountAmount ?? 0)}
              </p>
            )}
            {promoResult && !promoResult.valid && (
              <p className="text-sm text-red-600 mt-2">{t("book.promo.invalid")}</p>
            )}
          </div>

          {/* Price summary */}
          <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100 mb-6">
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>{t("book.summary.subtotal")}</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-700 mb-1">
                <span>{t("book.summary.discount")}</span>
                <span>-{formatVND(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 mt-2 pt-2 border-t border-blue-200">
              <span>{t("book.summary.total")}</span>
              <span className="text-blue-700">{formatVND(total)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t("book.pay_at_property")}</p>
          </div>

          <button
            onClick={() => setStep(1)}
            className="w-full rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            {t("common.next")}
          </button>
        </div>
      )}

      {/* Step 2: Guest info */}
      {step === 1 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-6">{t("book.step2")}</h1>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.last_name")}</label>
                <input type="text" value={guest.lastName}
                  onChange={(e) => setGuest((g) => ({ ...g, lastName: e.target.value }))}
                  required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.first_name")}</label>
                <input type="text" value={guest.firstName}
                  onChange={(e) => setGuest((g) => ({ ...g, firstName: e.target.value }))}
                  required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.email")}</label>
              <input type="email" value={guest.email}
                onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.phone")}</label>
              <input type="tel" value={guest.phone}
                onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.nationality")}</label>
                <input type="text" value={guest.nationality}
                  onChange={(e) => setGuest((g) => ({ ...g, nationality: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.id_number")}</label>
                <input type="text" value={guest.idNumber}
                  onChange={(e) => setGuest((g) => ({ ...g, idNumber: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.arrival_time")}</label>
              <input type="time" value={guest.arrivalTime}
                onChange={(e) => setGuest((g) => ({ ...g, arrivalTime: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t("book.guest.requests")}</label>
              <textarea value={guest.specialRequests}
                onChange={(e) => setGuest((g) => ({ ...g, specialRequests: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setStep(0)} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {t("common.back")}
            </button>
            <button
              disabled={!guest.firstName || !guest.lastName || !guest.email}
              onClick={() => setStep(2)}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review + T&C */}
      {step === 2 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-6">{t("book.step3")}</h1>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200 mb-5 text-sm space-y-2">
            <p className="font-semibold text-gray-900">{roomType.name}</p>
            <p className="text-gray-600">{formatDate(checkin)} → {formatDate(checkout)} · {nights} {t("common.nights")}</p>
            <p className="text-gray-600">{guest.firstName} {guest.lastName} · {guest.email}</p>
            {guest.phone && <p className="text-gray-600">{guest.phone}</p>}
            {guest.specialRequests && <p className="text-gray-500 italic">{guest.specialRequests}</p>}
          </div>

          {/* Price summary */}
          <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-100 mb-5">
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>{t("book.summary.subtotal")}</span>
              <span>{formatVND(subtotal)}</span>
            </div>
            {discountAmt > 0 && (
              <div className="flex justify-between text-sm text-green-700 mb-1">
                <span>{t("book.summary.discount")}</span>
                <span>-{formatVND(discountAmt)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-900 mt-2 pt-2 border-t border-blue-200">
              <span>{t("book.summary.total")}</span>
              <span className="text-blue-700">{formatVND(total)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{t("book.pay_at_property")}</p>
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-700 rounded" />
            <span className="text-sm text-gray-700">{t("book.terms.agree")}</span>
          </label>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {t("common.back")}
            </button>
            <button
              disabled={!agreed}
              onClick={() => setStep(3)}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {t("common.next")}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 3 && (
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-6">{t("book.step4")}</h1>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-gray-200 mb-5 text-sm space-y-2">
            <p className="font-semibold text-gray-900">{roomType.name}</p>
            <p className="text-gray-600">{formatDate(checkin)} → {formatDate(checkout)} · {nights} {t("common.nights")}</p>
            <p className="text-gray-600">{guest.firstName} {guest.lastName} · {guest.email}</p>
          </div>
          <div className="rounded-2xl bg-blue-700 p-5 text-white mb-6">
            <p className="text-sm font-medium mb-1">{t("book.summary.total")}</p>
            <p className="text-3xl font-bold">{formatVND(total)}</p>
            <p className="text-sm text-blue-200 mt-1">{t("book.pay_at_property")}</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 mb-4 ring-1 ring-red-200">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              {t("common.back")}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isPending}
              className="flex-1 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? t("common.loading") : t("book.confirm_btn")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
