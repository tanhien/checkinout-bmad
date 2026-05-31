import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { LoginForm } from "./_LoginForm"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("auth.login.title"), robots: "noindex" }
}

export default async function LoginPage({ params }: Props) {
  const { locale } = await params
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <LoginForm locale={locale} />
      </div>
    </div>
  )
}
