"use client"

import { useEffect, useRef, useState } from "react"
import { createStaffSocket } from "@/lib/socket"

type CallForHelpEvent = {
  alertId: string
  kioskId: string
  propertyId: string
  timestamp: number
}

type Alert = CallForHelpEvent & { receivedAt: Date }

function playAlertSound() {
  try {
    const ctx = new AudioContext()
    function beep() {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.value = 0.3
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }
    // 3 beeps with 1s interval
    beep()
    setTimeout(beep, 1000)
    setTimeout(beep, 2000)
    setTimeout(() => ctx.close(), 3500)
  } catch {
    // AudioContext may be blocked until user interaction — silent fail is acceptable
  }
}

export function CallForHelpAlert({ propertyId }: { propertyId: string }) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const socketRef = useRef<ReturnType<typeof createStaffSocket> | null>(null)
  const audioEnabledRef = useRef(audioEnabled)
  audioEnabledRef.current = audioEnabled

  useEffect(() => {
    const socket = createStaffSocket()
    socketRef.current = socket

    socket.on("alert:callForHelp", (evt: CallForHelpEvent) => {
      if (evt.propertyId !== propertyId) return
      setAlerts((prev) => [...prev, { ...evt, receivedAt: new Date() }])
      if (audioEnabledRef.current) playAlertSound()
    })

    // E6-S3: Listen for dismiss broadcast from any staff screen
    socket.on("alert:dismissed", ({ alertId }: { alertId: string }) => {
      setAlerts((prev) => prev.filter((a) => a.alertId !== alertId))
    })

    return () => { socket.disconnect() }
  }, [propertyId])

  function dismiss(alertId: string) {
    // Emit to server which broadcasts to all staff in the property room
    socketRef.current?.emit("alert:dismiss", { alertId })
  }

  function enableAudio() {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0
      osc.start()
      osc.stop(ctx.currentTime + 0.01)
      setTimeout(() => ctx.close(), 200)
    } catch { /* ignore */ }
    setAudioEnabled(true)
  }

  return (
    <>
      {/* Audio enable prompt — browser autoplay policy requires user interaction */}
      {!audioEnabled && (
        <button
          onClick={enableAudio}
          className="mb-4 flex w-full items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 transition-colors"
        >
          <span className="text-lg">🔔</span>
          Click để bật thông báo âm thanh khi khách kiosk gọi nhân viên
        </button>
      )}

      {/* Active call-for-help alerts */}
      {alerts.map((alert) => (
        <div
          key={alert.alertId}
          className="mb-4 flex items-start justify-between gap-4 rounded-xl bg-orange-50 px-5 py-4 ring-2 ring-orange-400 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">🚨</span>
            <div>
              <p className="text-sm font-bold text-orange-900">
                Khách cần hỗ trợ tại Kiosk {alert.kioskId}
              </p>
              <p className="text-xs text-orange-700 mt-0.5">
                {alert.receivedAt.toLocaleTimeString("vi-VN")}
              </p>
            </div>
          </div>
          <button
            onClick={() => dismiss(alert.alertId)}
            className="shrink-0 rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-700 active:bg-orange-800 transition-colors"
          >
            Đã xử lý
          </button>
        </div>
      ))}
    </>
  )
}
