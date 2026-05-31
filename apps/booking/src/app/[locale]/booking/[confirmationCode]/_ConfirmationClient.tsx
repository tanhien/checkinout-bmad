"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"

export function ConfirmationClient({ code }: { code: string }) {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      <p className="text-2xl font-bold text-blue-800 tracking-wider font-mono">{code}</p>
      <button
        onClick={handleCopy}
        className="rounded-lg border border-blue-300 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors"
      >
        {copied ? t("confirmation.copied") : t("confirmation.copy")}
      </button>
    </div>
  )
}
