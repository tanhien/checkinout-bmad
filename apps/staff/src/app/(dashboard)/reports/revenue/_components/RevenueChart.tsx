"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts"

type RevRow = { period: string; totalRevenue: number }

function fmtK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return String(Math.round(n))
}

export function RevenueChart({
  current,
  compare,
}: {
  current: RevRow[]
  compare?: RevRow[]
}) {
  const data = current.map((row, i) => ({
    period: row.period.length > 7 ? row.period.slice(5) : row.period,
    "Kỳ này": row.totalRevenue,
    ...(compare ? { "Kỳ trước": compare[i]?.totalRevenue ?? 0 } : {}),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: unknown) => Number(v).toLocaleString("vi-VN") + " đ"} />
        {compare && <Legend />}
        <Line type="monotone" dataKey="Kỳ này" stroke="#3b82f6" strokeWidth={2} dot={false} />
        {compare && <Line type="monotone" dataKey="Kỳ trước" stroke="#93c5fd" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
      </LineChart>
    </ResponsiveContainer>
  )
}
