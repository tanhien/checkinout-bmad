import { useState, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"
import { trpc } from "@/lib/trpc"

export function StaffCallButton() {
  const { lang, kioskId, resetIdleTimer } = useApp()
  const t = useT(lang)
  const [showDialog, setShowDialog] = useState(false)
  const [sent, setSent] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [calling, setCalling] = useState(false)

  // Auto-confirm countdown after dialog opens
  useEffect(() => {
    if (!showDialog || sent) return
    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          void confirmCall()
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showDialog]) // eslint-disable-line react-hooks/exhaustive-deps

  async function confirmCall() {
    if (calling) return
    setCalling(true)
    try {
      await trpc.kiosk.callForHelp.mutate({ kioskId })
      setSent(true)
      resetIdleTimer()
      // Auto-close after 5s
      setTimeout(() => {
        setShowDialog(false)
        setSent(false)
        setCalling(false)
      }, 5000)
    } catch {
      setCalling(false)
    }
  }

  function openDialog() {
    setShowDialog(true)
    setSent(false)
    resetIdleTimer()
  }

  return (
    <>
      {/* Fixed button — always visible */}
      <button
        onClick={openDialog}
        className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3.5 text-base font-bold text-white shadow-lg hover:bg-orange-600 active:bg-orange-700 transition-colors"
      >
        <span className="text-xl">🔔</span>
        <span>{t("home.call")}</span>
      </button>

      {/* Dialog overlay */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
            {sent ? (
              <>
                <div className="mb-4 text-6xl">✅</div>
                <p className="text-2xl font-bold text-gray-900">{t("call.sent")}</p>
              </>
            ) : (
              <>
                <div className="mb-4 text-6xl">🔔</div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{t("call.title")}</h2>
                <p className="mb-6 text-lg text-gray-600">{t("call.message")}</p>
                <p className="mb-6 text-sm text-amber-600 font-medium">
                  {t("call.countdown")} <span className="font-bold text-lg">{countdown}</span>s
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowDialog(false); resetIdleTimer() }}
                    className="flex-1 rounded-2xl border-2 border-gray-300 py-4 text-lg font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                  >
                    {t("call.cancel")}
                  </button>
                  <button
                    onClick={() => void confirmCall()}
                    disabled={calling}
                    className="flex-1 rounded-2xl bg-orange-500 py-4 text-lg font-bold text-white hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50"
                  >
                    {calling ? "..." : t("call.confirm")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
