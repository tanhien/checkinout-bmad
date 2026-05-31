"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts"

type ChannelRow = { channel: string; count: number; revenue: number }

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"]

const CHANNEL_LABEL: Record<string, string> = {
  DIRECT: "Trực tiếp", PHONE: "Điện thoại", WALK_IN: "Walk-in",
  OTA: "OTA", KIOSK: "Kiosk",
}

export function ChannelChart({ rows }: { rows: ChannelRow[] }) {
  const data = rows.map((r) => ({
    name: CHANNEL_LABEL[r.channel] ?? r.channel,
    value: r.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: unknown) => `${v} bookings`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
