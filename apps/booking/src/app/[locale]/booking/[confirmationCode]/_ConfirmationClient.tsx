"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

export function ConfirmationCode({ code }: { code: string }) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-2xl font-bold text-amber-800 tracking-wider font-mono">{code}</p>
      <button
        onClick={handleCopy}
        className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
      >
        {copied ? t("confirmation.copied") : t("confirmation.copy")}
      </button>
    </div>
  )
}

export function ConfirmationActions({
  googleCalUrl,
  managePath,
  icsContent,
  confirmationCode,
}: {
  googleCalUrl: string
  managePath: string
  icsContent: string
  confirmationCode: string
}) {
  const t = useTranslations()

  function handleDownloadIcs() {
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `booking-${confirmationCode}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
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
        onClick={handleDownloadIcs}
        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        📥 ICS
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        🖨 {t("confirmation.print")}
      </button>
      <a
        href={managePath}
        className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
      >
        {t("confirmation.manage")}
      </a>
    </div>
  )
}
