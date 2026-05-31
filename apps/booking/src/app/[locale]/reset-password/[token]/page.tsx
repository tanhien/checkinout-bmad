import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ResetPasswordForm } from "./_ResetPasswordForm"

type Props = { params: Promise<{ locale: string; token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })
  return { title: t("auth.reset.title"), robots: "noindex" }
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale, token } = await params
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <ResetPasswordForm locale={locale} token={token} />
      </div>
    </div>
  )
}
