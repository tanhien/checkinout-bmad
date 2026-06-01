import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { SearchWidget } from "./_components/SearchWidget"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata(_props: Props): Promise<Metadata> {
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

const FLASH_DEALS = [
  {
    code: "HOIAN30",
    discount: "30%",
    desc_vi: "Giảm 30% cho đặt phòng trước 7 ngày",
    desc_en: "30% off when booking 7+ days ahead",
    valid_vi: "Hết hạn 31/12/2026",
    valid_en: "Valid until Dec 31, 2026",
    color: "from-amber-500 to-orange-500",
  },
  {
    code: "SUMMER20",
    discount: "20%",
    desc_vi: "Ưu đãi hè — Giảm 20% kỳ nghỉ hè",
    desc_en: "Summer deal — 20% off your summer stay",
    valid_vi: "01/05 – 31/08/2026",
    valid_en: "May 1 – Aug 31, 2026",
    color: "from-emerald-500 to-teal-500",
  },
  {
    code: "SUITE500K",
    discount: "500K",
    desc_vi: "Giảm 500.000đ khi đặt Suite Hồ Bơi",
    desc_en: "Save ₫500,000 on Pool Suite bookings",
    valid_vi: "Hết hạn 31/12/2026",
    valid_en: "Valid until Dec 31, 2026",
    color: "from-violet-500 to-purple-600",
  },
]

const WHY_ICONS = ["🚫💳", "🏷️", "🏛️", "💆"]

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

  // Schema.org Hotel markup
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

  const isVi = locale === "vi"

  const WHY_ITEMS = [
    { icon: "🚫", key: "free_cancel" },
    { icon: "🏷️", key: "best_price" },
    { icon: "🏛️", key: "heritage" },
    { icon: "💆", key: "spa" },
  ] as const

  return (
    <>
      {schemaOrg && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
        />
      )}

      {/* Hero */}
      <section className="relative bg-amber-900 text-white min-h-[520px] flex items-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=80"
          alt={property?.name ?? "Hotel"}
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            <p className="text-amber-200 text-sm font-semibold uppercase tracking-widest mb-3">
              {isVi ? "Di sản UNESCO • Hội An, Việt Nam" : "UNESCO Heritage • Hoi An, Vietnam"}
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {property?.name ?? "Lạc Hồng Hotel"}
            </h1>
            {property?.tagline && (
              <p className="text-xl text-amber-100 mb-8 max-w-xl">{property.tagline}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/${locale}/rooms`}
                className="inline-block rounded-xl bg-amber-500 text-white font-semibold px-6 py-3 hover:bg-amber-400 transition-colors shadow-lg"
              >
                {t("home.hero.cta")}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-block rounded-xl bg-white/20 backdrop-blur-sm text-white font-medium px-6 py-3 hover:bg-white/30 transition-colors border border-white/30"
              >
                {isVi ? "Tìm hiểu thêm" : "Learn More"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search widget */}
      <section className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t("home.search.title")}</h2>
          <SearchWidget locale={locale} />
        </div>
      </section>

      {/* Flash Deals */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 mb-4">
              ⚡ {isVi ? "Ưu đãi có giới hạn" : "Limited Time Offers"}
            </div>
            <h2 className="text-3xl font-bold text-white">{t("home.flash.title")}</h2>
            <p className="text-gray-400 mt-2">{t("home.flash.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FLASH_DEALS.map((deal) => (
              <div
                key={deal.code}
                className="relative rounded-2xl overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${deal.color} opacity-90`} />
                <div className="relative p-6 flex flex-col h-full">
                  <div className="text-5xl font-black text-white/90 mb-2">−{deal.discount}</div>
                  <p className="text-white font-medium mb-1">
                    {isVi ? deal.desc_vi : deal.desc_en}
                  </p>
                  <p className="text-white/70 text-xs mb-4">
                    {isVi ? deal.valid_vi : deal.valid_en}
                  </p>
                  <div className="mt-auto">
                    <p className="text-white/70 text-xs mb-1">{t("home.flash.code_label")}</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg bg-white/20 text-white font-mono font-bold text-sm px-3 py-2 tracking-widest">
                        {deal.code}
                      </code>
                      <Link
                        href={`/${locale}/rooms`}
                        className="shrink-0 rounded-lg bg-white text-gray-900 font-semibold text-sm px-4 py-2 hover:bg-gray-100 transition-colors"
                      >
                        {t("home.flash.book_btn")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rooms */}
      {featuredRooms.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t("home.featured.title")}</h2>
            <Link href={`/${locale}/rooms`} className="text-sm font-medium text-amber-700 hover:text-amber-800">
              {t("home.featured.view_all")} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRooms.map((room) => (
              <Link
                key={room.id}
                href={`/${locale}/rooms/${room.slug}`}
                className="group rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 hover:ring-amber-400 hover:shadow-md transition-all"
              >
                {/* Photo */}
                <div className="relative h-52 bg-gray-100">
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
                  {room.photoUrls.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/50 text-white text-xs px-2 py-0.5">
                      +{room.photoUrls.length - 1}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 text-base mb-1">{room.name}</h3>
                  {room.areaM2 && (
                    <p className="text-xs text-gray-500 mb-3">
                      {room.areaM2} {t("rooms.area")} · {room.maxAdults} {isVi ? "người lớn" : "adults"}
                      {room.maxChildren > 0 ? ` · ${room.maxChildren} ${isVi ? "trẻ em" : "children"}` : ""}
                    </p>
                  )}
                  {room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.amenities.slice(0, 4).map((a) => (
                        <span key={a.id} className="text-sm" title={a.name}>{a.icon ?? "✓"}</span>
                      ))}
                      {room.amenities.length > 4 && (
                        <span className="text-xs text-gray-400">+{room.amenities.length - 4}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500">{t("common.from")}</span>
                      <p className="font-bold text-amber-700 text-lg">
                        {formatPrice(room.basePrice, property?.currency)}
                      </p>
                      <span className="text-xs text-gray-500">{t("common.per_night")}</span>
                    </div>
                    <span className="text-xs font-medium text-amber-700 group-hover:underline">
                      {t("common.view_details")} →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="bg-amber-50 border-y border-amber-100 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            {t("home.why.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_ITEMS.map(({ icon, key }) => (
              <div key={key} className="text-center p-6 rounded-2xl bg-white shadow-sm">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{t(`home.why.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`home.why.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery strip */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {isVi ? "Khám phá Lạc Hồng" : "Explore Lac Hong"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
            "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
            "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
          ].map((src, i) => (
            <div key={i} className="relative h-44 md:h-56 rounded-xl overflow-hidden">
              <Image
                src={src}
                alt="Hotel gallery"
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
