import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"

export function IdleOverlay({ onResume }: { onResume: () => void }) {
  const { lang, property } = useApp()
  const t = useT(lang)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 50%, #0f172a 100%)" }}
      onClick={onResume}
      onTouchStart={onResume}
    >
      {/* Pulsing circle */}
      <div className="relative mb-12">
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping" style={{ width: 160, height: 160 }} />
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <span className="text-7xl">🏨</span>
        </div>
      </div>

      {property && (
        <p className="mb-4 text-2xl font-semibold text-blue-100">{property.name}</p>
      )}
      <p className="text-4xl font-bold text-white">{t("home.idle.message")}</p>
    </div>
  )
}
