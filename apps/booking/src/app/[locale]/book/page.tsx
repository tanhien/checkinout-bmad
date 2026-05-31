import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { getPortalCaller } from "@/lib/portal-caller"
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

  if (!sp.roomTypeId || !sp.checkin || !sp.checkout) notFound()

  const checkin = sp.checkin
  const checkout = sp.checkout
  const adults = Number(sp.adults ?? 2)
  const children = Number(sp.children ?? 0)

  let roomType = null
  try {
    const caller = await getPortalCaller()
    const rooms = await caller.portal.getRoomTypes({ checkin, checkout, adults, children })
    roomType = rooms.find((r) => r.id === sp.roomTypeId) ?? null
  } catch { /* fallback */ }

  if (!roomType) notFound()

  return (
    <BookingFunnel
      locale={locale}
      roomType={roomType}
      checkin={checkin}
      checkout={checkout}
      adults={adults}
      children={children}
    />
  )
}
