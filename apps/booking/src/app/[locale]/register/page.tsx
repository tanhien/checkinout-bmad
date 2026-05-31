import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { RegisterForm } from "./_RegisterForm"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("auth.register.title"), robots: "noindex" }
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <RegisterForm locale={locale} />
      </div>
    </div>
  )
}
