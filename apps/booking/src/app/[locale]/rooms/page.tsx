import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { RoomsClient } from "./_RoomsClient"

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ checkin?: string; checkout?: string; adults?: string; children?: string; sort?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("rooms.title") }
}

export default async function RoomsPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale })

  const checkin = sp.checkin
  const checkout = sp.checkout
  const adults = Number(sp.adults ?? 1)
  const children = Number(sp.children ?? 0)

  let rooms: Awaited<ReturnType<Awaited<ReturnType<typeof getPortalCaller>>["portal"]["getRoomTypes"]>> = []
  try {
    const caller = await getPortalCaller()
    rooms = await caller.portal.getRoomTypes({ checkin, checkout, adults, children })
  } catch { /* fallback */ }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("rooms.title")}</h1>
      <RoomsClient
        rooms={rooms}
        locale={locale}
        checkin={checkin}
        checkout={checkout}
        adults={adults}
        childCount={children}
        initialSort={sp.sort ?? "price_asc"}
      />
    </div>
  )
}
