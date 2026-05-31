import { useApp } from "@/context/AppContext"

export function LanguageToggle() {
  const { lang, setLang, resetIdleTimer } = useApp()

  function toggle() {
    setLang(lang === "vi" ? "en" : "vi")
    resetIdleTimer()
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-base font-semibold text-white backdrop-blur hover:bg-white/20 active:bg-white/30 transition-colors"
      aria-label="Switch language"
    >
      <span className="text-lg">{lang === "vi" ? "🇻🇳" : "🇬🇧"}</span>
      <span>{lang === "vi" ? "VI" : "EN"}</span>
    </button>
  )
}
