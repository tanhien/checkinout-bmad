"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/reports/occupancy", label: "Công suất" },
  { href: "/reports/revenue", label: "Doanh thu" },
  { href: "/reports/channels", label: "Kênh bán" },
  { href: "/reports/arrivals-departures", label: "Arrivals / Departures" },
]

export function ReportNav() {
  const pathname = usePathname()
  return (
    <nav className="flex border-b border-gray-200 overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href as Parameters<typeof Link>[0]["href"]}
            className={[
              "whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors shrink-0",
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
