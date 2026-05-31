import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"

const TABS = [
  { href: "/settings/property",    label: "Khách sạn" },
  { href: "/settings/room-types",  label: "Loại phòng" },
  { href: "/settings/rooms",       label: "Phòng" },
  { href: "/settings/rate-plans",  label: "Giá phòng" },
  { href: "/settings/services",    label: "Dịch vụ" },
  { href: "/settings/taxes",       label: "Thuế" },
  { href: "/settings/promo-codes", label: "Khuyến mãi" },
  { href: "/settings/staff",       label: "Nhân viên" },
]

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession()
  if (!session) redirect("/login")
  if (session.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 bg-white px-6 overflow-x-auto">
        <div className="flex items-end gap-1 min-w-max">
          <h1 className="text-lg font-bold text-gray-900 mr-4 pb-3 whitespace-nowrap">Cấu hình</h1>
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href as "/settings/property" | "/settings/room-types" | "/settings/rooms" | "/settings/rate-plans" | "/settings/services" | "/settings/taxes" | "/settings/promo-codes" | "/settings/staff"}
              className="pb-3 px-3 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors whitespace-nowrap"
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  )
}
