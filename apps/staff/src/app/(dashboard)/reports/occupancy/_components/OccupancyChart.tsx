"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"

type OccRow = { date: string; pct: number; occupied: number; total: number }

export function OccupancyChart({
  current,
  compare,
}: {
  current: OccRow[]
  compare?: OccRow[]
}) {
  const data = current.map((row, i) => ({
    date: row.date.slice(5), // MM-DD
    "Kỳ này (%)": row.pct,
    ...(compare ? { "Kỳ trước (%)": compare[i]?.pct ?? 0 } : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: unknown) => `${v}%`} />
        {compare && <Legend />}
        <Bar dataKey="Kỳ này (%)" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={40} />
        {compare && <Bar dataKey="Kỳ trước (%)" fill="#93c5fd" radius={[3, 3, 0, 0]} maxBarSize={40} />}
      </BarChart>
    </ResponsiveContainer>
  )
}
