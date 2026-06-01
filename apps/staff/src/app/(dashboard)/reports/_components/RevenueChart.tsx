"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts"

type RevenueRow = {
  period: string
  roomRevenue: number
  serviceRevenue: number
  totalRevenue: number
  adr: number
  revpar: number
  roomNights: number
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

export function RevenueChart({
  current,
  compare,
  groupBy,
}: {
  current: RevenueRow[]
  compare?: RevenueRow[] | null
  groupBy: "day" | "week" | "month"
}) {
  // Build merged data — align compare by index
  const chartData = current.map((row, i) => ({
    period: row.period,
    "Phòng (HT)": Math.round(row.roomRevenue),
    "DV (HT)": Math.round(row.serviceRevenue),
    ...(compare && compare[i]
      ? { "Phòng (KK)": Math.round(compare[i]!.roomRevenue) }
      : {}),
  }))

  const groupLabel = groupBy === "day" ? "ngày" : groupBy === "week" ? "tuần" : "tháng"

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">
        Doanh thu theo {groupLabel}
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtShort}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [
              `${typeof value === "number" ? value.toLocaleString("vi-VN") : value} ₫`,
              String(name),
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="Phòng (HT)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="DV (HT)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {compare && (
            <Line
              type="monotone"
              dataKey="Phòng (KK)"
              stroke="#93c5fd"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {compare && (
        <p className="mt-2 text-xs text-gray-400">
          HT = Hiện tại · KK = Kỳ trước (đường nét đứt)
        </p>
      )}
    </div>
  )
}
