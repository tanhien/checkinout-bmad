"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

type Day = { date: string; occupied: number; total: number; pct: number }

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00.000Z")
  return d.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", timeZone: "UTC" })
}

export function OccupancyChart({ data }: { data: Day[] }) {
  const chartData = data.map((d) => ({
    date: fmtDate(d.date),
    pct: d.pct,
    label: `${d.occupied}/${d.total} phòng`,
  }))

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-4 text-sm font-semibold text-gray-700">Công suất phòng theo ngày (%)</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            unit="%"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, _name, props) => [
              `${value}% (${props.payload?.label ?? ""})`,
              "Công suất",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.pct >= 80 ? "#22c55e" : entry.pct >= 50 ? "#3b82f6" : "#d1d5db"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-2 text-right text-xs text-gray-400">
        Xanh lá ≥80% · Xanh dương ≥50% · Xám &lt;50%
      </p>
    </div>
  )
}
