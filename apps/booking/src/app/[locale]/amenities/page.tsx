import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("amenities.title") }
}

// Property-level amenities with photos
const PROPERTY_AMENITIES = [
  {
    icon: "🏊",
    name_vi: "Hồ bơi ngoài trời",
    name_en: "Outdoor Swimming Pool",
    desc_vi: "Hồ bơi ngoài trời xanh mát, mở cửa 06:00–22:00",
    desc_en: "Outdoor pool open daily 06:00–22:00",
    photo: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80",
  },
  {
    icon: "💆",
    name_vi: "Spa & Massage",
    name_en: "Spa & Massage",
    desc_vi: "Dịch vụ spa với liệu pháp massage truyền thống Việt Nam, 09:00–21:00",
    desc_en: "Spa with traditional Vietnamese massage therapy, 09:00–21:00",
    photo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80",
  },
  {
    icon: "🍽️",
    name_vi: "Nhà hàng & Bar",
    name_en: "Restaurant & Bar",
    desc_vi: "Buffet sáng 06:30–10:00. Nhà hàng phục vụ cả ngày với thực đơn Việt – Âu",
    desc_en: "Breakfast buffet 06:30–10:00. All-day dining with Vietnamese & Western menu",
    photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80",
  },
  {
    icon: "💪",
    name_vi: "Phòng gym",
    name_en: "Fitness Center",
    desc_vi: "Trang thiết bị hiện đại, mở cửa 06:00–22:00",
    desc_en: "Modern equipment, open 06:00–22:00",
    photo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  },
  {
    icon: "✈️",
    name_vi: "Đưa đón sân bay",
    name_en: "Airport Transfer",
    desc_vi: "Xe riêng đưa đón Sân bay Đà Nẵng, đặt trước 24h",
    desc_en: "Private transfer to Da Nang Airport, book 24h in advance",
    photo: "https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?w=600&q=80",
  },
  {
    icon: "🚲",
    name_vi: "Thuê xe đạp",
    name_en: "Bicycle Rental",
    desc_vi: "Xe đạp miễn phí để khám phá phố cổ Hội An",
    desc_en: "Free bicycles to explore Hoi An Ancient Town",
    photo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  },
]

export default async function AmenitiesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let amenities: Array<{ id: string; name: string; icon?: string | null; category?: string | null }> = []
  try {
    const caller = await getPortalCaller()
    const property = await caller.portal.getProperty()
    amenities = property.amenities
  } catch { /* fallback */ }

  // Group room amenities by category
  const grouped: Record<string, typeof amenities> = {}
  for (const a of amenities) {
    const cat = a.category ?? "Other"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat]!.push(a)
  }

  const isVi = locale === "vi"

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="relative h-52 bg-emerald-900 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1400&q=80"
          alt="Hotel pool"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {t("amenities.title")}
          </h1>
          <p className="text-emerald-100 text-base drop-shadow">{t("amenities.subtitle")}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Property-level amenities with photos */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-emerald-500 pl-4">
            {t("amenities.property_amenities")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROPERTY_AMENITIES.map((item) => (
              <div
                key={item.icon}
                className="rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="relative h-44">
                  <Image
                    src={item.photo}
                    alt={isVi ? item.name_vi : item.name_en}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{item.icon}</span>
                    <h3 className="font-semibold text-gray-900">
                      {isVi ? item.name_vi : item.name_en}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {isVi ? item.desc_vi : item.desc_en}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Room-level amenities grouped by category */}
        {Object.keys(grouped).length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-l-4 border-emerald-500 pl-4">
              {t("amenities.room_amenities")}
            </h2>
            <div className="space-y-8">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-4"
                      >
                        {amenity.icon && (
                          <span className="text-2xl shrink-0">{amenity.icon}</span>
                        )}
                        <span className="text-sm font-medium text-gray-700 leading-tight">
                          {amenity.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Info banner */}
        <section className="rounded-2xl bg-emerald-50 border border-emerald-100 p-8 flex flex-col sm:flex-row items-center gap-6">
          <span className="text-5xl">🏨</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isVi ? "Dịch vụ phòng 24/7" : "24/7 Room Service"}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {isVi
                ? "Tất cả tiện nghi và dịch vụ đều sẵn sàng phục vụ bạn bất kỳ lúc nào. Liên hệ lễ tân qua điện thoại nội bộ hoặc nhắn tin qua WhatsApp số +84 235 391 8888."
                : "All amenities and services are available whenever you need them. Contact reception via in-room phone or WhatsApp at +84 235 391 8888."}
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
