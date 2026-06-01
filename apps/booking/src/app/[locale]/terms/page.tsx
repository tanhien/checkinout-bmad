import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("terms.title") }
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale })

  const sections = t.raw("terms.sections") as Array<{ title: string; content: string }>

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t("terms.title")}</h1>
        <p className="text-sm text-gray-500">{t("terms.updated")}</p>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 leading-relaxed mb-8 text-base">{t("terms.intro")}</p>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl bg-amber-50 border border-amber-100 p-6 text-sm text-gray-600">
        <p className="font-semibold text-gray-800 mb-2">
          {locale === "vi" ? "Cần hỗ trợ?" : "Need assistance?"}
        </p>
        <p>
          {locale === "vi"
            ? "Đội ngũ lễ tân của chúng tôi sẵn sàng hỗ trợ 24/7 qua "
            : "Our reception team is available 24/7 at "}
          <a href="tel:+842353918888" className="text-amber-700 hover:underline font-medium">
            +84 235 391 8888
          </a>
          {locale === "vi" ? " hoặc " : " or "}
          <a href="mailto:info@lachonghotel.vn" className="text-amber-700 hover:underline font-medium">
            info@lachonghotel.vn
          </a>
        </p>
      </div>
    </div>
  )
}
