import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound, redirect } from "next/navigation"
import { getPortalCaller } from "@/lib/portal-caller"
import { getGuestSession } from "@/lib/auth"
import { BookingFunnel } from "./_BookingFunnel"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ roomTypeId?: string; checkin?: string; checkout?: string; adults?: string; children?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("book.title") }
}

export default async function BookPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams

  if (!sp.roomTypeId) notFound()

  const checkin = sp.checkin
  const checkout = sp.checkout
  const adults = Number(sp.adults ?? 2)
  const children = Number(sp.children ?? 0)

  // Dates missing or invalid → redirect to room detail so user can pick dates
  if (!checkin || !checkout || checkout <= checkin) {
    let roomSlug: string | null = null
    try {
      const caller = await getPortalCaller()
      const rooms = await caller.portal.getRoomTypes({})
      roomSlug = rooms.find((r) => r.id === sp.roomTypeId)?.slug ?? null
    } catch { /* ignore */ }

    if (roomSlug) {
      redirect(`/${locale}/rooms/${roomSlug}?adults=${adults}&children=${children}`)
    }
    notFound()
  }

  // Fetch room type and guest profile in parallel
  const guestSession = await getGuestSession()

  let roomType = null
  let guestProfile: {
    firstName: string
    lastName: string
    email: string
    phone: string
    nationality: string
  } | null = null

  try {
    const caller = await getPortalCaller()
    const [rooms, me] = await Promise.allSettled([
      caller.portal.getRoomTypes({ checkin, checkout, adults, children }),
      guestSession ? caller.portal.me() : Promise.reject(null),
    ])

    if (rooms.status === "fulfilled") {
      roomType = rooms.value.find((r) => r.id === sp.roomTypeId) ?? null
    }

    if (me.status === "fulfilled") {
      const g = me.value
      guestProfile = {
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone ?? "",
        nationality: g.nationality ?? "",
      }
    }
  } catch { /* fallback */ }

  if (!roomType) notFound()

  return (
    <BookingFunnel
      locale={locale}
      roomType={roomType}
      checkin={checkin}
      checkout={checkout}
      adults={adults}
      childCount={children}
      guestProfile={guestProfile}
    />
  )
}
