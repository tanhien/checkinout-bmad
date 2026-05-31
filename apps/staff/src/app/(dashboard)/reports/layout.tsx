import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"

const TABS = [
  { href: "/reports/occupancy",           label: "Công suất" },
  { href: "/reports/revenue",             label: "Doanh thu" },
  { href: "/reports/channels",            label: "Kênh bán" },
  { href: "/reports/arrivals-departures", label: "Đến/Đi" },
]

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  // RBAC: only Accountant, Manager, Admin
  const allowed = ["ADMIN", "MANAGER", "ACCOUNTANT"]
  if (!allowed.includes(session.role)) redirect("/dashboard")

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex items-end gap-1">
          <h1 className="text-lg font-bold text-gray-900 mr-6 pb-3">Báo cáo</h1>
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href as "/reports/occupancy" | "/reports/revenue" | "/reports/channels" | "/reports/arrivals-departures"}
              className="relative pb-3 px-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
