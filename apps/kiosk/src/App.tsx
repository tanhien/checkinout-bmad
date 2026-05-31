import { useState, useEffect, useCallback, useRef } from "react"
import { AppProvider, useApp } from "@/context/AppContext"
import { IdleOverlay } from "@/components/IdleOverlay"
import { CountdownBanner } from "@/components/CountdownBanner"
import { StaffCallButton } from "@/components/StaffCallButton"
import { LanguageToggle } from "@/components/LanguageToggle"
import { HomeScreen } from "@/screens/HomeScreen"
import { CheckInFlow } from "@/screens/CheckInFlow"
import { WalkInFlow } from "@/screens/WalkInFlow"
import { CheckOutFlow } from "@/screens/CheckOutFlow"

const IDLE_OVERLAY_MS = 5 * 60 * 1000   // 5 min → show IdleOverlay
const FLOW_TIMEOUT_MS = 3 * 60 * 1000   // 3 min in-flow inactivity → start countdown
const COUNTDOWN_SECS = 30               // 30s countdown before auto-reset

function KioskApp() {
  const { screen, resetToHome, resetIdleTimer } = useApp()
  const [showIdle, setShowIdle] = useState(false)
  const [countdownSecs, setCountdownSecs] = useState<number | null>(null)

  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flowRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearCountdown = useCallback(() => {
    if (countRef.current) { clearInterval(countRef.current); countRef.current = null }
    setCountdownSecs(null)
  }, [])

  const startCountdown = useCallback(() => {
    clearCountdown()
    setCountdownSecs(COUNTDOWN_SECS)
    let remaining = COUNTDOWN_SECS
    countRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearCountdown()
        resetToHome()
      } else {
        setCountdownSecs(remaining)
      }
    }, 1000)
  }, [clearCountdown, resetToHome])

  const resetTimers = useCallback(() => {
    // Clear idle overlay
    if (idleRef.current) clearTimeout(idleRef.current)
    setShowIdle(false)

    // Clear flow timeout + countdown
    if (flowRef.current) clearTimeout(flowRef.current)
    clearCountdown()

    // Restart idle overlay timer
    idleRef.current = setTimeout(() => setShowIdle(true), IDLE_OVERLAY_MS)

    // Restart flow timeout only when in a flow (not home)
    if (screen !== "home") {
      flowRef.current = setTimeout(startCountdown, FLOW_TIMEOUT_MS)
    }

    resetIdleTimer()
  }, [screen, clearCountdown, startCountdown, resetIdleTimer])

  // Reset timers when screen changes or on any user activity
  useEffect(() => {
    resetTimers()
    return () => {
      if (idleRef.current) clearTimeout(idleRef.current)
      if (flowRef.current) clearTimeout(flowRef.current)
      clearCountdown()
    }
  }, [screen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to global interaction events
  useEffect(() => {
    const handler = () => resetTimers()
    window.addEventListener("touchstart", handler, { passive: true })
    window.addEventListener("click", handler, { passive: true })
    window.addEventListener("keydown", handler, { passive: true })
    return () => {
      window.removeEventListener("touchstart", handler)
      window.removeEventListener("click", handler)
      window.removeEventListener("keydown", handler)
    }
  }, [resetTimers])

  function handleResume() {
    setShowIdle(false)
    resetTimers()
  }

  function handleContinue() {
    clearCountdown()
    if (flowRef.current) clearTimeout(flowRef.current)
    flowRef.current = setTimeout(startCountdown, FLOW_TIMEOUT_MS)
    resetIdleTimer()
  }

  const isInFlow = screen !== "home"

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ background: "linear-gradient(150deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 100%)" }}
    >
      {/* Top bar: language toggle (always visible in flows) */}
      {isInFlow && (
        <div className="fixed top-4 right-20 z-30">
          <LanguageToggle />
        </div>
      )}

      {/* Active screen */}
      {screen === "home" && <HomeScreen />}
      {screen === "check-in" && <CheckInFlow />}
      {screen === "walk-in" && <WalkInFlow />}
      {screen === "check-out" && <CheckOutFlow />}

      {/* Idle overlay */}
      {showIdle && <IdleOverlay onResume={handleResume} />}

      {/* In-flow countdown banner */}
      {countdownSecs !== null && (
        <CountdownBanner remaining={countdownSecs} onContinue={handleContinue} />
      )}

      {/* Call for help — always visible */}
      <StaffCallButton />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <KioskApp />
    </AppProvider>
  )
}
