"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { useState } from "react"

export function Header({
  propertyName,
  logoUrl,
  guestFirstName,
}: {
  propertyName: string
  logoUrl?: string | null
  guestFirstName?: string | null
}) {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const otherLocale = locale === "vi" ? "en" : "vi"
  // Switch locale by replacing the locale prefix in the pathname
  const switchLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push(`/${locale}`)
    router.refresh()
  }

  const navLinks = [
    { href: `/${locale}`, label: t("nav.home") },
    { href: `/${locale}/rooms`, label: t("nav.rooms") },
    { href: `/${locale}/about`, label: t("nav.about") },
    { href: `/${locale}/contact`, label: t("nav.contact") },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-blue-700 text-lg">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={propertyName} className="h-8 w-auto object-contain" />
          ) : (
            <span>{propertyName}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700 transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <Link
            href={switchLocalePath}
            className="text-xs font-semibold text-gray-500 hover:text-blue-700 border border-gray-300 rounded px-2 py-1 transition-colors"
          >
            {otherLocale.toUpperCase()}
          </Link>

          {guestFirstName ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/${locale}/my-bookings`}
                className="text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                {t("nav.my_bookings")}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-gray-500 hover:text-red-600"
              >
                {t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href={`/${locale}/login`}
                className="text-sm font-medium text-gray-700 hover:text-blue-700"
              >
                {t("nav.login")}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-700 py-1.5"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <hr className="my-2" />
          {guestFirstName ? (
            <>
              <Link href={`/${locale}/my-bookings`} className="block text-sm font-medium text-gray-700 py-1.5">
                {t("nav.my_bookings")}
              </Link>
              <button onClick={handleLogout} className="block text-sm font-medium text-red-600 py-1.5 w-full text-left">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="block text-sm font-medium text-gray-700 py-1.5">
                {t("nav.login")}
              </Link>
              <Link href={`/${locale}/register`} className="block text-sm font-medium text-blue-700 py-1.5">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
