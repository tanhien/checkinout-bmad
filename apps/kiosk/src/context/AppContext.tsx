import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Lang } from "@/lib/i18n"
import { trpc } from "@/lib/trpc"

export type AppScreen = "home" | "check-in" | "walk-in" | "check-out"

type PropertyInfo = {
  name: string
  address: string
  phone: string
  logoUrl: string | null
  checkInHour: number
  checkOutHour: number
  wifiPassword: string | null
  currency: string
}

type AppContextValue = {
  lang: Lang
  setLang: (l: Lang) => void
  screen: AppScreen
  goTo: (s: AppScreen) => void
  resetToHome: () => void
  property: PropertyInfo | null
  // Global idle management
  resetIdleTimer: () => void
  kioskId: string
}

const AppContext = createContext<AppContextValue | null>(null)

const IDLE_MS = 5 * 60 * 1000     // 5 min → show idle overlay (handled in App.tsx)
const KIOSK_ID = import.meta.env.VITE_KIOSK_ID ?? "kiosk-1"

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("vi")
  const [screen, setScreen] = useState<AppScreen>("home")
  const [property, setProperty] = useState<PropertyInfo | null>(null)

  useEffect(() => {
    trpc.kiosk.getPropertyInfo.query().then((p) => {
      setProperty({
        name: p.name,
        address: p.address,
        phone: p.phone,
        logoUrl: p.logoUrl ?? null,
        checkInHour: p.checkInHour,
        checkOutHour: p.checkOutHour,
        wifiPassword: p.wifiPassword ?? null,
        currency: p.currency,
      })
    }).catch(() => {/* silently ignore — dev mode without backend */})
  }, [])

  const [idleTimerKey, setIdleTimerKey] = useState(0)

  const resetIdleTimer = useCallback(() => {
    setIdleTimerKey((k) => k + 1)
  }, [])

  const goTo = useCallback((s: AppScreen) => {
    setScreen(s)
    resetIdleTimer()
  }, [resetIdleTimer])

  const resetToHome = useCallback(() => {
    setScreen("home")
    resetIdleTimer()
  }, [resetIdleTimer])

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        screen,
        goTo,
        resetToHome,
        property,
        resetIdleTimer,
        kioskId: KIOSK_ID,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}
