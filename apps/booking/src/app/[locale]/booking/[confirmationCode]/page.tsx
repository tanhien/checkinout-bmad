import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { getPortalCaller } from "@/lib/portal-caller"
import { getGuestSession } from "@/lib/auth"
import { ConfirmationCode, ConfirmationActions } from "./_ConfirmationClient"

type Props = {
  params: Promise<{ locale: string; confirmationCode: string }>
  searchParams: Promise<{ email?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, confirmationCode } = await params
  const t = await getTranslations({ locale })
  return { title: `${t("confirmation.title")} — ${confirmationCode}`, robots: "noindex" }
}

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale, confirmationCode } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale })

  // Resolve email: query param first, then logged-in guest session
  let email = sp.email?.trim() || null
  if (!email) {
    const session = await getGuestSession()
    email = session?.email ?? null
  }

  if (!email) notFound()

  let booking = null
  try {
    const caller = await getPortalCaller()
    booking = await caller.portal.getBookingByCode({ code: confirmationCode, email })
  } catch (err) {
    if (err instanceof Error && err.message === "NEXT_NOT_FOUND") throw err
    notFound()
  }
  if (!booking) notFound()

  // Generate QR code as base64 PNG
  const qrData = JSON.stringify({ code: booking.confirmationCode, v: 1 })
  const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 2 })

  // Generate ICS calendar data
  const checkIn = new Date(booking.checkInDate)
  const checkOut = new Date(booking.checkOutDate)
  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hotel Booking//EN",
    "BEGIN:VEVENT",
    `UID:${booking.confirmationCode}@hotel`,
    `DTSTART:${formatIcsDate(checkIn)}`,
    `DTEND:${formatIcsDate(checkOut)}`,
    `SUMMARY:${booking.roomType.name}`,
    `DESCRIPTION:Booking ${booking.confirmationCode}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")

  const googleCalUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(`${booking.roomType.name} - ${booking.confirmationCode}`)}` +
    `&dates=${formatIcsDate(checkIn)}/${formatIcsDate(checkOut)}` +
    `&details=${encodeURIComponent(`Booking: ${booking.confirmationCode}`)}`

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })

  const isVi = locale === "vi"
  const totalAmount = booking.roomPricePerNight * booking.totalNights - (booking.discountAmount ?? 0)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 print:max-w-full print:px-8">
      <p className="hidden print:block text-xs text-gray-500 mb-4">{t("confirmation.title")}</p>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">{t("confirmation.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("confirmation.email_sent")} <span className="font-medium">{booking.guest.email}</span>
        </p>
      </div>

      {/* Confirmation code + QR */}
      <div className="rounded-2xl bg-amber-50 ring-2 ring-amber-200 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
            {t("confirmation.code_label")}
          </p>
          <ConfirmationCode code={booking.confirmationCode} />
          <p className="text-xs text-gray-500 mt-3">{t("confirmation.qr_instruction")}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 flex-shrink-0 rounded-xl" />
      </div>

      {/* Booking details */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t("confirmation.details")}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.room")}</span>
            <span className="font-medium">{booking.roomType.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.dates")}</span>
            <span className="font-medium">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.nights")}</span>
            <span className="font-medium">{booking.totalNights} {t("common.nights")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.guests")}</span>
            <span className="font-medium">
              {booking.adults} {isVi ? "người lớn" : "adults"}
              {booking.children > 0 ? ` + ${booking.children} ${isVi ? "trẻ em" : "children"}` : ""}
            </span>
          </div>
          {booking.ratePlan && (
            <div className="flex justify-between">
              <span className="text-gray-500">{isVi ? "Gói giá" : "Rate"}</span>
              <span className="font-medium">{booking.ratePlan.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.rate")}</span>
            <span className="font-medium">{booking.roomPricePerNight.toLocaleString("vi-VN")} VNĐ</span>
          </div>
          {(booking.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-green-700">
              <span>{t("book.summary.discount")}</span>
              <span>-{(booking.discountAmount ?? 0).toLocaleString("vi-VN")} VNĐ</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-700">{t("common.total")}</span>
            <span className="font-bold text-amber-700 text-base">
              {totalAmount.toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">{t("book.pay_at_property")}</p>
      </div>

      {/* Guest info */}
      <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 p-5 mb-6 text-sm">
        <p className="font-semibold text-gray-700 mb-2">{isVi ? "Thông tin khách" : "Guest Info"}</p>
        <p className="text-gray-600">{booking.guest.lastName} {booking.guest.firstName}</p>
        <p className="text-gray-500">{booking.guest.email}</p>
      </div>

      {/* Actions */}
      <ConfirmationActions
        googleCalUrl={googleCalUrl}
        managePath={`/${locale}/my-bookings`}
        icsContent={icsContent}
        confirmationCode={booking.confirmationCode}
      />

      <style>{`
        @media print {
          header, footer, nav { display: none !important; }
          .print\\:hidden { display: none !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
