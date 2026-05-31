import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"

interface ScreenHeaderProps {
  titleKey: Parameters<ReturnType<typeof useT>>[0]
  onBack?: () => void
  step?: number
  totalSteps?: number
}

export function ScreenHeader({ titleKey, onBack, step, totalSteps }: ScreenHeaderProps) {
  const { lang } = useApp()
  const t = useT(lang)

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="w-28">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-medium text-blue-100 hover:bg-white/10 active:bg-white/20 transition-colors"
          >
            ← {t("btn.back")}
          </button>
        )}
      </div>

      <h1 className="text-2xl font-bold text-white text-center">{t(titleKey)}</h1>

      <div className="w-28 text-right">
        {step && totalSteps && (
          <span className="text-sm font-medium text-blue-200">
            {step}/{totalSteps}
          </span>
        )}
      </div>
    </div>
  )
}
