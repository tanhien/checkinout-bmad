import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("about.title") }
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let property = null
  try {
    const caller = await getPortalCaller()
    property = await caller.portal.getProperty()
  } catch { /* fallback */ }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("about.title")}</h1>
      {property ? (
        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed">
            {property.description ?? property.name}
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Check-in</h3>
              <p className="text-gray-600">{String(property.checkInHour).padStart(2, "0")}:00</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Check-out</h3>
              <p className="text-gray-600">{String(property.checkOutHour).padStart(2, "0")}:00</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Thông tin đang được cập nhật.</p>
      )}
    </div>
  )
}
