import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { BookingLookup } from "./_BookingLookup"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("bookings.lookup.title"), robots: "noindex" }
}

export default async function LookupPage({ params }: Props) {
  const { locale } = await params
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <BookingLookup locale={locale} />
    </div>
  )
}
