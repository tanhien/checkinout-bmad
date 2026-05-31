import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("amenities.title") }
}

export default async function AmenitiesPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let amenities: Array<{ id: string; name: string; icon?: string | null }> = []
  try {
    const caller = await getPortalCaller()
    const property = await caller.portal.getProperty()
    amenities = property.amenities
  } catch { /* fallback */ }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("amenities.title")}</h1>
      {amenities.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {amenities.map((amenity) => (
            <div
              key={amenity.id}
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
              {amenity.icon && <span className="text-2xl">{amenity.icon}</span>}
              <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">Thông tin đang được cập nhật.</p>
      )}
    </div>
  )
}
