"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import type { Route } from "next"

type Preset = { key: string; label: string }

const PRESETS: Preset[] = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "lastMonth", label: "Tháng trước" },
]

function computePreset(key: string): { from: string; to: string } {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  const today = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`

  if (key === "today") return { from: today, to: today }

  if (key === "week") {
    const dow = now.getUTCDay() // 0=Sun
    const offset = dow === 0 ? 6 : dow - 1
    const monday = new Date(Date.UTC(y, m, d - offset))
    return { from: monday.toISOString().slice(0, 10), to: today }
  }

  if (key === "month") {
    const first = new Date(Date.UTC(y, m, 1))
    return { from: first.toISOString().slice(0, 10), to: today }
  }

  if (key === "lastMonth") {
    const first = new Date(Date.UTC(y, m - 1, 1))
    const last = new Date(Date.UTC(y, m, 0))
    return { from: first.toISOString().slice(0, 10), to: last.toISOString().slice(0, 10) }
  }

  return { from: today, to: today }
}

export function DateRangePicker({
  initialFrom,
  initialTo,
}: {
  initialFrom: string
  initialTo: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)

  function navigate(f: string, t: string) {
    router.push(`${pathname}?from=${f}&to=${t}` as Route)
  }

  function handlePreset(key: string) {
    const range = computePreset(key)
    setFrom(range.from)
    setTo(range.to)
    navigate(range.from, range.to)
  }

  function handleApply(e: React.FormEvent) {
    e.preventDefault()
    navigate(from, to)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => handlePreset(p.key)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {p.label}
        </button>
      ))}
      <form onSubmit={handleApply} className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400 text-sm">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Xem
        </button>
      </form>
    </div>
  )
}
