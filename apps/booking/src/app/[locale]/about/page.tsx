import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { getPortalCaller } from "@/lib/portal-caller"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("about.title") }
}

const POLICY_ICONS: Record<string, string> = {
  checkin: "🕑",
  checkout: "🕛",
  cancel: "📋",
  children: "👶",
  pets: "🐾",
  smoking: "🚭",
  payment: "💳",
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  let property: {
    name: string
    description?: string | null
    tagline?: string | null
    checkInHour: number
    checkOutHour: number
    address: string
    phone: string
    email: string
    logoUrl?: string | null
  } | null = null

  try {
    const caller = await getPortalCaller()
    property = await caller.portal.getProperty()
  } catch { /* fallback */ }

  const policyKeys = ["checkin", "checkout", "cancel", "children", "pets", "smoking", "payment"] as const
  const awards = t.raw("about.awards") as string[]

  return (
    <div className="bg-white">
      {/* Hero banner */}
      <div className="relative h-72 md:h-96 bg-amber-900 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=80"
          alt={property?.name ?? "Hotel"}
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
            {property?.name ?? t("about.title")}
          </h1>
          {property?.tagline && (
            <p className="text-lg text-amber-100 max-w-xl drop-shadow">{property.tagline}</p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Our Story */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
            {t("about.story_title")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="prose prose-gray max-w-none">
              {t("about.story").split("\n\n").map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-4">{para}</p>
              ))}
            </div>
            <div className="relative h-64 lg:h-80 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80"
                alt="Hotel lobby"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Awards */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
            {t("about.awards_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {awards.map((award, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-4">
                <span className="text-2xl mt-0.5">🏆</span>
                <p className="text-sm text-gray-700 font-medium leading-snug">{award}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hotel Policies */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
            {t("about.policies_title")}
          </h2>
          <div className="divide-y divide-gray-100 rounded-2xl ring-1 ring-gray-200 overflow-hidden bg-white shadow-sm">
            {policyKeys.map((key) => (
              <div key={key} className="flex gap-4 px-6 py-5">
                <span className="text-2xl mt-0.5 shrink-0">{POLICY_ICONS[key]}</span>
                <div>
                  <p className="font-semibold text-gray-900 mb-0.5">
                    {t(`about.policies.${key}.label`)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t(`about.policies.${key}.value`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
            {t("about.location_title")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-gray-700 leading-relaxed mb-6">{t("about.location_desc")}</p>
              {property && (
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <span>📍</span>
                    <span>{property.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <a href={`tel:${property.phone}`} className="hover:text-amber-700">{property.phone}</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${property.email}`} className="hover:text-amber-700">{property.email}</a>
                  </div>
                </div>
              )}
            </div>
            {/* Embedded map placeholder */}
            <div className="relative h-56 lg:h-72 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1524813686514-a57563d77965?w=800&q=80"
                alt="Hoi An Ancient Town"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-amber-900/20 flex items-end p-4">
                <span className="text-white text-sm font-medium bg-amber-700/80 rounded-lg px-3 py-1">
                  Phố cổ Hội An
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-l-4 border-amber-500 pl-4">
            {t("about.team_title")}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <p className="text-gray-700 leading-relaxed">{t("about.team_desc")}</p>
            </div>
            <div className="lg:col-span-2 relative h-52 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"
                alt="Hotel staff"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
