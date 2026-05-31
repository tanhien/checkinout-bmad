import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { SearchWidget } from "./_components/SearchWidget"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  try {
    const caller = await getPortalCaller()
    const property = await caller.portal.getProperty()
    return {
      title: property.name,
      description: property.tagline ?? property.description ?? undefined,
      openGraph: {
        title: property.name,
        description: property.tagline ?? property.description ?? undefined,
        images: property.logoUrl ? [{ url: property.logoUrl }] : [],
        type: "website",
      },
    }
  } catch {
    return {}
  }
}

function formatPrice(amount: number, currency = "VND") {
  return amount.toLocaleString("vi-VN") + " " + (currency === "VND" ? "VNĐ" : currency)
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let property = null
  let featuredRooms: Awaited<ReturnType<Awaited<ReturnType<typeof getPortalCaller>>["portal"]["getRoomTypes"]>> = []

  try {
    const caller = await getPortalCaller()
    const [p, rooms] = await Promise.all([
      caller.portal.getProperty(),
      caller.portal.getRoomTypes({}),
    ])
    property = p
    featuredRooms = rooms.filter((r) => r.isFeatured).slice(0, 3)
    if (featuredRooms.length === 0) featuredRooms = rooms.slice(0, 3)
  } catch { /* show page without data */ }

  // Schema.org Hotel markup (E5-S1 AC 7)
  const schemaOrg = property
    ? {
        "@context": "https://schema.org",
        "@type": "Hotel",
        name: property.name,
        description: property.description,
        address: property.address,
        telephone: property.phone,
        email: property.email,
        logo: property.logoUrl,
        checkinTime: `${String(property.checkInHour).padStart(2, "0")}:00`,
        checkoutTime: `${String(property.checkOutHour).padStart(2, "0")}:00`,
      }
    : null

  return (
    <>
      {schemaOrg && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      )}

      {/* Hero */}
      <section className="relative bg-blue-900 text-white min-h-[480px] flex items-center">
        {property?.logoUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image src={property.logoUrl} alt={property?.name ?? ""} fill className="object-cover" priority />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {property?.name ?? "Hotel"}
          </h1>
          {property?.tagline && (
            <p className="text-xl text-blue-200 mb-8 max-w-2xl">{property.tagline}</p>
          )}
          <Link
            href={`/${locale}/rooms`}
            className="inline-block rounded-xl bg-white text-blue-700 font-semibold px-6 py-3 hover:bg-blue-50 transition-colors"
          >
            {t("home.hero.cta")}
          </Link>
        </div>
      </section>

      {/* Search widget */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("home.search.title")}</h2>
          <SearchWidget locale={locale} />
        </div>
      </section>

      {/* Featured rooms */}
      {featuredRooms.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t("home.featured.title")}</h2>
            <Link href={`/${locale}/rooms`} className="text-sm font-medium text-blue-700 hover:text-blue-800">
              {t("home.featured.view_all")} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <Link
                key={room.id}
                href={`/${locale}/rooms/${room.slug}`}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 hover:ring-blue-400 hover:shadow-md transition-all"
              >
                {/* Photo */}
                <div className="relative h-48 bg-gray-100">
                  {room.photoUrls[0] ? (
                    <Image
                      src={room.photoUrls[0]}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{room.name}</h3>
                  {room.areaM2 && (
                    <p className="text-xs text-gray-500 mb-3">{room.areaM2} {t("rooms.area")} · {room.maxAdults} người</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">{t("common.from")}</span>
                      <p className="font-bold text-blue-700 text-lg">
                        {formatPrice(room.basePrice, property?.currency)}
                      </p>
                      <span className="text-xs text-gray-500">{t("common.per_night")}</span>
                    </div>
                    <span className="text-xs font-medium text-blue-700 group-hover:underline">
                      {t("common.view_details")} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
