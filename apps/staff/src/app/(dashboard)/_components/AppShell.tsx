"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import type { StaffRole } from "@/lib/auth"

// ─── Nav definition ───────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: string
  roles: StaffRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "🏠",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING", "ACCOUNTANT"],
  },
  {
    href: "/bookings",
    label: "Booking",
    icon: "📅",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK", "ACCOUNTANT"],
  },
  {
    href: "/rooms",
    label: "Phòng",
    icon: "🏨",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK"],
  },
  {
    href: "/housekeeping",
    label: "Housekeeping",
    icon: "🧹",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK", "HOUSEKEEPING"],
  },
  {
    href: "/guests",
    label: "Khách hàng",
    icon: "👥",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK", "ACCOUNTANT"],
  },
  {
    href: "/folio",
    label: "Folio & Thanh toán",
    icon: "💼",
    roles: ["ADMIN", "MANAGER", "FRONT_DESK", "ACCOUNTANT"],
  },
  {
    href: "/reports",
    label: "Báo cáo",
    icon: "📊",
    roles: ["ADMIN", "MANAGER", "ACCOUNTANT"],
  },
  {
    href: "/settings/staff",
    label: "Nhân viên",
    icon: "👔",
    roles: ["ADMIN", "MANAGER"],
  },
  {
    href: "/settings",
    label: "Cấu hình",
    icon: "⚙️",
    roles: ["ADMIN"],
  },
]

const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Quản trị",
  MANAGER: "Quản lý",
  FRONT_DESK: "Lễ tân",
  HOUSEKEEPING: "Buồng phòng",
  ACCOUNTANT: "Kế toán",
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  role,
  open,
  onClose,
}: {
  role: StaffRole
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gray-900 text-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo / property name */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-700">
          <span className="text-2xl">🏨</span>
          <span className="font-semibold text-lg tracking-tight">Hotel Staff</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <li key={item.href}>
                  <Link
                    href={item.href as Parameters<typeof Link>[0]["href"]}
                    onClick={onClose}
                    className={[
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    ].join(" ")}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Role badge + guide link at bottom */}
        <div className="px-4 py-4 border-t border-gray-700 space-y-2">
          <span className="block text-xs font-medium text-gray-400 uppercase tracking-wider px-2">
            {ROLE_LABELS[role]}
          </span>
          <Link
            href="/guide"
            target="_blank"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <span>📖</span>
            Hướng dẫn sử dụng
          </Link>
        </div>
      </aside>
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  staffName,
  role,
  onToggleSidebar,
}: {
  staffName: string
  role: StaffRole
  onToggleSidebar: () => void
}) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null)
    router.push("/login")
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
      {/* Hamburger — mobile only */}
      <button
        onClick={onToggleSidebar}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer on desktop */}
      <div className="hidden lg:block" />

      {/* Right: user info + logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-none">{staffName}</p>
          <p className="mt-0.5 text-xs text-gray-500">{ROLE_LABELS[role]}</p>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
        >
          {loggingOut ? "..." : "Đăng xuất"}
        </button>
      </div>
    </header>
  )
}

// ─── AppShell (root shell — manages sidebar open state) ──────────────────────

export function AppShell({
  role,
  staffName,
  children,
}: {
  role: StaffRole
  staffName: string
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          staffName={staffName}
          role={role}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
