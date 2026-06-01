import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getGuestSession } from "@/lib/auth"
import { getPortalCaller } from "@/lib/portal-caller"
import { MyBookingsClient } from "./_MyBookingsClient"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("bookings.title"), robots: "noindex" }
}

export default async function MyBookingsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })
  const session = await getGuestSession()

  if (!session) {
    redirect(`/${locale}/login`)
  }

  let bookings: Awaited<ReturnType<Awaited<ReturnType<typeof getPortalCaller>>["portal"]["getMyBookings"]>> = []
  try {
    const caller = await getPortalCaller()
    bookings = await caller.portal.getMyBookings()
  } catch { /* fallback */ }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("bookings.title")}</h1>
        <Link
          href={`/${locale}/my-bookings/lookup`}
          className="text-sm text-blue-700 hover:underline"
        >
          {t("bookings.lookup.title")} →
        </Link>
      </div>
      <MyBookingsClient bookings={bookings} locale={locale} guestEmail={session.email} />
    </div>
  )
}
