import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"
import { ContactForm } from "./_ContactForm"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("contact.title") }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let property = null
  try {
    const caller = await getPortalCaller()
    property = await caller.portal.getProperty()
  } catch { /* fallback */ }

  const mapsUrl = property
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.address)}`
    : null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-10">{t("contact.title")}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div>
          {property && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("contact.address")}</p>
                <p className="text-gray-800">{property.address}</p>
                {mapsUrl && (
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-blue-700 hover:underline mt-1 inline-block">
                    {t("contact.map")} →
                  </a>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("contact.phone")}</p>
                <a href={`tel:${property.phone}`} className="text-gray-800 hover:text-blue-700">{property.phone}</a>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{t("contact.email")}</p>
                <a href={`mailto:${property.email}`} className="text-gray-800 hover:text-blue-700">{property.email}</a>
              </div>
            </div>
          )}
        </div>

        {/* Contact form */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{t("contact.form.title")}</h2>
          <ContactForm propertyEmail={property?.email ?? ""} />
        </div>
      </div>
    </div>
  )
}
