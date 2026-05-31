import { useT } from "@/lib/i18n"
import { useApp } from "@/context/AppContext"

interface CountdownBannerProps {
  remaining: number // seconds
  onContinue: () => void
}

export function CountdownBanner({ remaining, onContinue }: CountdownBannerProps) {
  const { lang } = useApp()
  const t = useT(lang)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 bg-amber-500 px-8 py-4 shadow-xl"
      onClick={onContinue}
    >
      <p className="text-lg font-semibold text-white">
        {t("idle.countdown")} <span className="text-3xl font-bold">{remaining}</span> {t("idle.seconds")}
      </p>
      <button
        onClick={(e) => { e.stopPropagation(); onContinue() }}
        className="rounded-xl bg-white px-6 py-2.5 text-base font-bold text-amber-700 shadow hover:bg-amber-50 active:bg-amber-100"
      >
        {t("idle.continue")}
      </button>
    </div>
  )
}
