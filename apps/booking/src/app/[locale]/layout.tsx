import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import { getPortalCaller } from "@/lib/portal-caller"
import { getGuestSession } from "@/lib/auth"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let propertyName = "Hotel"
  try {
    const caller = await getPortalCaller()
    const property = await caller.portal.getProperty()
    propertyName = property.name
  } catch { /* fallback */ }

  return {
    title: { default: propertyName, template: `%s | ${propertyName}` },
    description: t("home.search.title"),
    openGraph: {
      siteName: propertyName,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: locale === "vi" ? "en_US" : "vi_VN",
      type: "website",
    },
    alternates: {
      languages: { vi: "/vi", en: "/en" },
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "vi" | "en")) {
    notFound()
  }

  const [messages, guestSession] = await Promise.all([
    getMessages(),
    getGuestSession(),
  ])

  let property: { name: string; logoUrl?: string | null } = { name: "Hotel" }
  let guestFirstName: string | null = null

  try {
    const caller = await getPortalCaller()
    const [p, me] = await Promise.allSettled([
      caller.portal.getProperty(),
      guestSession ? caller.portal.me() : Promise.reject(null),
    ])
    if (p.status === "fulfilled") property = p.value
    if (me.status === "fulfilled") guestFirstName = me.value.firstName
  } catch { /* fallback */ }

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <NextIntlClientProvider messages={messages}>
          <Header
            propertyName={property.name}
            logoUrl={property.logoUrl}
            guestFirstName={guestFirstName}
          />
          <main className="flex-1">{children}</main>
          <Footer propertyName={property.name} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
