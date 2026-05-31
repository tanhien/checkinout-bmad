import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { getPortalCaller } from "@/lib/portal-caller"
import { RoomDetailClient } from "./_RoomDetailClient"

type Props = {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ checkin?: string; checkout?: string; adults?: string; children?: string }>
}

// ISR: revalidate every 1 hour
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  try {
    const caller = await getPortalCaller()
    const rt = await caller.portal.getRoomType({ slug })
    return {
      title: rt.name,
      description: rt.description ?? undefined,
      openGraph: {
        title: rt.name,
        description: rt.description ?? undefined,
        images: rt.photoUrls[0] ? [{ url: rt.photoUrls[0] }] : [],
        type: "website",
      },
    }
  } catch {
    return {}
  }
}

const BED_LABELS: Record<string, string> = {
  SINGLE: "1 giường đơn",
  DOUBLE: "1 giường đôi",
  TWIN: "2 giường đơn",
  KING: "1 giường King",
  QUEEN: "1 giường Queen",
  BUNK: "Giường tầng",
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " VNĐ"
}

export default async function RoomDetailPage({ params, searchParams }: Props) {
  const { locale, slug } = await params
  const sp = await searchParams
  const t = await getTranslations({ locale })

  let room = null
  try {
    const caller = await getPortalCaller()
    room = await caller.portal.getRoomType({ slug })
  } catch {
    notFound()
  }
  if (!room) notFound()

  const checkin = sp.checkin
  const checkout = sp.checkout
  const adults = Number(sp.adults ?? 2)
  const children = Number(sp.children ?? 0)

  const bookParams = new URLSearchParams({ roomTypeId: room.id })
  if (checkin) bookParams.set("checkin", checkin)
  if (checkout) bookParams.set("checkout", checkout)
  bookParams.set("adults", String(adults))
  bookParams.set("children", String(children))

  // Schema.org HotelRoom markup (E5-S1 AC 7)
  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.name,
    description: room.description,
    occupancy: { "@type": "QuantitativeValue", minValue: 1, maxValue: room.maxAdults },
    bed: { "@type": "BedDetails", typeOfBed: room.bedType },
    image: room.photoUrls,
    offers: { "@type": "Offer", price: room.basePrice, priceCurrency: "VND" },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* Back link */}
      <a href={`/${locale}/rooms${checkin ? `?checkin=${checkin}&checkout=${checkout}&adults=${adults}&children=${children}` : ""}`}
        className="text-sm text-blue-700 hover:underline mb-6 inline-block">
        ← {t("rooms.back_to_list")}
      </a>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: photos + details */}
        <div className="lg:col-span-2">
          {/* Photo gallery */}
          <RoomDetailClient photoUrls={room.photoUrls} roomName={room.name} />

          {/* Info */}
          <div className="mt-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{room.name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mb-4">
              {room.areaM2 && <span>{room.areaM2} {t("rooms.area")}</span>}
              <span>{BED_LABELS[room.bedType] ?? room.bedType}</span>
              <span>Tối đa {room.maxAdults} người lớn</span>
            </div>
            {room.description && (
              <p className="text-gray-700 leading-relaxed mb-6">{room.description}</p>
            )}

            {/* Amenities */}
            <h2 className="text-base font-semibold text-gray-900 mb-3">{t("rooms.amenities")}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
              {room.amenities.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm text-gray-700">
                  {a.icon && <span>{a.icon}</span>}
                  {a.name}
                </div>
              ))}
            </div>

            {/* Rate plans */}
            {room.ratePlans.length > 0 && (
              <>
                <h2 className="text-base font-semibold text-gray-900 mb-3">{t("rooms.policies")}</h2>
                <div className="space-y-2">
                  {room.ratePlans.map((rp) => (
                    <div key={rp.id} className="rounded-xl bg-white p-4 ring-1 ring-gray-200 text-sm">
                      <p className="font-medium text-gray-900">{rp.name}</p>
                      {rp.isNonRefundable && (
                        <p className="text-orange-600 mt-1">Không hoàn tiền</p>
                      )}
                      {rp.discountPercent && (
                        <p className="text-green-700 mt-1">Giảm {rp.discountPercent}%</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: sticky booking widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <p className="text-xs text-gray-500 mb-1">Từ</p>
            <p className="text-2xl font-bold text-blue-700 mb-1">{formatVND(room.basePrice)}</p>
            <p className="text-xs text-gray-500 mb-4">{t("common.per_night")}</p>
            <a
              href={`/${locale}/book?${bookParams}`}
              className="block w-full rounded-xl bg-blue-700 text-center text-sm font-semibold text-white py-3 hover:bg-blue-800 transition-colors"
            >
              {t("rooms.book_this")}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
