import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { getPortalCaller } from "@/lib/portal-caller"
import { ConfirmationClient } from "./_ConfirmationClient"

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

  if (!sp.email) notFound()

  let booking = null
  try {
    const caller = await getPortalCaller()
    booking = await caller.portal.getBookingByCode({ code: confirmationCode, email: sp.email })
  } catch {
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

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 print:max-w-full print:px-8">
      {/* Print-only heading */}
      <p className="hidden print:block text-xs text-gray-500 mb-4">{t("confirmation.title")}</p>

      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎉</div>
        <h1 className="text-2xl font-bold text-gray-900">{t("confirmation.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("confirmation.email_sent")} {booking.guest.email}
        </p>
      </div>

      {/* Confirmation code + QR */}
      <div className="rounded-2xl bg-blue-50 ring-2 ring-blue-200 p-6 mb-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            {t("confirmation.code_label")}
          </p>
          <ConfirmationClient code={booking.confirmationCode} />
          <p className="text-xs text-gray-500 mt-3">{t("confirmation.qr_instruction")}</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR Code" className="w-32 h-32 flex-shrink-0" />
      </div>

      {/* Booking details */}
      <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t("confirmation.details")}</h2>
        <div className="space-y-2 text-sm">
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
            <span className="font-medium">{booking.totalNights}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t("book.summary.guests")}</span>
            <span className="font-medium">{booking.adults} người lớn{booking.children > 0 ? ` + ${booking.children} trẻ em` : ""}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-semibold text-gray-700">{t("common.total")}</span>
            <span className="font-bold text-blue-700">
              {(booking.roomPricePerNight * booking.totalNights - (booking.discountAmount ?? 0)).toLocaleString("vi-VN")} VNĐ
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <a
          href={googleCalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          📅 {t("confirmation.add_calendar")}
        </a>
        <button
          onClick={() => window.print()}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🖨 {t("confirmation.print")}
        </button>
        <a
          href={`/${locale}/my-bookings`}
          className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
        >
          {t("confirmation.manage")}
        </a>
      </div>

      {/* Hidden ICS data for download */}
      <script
        id="ics-data"
        type="text/plain"
        dangerouslySetInnerHTML={{ __html: icsContent }}
      />

      {/* Print styles */}
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
