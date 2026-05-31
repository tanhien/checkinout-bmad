import Link from "next/link"
import { getTranslations, getLocale } from "next-intl/server"

export async function Footer({ propertyName }: { propertyName: string }) {
  const t = await getTranslations()
  const locale = await getLocale()

  return (
    <footer className="bg-gray-900 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <p className="text-white font-semibold text-base mb-2">{propertyName}</p>
            <nav className="flex flex-col gap-1.5">
              <Link href={`/${locale}`} className="hover:text-white transition-colors">{t("nav.home")}</Link>
              <Link href={`/${locale}/rooms`} className="hover:text-white transition-colors">{t("nav.rooms")}</Link>
              <Link href={`/${locale}/about`} className="hover:text-white transition-colors">{t("nav.about")}</Link>
              <Link href={`/${locale}/contact`} className="hover:text-white transition-colors">{t("nav.contact")}</Link>
            </nav>
          </div>
          <div className="flex gap-6 text-xs">
            <Link href="#" className="hover:text-white transition-colors">{t("footer.privacy")}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-gray-600">
          © {new Date().getFullYear()} {propertyName}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  )
}
