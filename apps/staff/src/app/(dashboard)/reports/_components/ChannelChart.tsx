"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

const CHANNEL_LABEL: Record<string, string> = {
  DIRECT: "Trực tiếp",
  KIOSK: "Kiosk",
  PHONE: "Điện thoại",
  WALK_IN: "Walk-in",
  OTA: "OTA",
  ONLINE: "Online",
}

type ChannelData = { channel: string; count: number; revenue: number }

export function ChannelChart({ data }: { data: ChannelData[] }) {
  const chartData = data.map((d) => ({
    name: CHANNEL_LABEL[d.channel] ?? d.channel,
    value: d.count,
  }))

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Phân bổ kênh bán</h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [typeof value === "number" ? value : 0, "Booking"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
