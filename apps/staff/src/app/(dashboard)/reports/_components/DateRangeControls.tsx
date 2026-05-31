"use client"

import { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

type Preset = { label: string; getDates: () => { from: string; to: string } }

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
function offsetIso(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
function startOfWeek(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d.toISOString().slice(0, 10)
}
function startOfMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10)
}
function startOfLastMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 10)
}
function endOfLastMonth(): string {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 0)).toISOString().slice(0, 10)
}

const PRESETS: Preset[] = [
  { label: "Hôm nay",       getDates: () => ({ from: todayIso(),        to: todayIso() }) },
  { label: "Tuần này",      getDates: () => ({ from: startOfWeek(),     to: offsetIso(6 - new Date().getUTCDay()) }) },
  { label: "Tháng này",     getDates: () => ({ from: startOfMonth(),    to: todayIso() }) },
  { label: "Tháng trước",   getDates: () => ({ from: startOfLastMonth(), to: endOfLastMonth() }) },
]

export function DateRangeControls({
  initialFrom,
  initialTo,
  initialCompare,
  showCompare = true,
  extraParams,
}: {
  initialFrom: string
  initialTo: string
  initialCompare: boolean
  showCompare?: boolean
  extraParams?: Record<string, string>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  const [from, setFrom] = useState(initialFrom)
  const [to, setTo] = useState(initialTo)
  const [compare, setCompare] = useState(initialCompare)

  function push(overrides: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    const merged = { from, to, compare: compare ? "true" : "false", ...extraParams, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v); else params.delete(k)
    }
    router.push(`${pathname}?${params.toString()}` as `/reports/occupancy?${string}` | `/reports/revenue?${string}` | `/reports/channels?${string}` | `/reports/arrivals-departures?${string}`)
  }

  function applyPreset(preset: Preset) {
    const { from: f, to: t } = preset.getDates()
    setFrom(f); setTo(t)
    push({ from: f, to: t })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Presets */}
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => applyPreset(p)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {p.label}
        </button>
      ))}

      {/* Date inputs */}
      <div className="flex items-center gap-1.5 text-xs">
        <input
          type="date"
          value={from}
          onChange={(e) => { setFrom(e.target.value); push({ from: e.target.value }) }}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={to}
          onChange={(e) => { setTo(e.target.value); push({ to: e.target.value }) }}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Compare toggle */}
      {showCompare && (
        <button
          onClick={() => {
            const next = !compare
            setCompare(next)
            push({ compare: next ? "true" : "false" })
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            compare
              ? "bg-blue-600 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          So sánh kỳ trước
        </button>
      )}
    </div>
  )
}
