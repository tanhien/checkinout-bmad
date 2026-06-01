"use client"

import { useRouter, usePathname } from "next/navigation"
import type { Route } from "next"

function shiftDay(iso: string, delta: number): string {
  const d = new Date(iso + "T00:00:00.000Z")
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

export function SingleDatePicker({ initialDate }: { initialDate: string }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.push(`${pathname}?date=${shiftDay(initialDate, -1)}` as Route)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        ← Hôm qua
      </button>
      <input
        type="date"
        defaultValue={initialDate}
        onChange={(e) => {
          if (e.target.value) router.push(`${pathname}?date=${e.target.value}` as Route)
        }}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={() => router.push(`${pathname}?date=${shiftDay(initialDate, 1)}` as Route)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Ngày mai →
      </button>
    </div>
  )
}
