"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { trpc } from "@/lib/trpc"

type Booking = {
  id: string
  confirmationCode: string
  status: string
  checkInDate: string
  checkOutDate: string
  totalNights: number
  adults: number
  children: number
  roomType: { name: string; slug: string; photoUrls: string[] }
  freeCancelHours: number | null
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú",
  CHECKED_OUT: "Đã trả phòng",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function MyBookingsClient({ bookings, locale, guestEmail }: { bookings: Booking[]; locale: string; guestEmail: string }) {
  const t = useTranslations()
  const now = useMemo(() => Date.now(), [])

  const upcoming = bookings.filter((b) => b.status === "CONFIRMED")
  const active = bookings.filter((b) => b.status === "CHECKED_IN")
  const past = bookings.filter((b) => b.status === "CHECKED_OUT")
  const cancelled = bookings.filter((b) => b.status === "CANCELLED" || b.status === "NO_SHOW")

  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming")
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const tabs = {
    upcoming: [...upcoming, ...active],
    past,
    cancelled,
  }

  async function handleCancel(bookingId: string) {
    if (!confirm(t("bookings.cancel.confirm"))) return
    setCancellingId(bookingId)
    setCancelError(null)
    try {
      await trpc.portal.cancelMyBooking.mutate({ bookingId })
      window.location.reload()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("CANCEL_WINDOW_EXPIRED")) {
        setCancelError("Đã hết thời gian hủy miễn phí. Vui lòng liên hệ lễ tân.")
      } else {
        setCancelError(t("common.error"))
      }
    } finally {
      setCancellingId(null)
    }
  }

  const displayed = tabs[tab]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {(["upcoming", "past", "cancelled"] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t_ ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t(`bookings.tab.${t_}`)} ({tabs[t_].length})
          </button>
        ))}
      </div>

      {cancelError && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200 mb-4">{cancelError}</div>
      )}

      {displayed.length === 0 ? (
        <p className="text-center text-gray-500 py-12">{t("bookings.empty")}</p>
      ) : (
        <div className="space-y-4">
          {displayed.map((booking) => {
            const canCancel =
              booking.status === "CONFIRMED" &&
              new Date(booking.checkInDate).getTime() > now

            return (
              <div
                key={booking.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{booking.roomType.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[booking.status] ?? "bg-gray-100"}`}>
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)} · {booking.totalNights} đêm
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-1">{booking.confirmationCode}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Link
                      href={`/${locale}/booking/${booking.confirmationCode}?email=${encodeURIComponent(guestEmail)}`}
                      className="text-xs text-blue-700 hover:underline"
                    >
                      {t("bookings.detail.title")} →
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {cancellingId === booking.id ? "..." : t("bookings.cancel_btn")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
