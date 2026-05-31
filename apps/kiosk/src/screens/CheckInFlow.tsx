"use client"
import { useState, useRef, useEffect } from "react"
import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"
import { trpc } from "@/lib/trpc"
import { KioskButton } from "@/components/KioskButton"
import { ScreenHeader } from "@/components/ScreenHeader"

type LookupResult = {
  id: string
  confirmationCode: string
  checkInDate: string
  checkOutDate: string
  totalNights: number
  adults: number
  children: number
  guest: { firstName: string; lastName: string }
  roomType: { name: string }
}

type CheckinResult = {
  roomNumber: string
  floor: number
  wifiPassword: string | null
  confirmationCode: string
  guestName: string
  checkInDate: string
  checkOutDate: string
}

type Step = "code-input" | "booking-confirm" | "name-verify" | "success"

// ─── Screen 1: Code input + QR tab ──────────────────────────────────────────

function CodeInputScreen({
  onFound,
  onBack,
}: {
  onFound: (code: string, result: LookupResult) => void
  onBack: () => void
}) {
  const { lang, resetIdleTimer } = useApp()
  const t = useT(lang)
  const [tab, setTab] = useState<"code" | "qr">("code")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<unknown>(null)
  const scanningRef = useRef(false)

  async function handleSearch() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const result = await trpc.kiosk.lookupBooking.query({ confirmationCode: trimmed })
      onFound(trimmed, result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg.includes("NOT_FOUND") ? t("error.call_staff") : t("error.generic"))
    } finally {
      setLoading(false)
    }
  }

  // QR scanner using BarcodeDetector (available on Chrome Android 83+)
  useEffect(() => {
    if (tab !== "qr") {
      stopCamera()
      return
    }
    void startCamera()
    return () => stopCamera()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      // Use BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] })
        scanningRef.current = true
        void scanLoop()
      }
    } catch {
      setTab("code") // Fall back to code entry if camera unavailable
    }
  }

  function stopCamera() {
    scanningRef.current = false
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  async function scanLoop() {
    if (!scanningRef.current || !detectorRef.current || !videoRef.current) return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const barcodes = await (detectorRef.current as any).detect(videoRef.current)
      if (barcodes.length > 0) {
        const rawValue: string = barcodes[0].rawValue ?? ""
        const match = rawValue.match(/HTL-\d{4}-[A-Z0-9]{6}/i)
        if (match) {
          scanningRef.current = false
          stopCamera()
          setTab("code")
          const detectedCode = match[0].toUpperCase()
          setCode(detectedCode)
          setLoading(true)
          try {
            const result = await trpc.kiosk.lookupBooking.query({ confirmationCode: detectedCode })
            onFound(detectedCode, result)
          } catch {
            setError(t("error.call_staff"))
          } finally {
            setLoading(false)
          }
          return
        }
      }
    } catch { /* ignore detection errors */ }
    if (scanningRef.current) {
      requestAnimationFrame(() => void scanLoop())
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkin.title" onBack={onBack} step={1} totalSteps={4} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">{t("checkin.step1.title")}</h2>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-2xl bg-white/10 p-1">
            <button
              onClick={() => { setTab("code"); resetIdleTimer() }}
              className={`flex-1 rounded-xl py-3 text-base font-semibold transition-colors ${tab === "code" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"}`}
            >
              {t("checkin.step1.code.tab")}
            </button>
            <button
              onClick={() => { setTab("qr"); resetIdleTimer() }}
              className={`flex-1 rounded-xl py-3 text-base font-semibold transition-colors ${tab === "qr" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"}`}
            >
              {t("checkin.step1.qr.tab")}
            </button>
          </div>

          {tab === "code" ? (
            <div className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); resetIdleTimer() }}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSearch() }}
                placeholder={t("checkin.step1.placeholder")}
                className="w-full rounded-2xl bg-white px-6 py-5 text-2xl font-mono font-bold text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
                autoFocus
              />
              {error && (
                <div className="rounded-xl bg-red-500/20 px-4 py-3 text-base font-medium text-red-100">
                  {error}
                </div>
              )}
              <KioskButton
                fullWidth
                size="xl"
                disabled={!code.trim() || loading}
                onClick={() => void handleSearch()}
              >
                {loading ? t("loading") : t("checkin.step1.btn")}
              </KioskButton>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full aspect-[4/3] object-cover"
              />
              <p className="py-3 text-center text-sm text-gray-300">{t("checkin.step1.qr.instruction")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: Booking confirm ──────────────────────────────────────────────

function BookingConfirmScreen({
  booking,
  onConfirm,
  onBack,
}: {
  booking: LookupResult
  onConfirm: () => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkin.title" onBack={onBack} step={2} totalSteps={4} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">{t("checkin.step2.title")}</h2>
          <p className="mb-6 text-center text-xl text-blue-200">{t("checkin.step2.question")}</p>

          <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="bg-blue-600 px-6 py-4">
              <p className="text-center text-lg font-bold text-white font-mono tracking-widest">
                {booking.confirmationCode}
              </p>
            </div>
            <div className="divide-y divide-gray-100 px-6">
              <Row label={t("checkin.step2.guest")} value={`${booking.guest.firstName} ${booking.guest.lastName}`} />
              <Row label={t("checkin.step2.room_type")} value={booking.roomType.name} />
              <Row label={t("checkin.step2.checkin")} value={booking.checkInDate} />
              <Row label={t("checkin.step2.checkout")} value={booking.checkOutDate} />
              <Row
                label={t("checkin.step2.nights")}
                value={`${booking.totalNights} • ${booking.adults} ${t("checkin.step2.guests")}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <KioskButton fullWidth size="xl" onClick={onConfirm} icon="✅">
              {t("checkin.step2.yes")}
            </KioskButton>
            <KioskButton fullWidth size="lg" variant="ghost" onClick={onBack} className="text-white border border-white/30">
              {t("checkin.step2.no")}
            </KioskButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-base text-gray-500">{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  )
}

// ─── Screen 3: Name verification ────────────────────────────────────────────

function NameVerifyScreen({
  confirmationCode,
  onSuccess,
  onBack,
}: {
  confirmationCode: string
  onSuccess: (result: CheckinResult) => void
  onBack: () => void
}) {
  const { lang, resetIdleTimer } = useApp()
  const t = useT(lang)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await trpc.kiosk.checkIn.mutate({ confirmationCode, guestName: name.trim() })
      onSuccess(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("NAME_MISMATCH")) {
        setError(t("checkin.step3.mismatch"))
      } else if (msg.includes("TOO_EARLY")) {
        setError(t("checkin.step3.too_early"))
      } else if (msg.includes("NO_CLEAN_ROOM")) {
        setError(t("checkin.step4.no_room"))
      } else {
        setError(t("error.generic"))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkin.title" onBack={onBack} step={3} totalSteps={4} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-center text-3xl font-bold text-white">{t("checkin.step3.title")}</h2>
          <p className="mb-8 text-center text-xl text-blue-200">{t("checkin.step3.instruction")}</p>

          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); resetIdleTimer() }}
            onKeyDown={(e) => { if (e.key === "Enter") void handleConfirm() }}
            placeholder={t("checkin.step3.placeholder")}
            className="mb-4 w-full rounded-2xl bg-white px-6 py-5 text-2xl font-semibold text-gray-900 shadow-lg placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-white/40"
            autoFocus
          />

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/20 px-5 py-4 text-center text-lg font-medium text-red-100">
              {error}
            </div>
          )}

          <KioskButton
            fullWidth
            size="xl"
            disabled={!name.trim() || loading}
            onClick={() => void handleConfirm()}
          >
            {loading ? t("loading") : t("checkin.step3.btn")}
          </KioskButton>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: Success (room info + countdown) ──────────────────────────────

function SuccessScreen({
  result,
  onReset,
}: {
  result: CheckinResult
  onReset: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [remaining, setRemaining] = useState(30)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); onReset(); return 0 }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onReset])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 text-7xl">🎉</div>
        <h2 className="mb-2 text-4xl font-bold text-white">{t("checkin.step4.title")}</h2>
        <p className="mb-8 text-xl text-blue-200">{t("checkin.step4.email_sent")}</p>

        <div className="mb-8 overflow-hidden rounded-3xl bg-white shadow-2xl">
          {/* Room number — hero */}
          <div className="bg-blue-600 py-8 text-center">
            <p className="text-lg font-medium text-blue-200">{t("checkin.step4.room")}</p>
            <p className="text-8xl font-black text-white">{result.roomNumber}</p>
            <p className="text-lg text-blue-200">
              {t("checkin.step4.floor")} {result.floor}
            </p>
          </div>

          <div className="divide-y divide-gray-100 px-6">
            {result.wifiPassword && (
              <InfoRow
                icon="📶"
                label={t("checkin.step4.wifi")}
                value={result.wifiPassword}
                highlight
              />
            )}
            <InfoRow
              icon="🔑"
              label={t("checkin.step4.keycard")}
              value={t("checkin.step4.keycard_detail")}
            />
            <div className="py-4">
              <p className="text-sm text-gray-500">
                {result.checkInDate} → {result.checkOutDate}
              </p>
            </div>
          </div>
        </div>

        <p className="mb-4 text-base text-blue-200">
          {t("checkin.step4.reset")} <span className="font-bold text-white">{remaining}s</span>
        </p>
        <KioskButton variant="ghost" onClick={onReset} className="text-white border border-white/30">
          {t("btn.home")}
        </KioskButton>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-lg font-bold ${highlight ? "text-blue-700 font-mono tracking-wider" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── Main flow ───────────────────────────────────────────────────────────────

export function CheckInFlow() {
  const { resetToHome } = useApp()
  const [step, setStep] = useState<Step>("code-input")
  const [booking, setBooking] = useState<LookupResult | null>(null)
  const [code, setCode] = useState("")
  const [result, setResult] = useState<CheckinResult | null>(null)

  function handleFound(c: string, b: LookupResult) {
    setCode(c)
    setBooking(b)
    setStep("booking-confirm")
  }

  return (
    <>
      {step === "code-input" && (
        <CodeInputScreen onFound={handleFound} onBack={resetToHome} />
      )}
      {step === "booking-confirm" && booking && (
        <BookingConfirmScreen
          booking={booking}
          onConfirm={() => setStep("name-verify")}
          onBack={() => setStep("code-input")}
        />
      )}
      {step === "name-verify" && (
        <NameVerifyScreen
          confirmationCode={code}
          onSuccess={(r) => { setResult(r); setStep("success") }}
          onBack={() => setStep("booking-confirm")}
        />
      )}
      {step === "success" && result && (
        <SuccessScreen result={result} onReset={resetToHome} />
      )}
    </>
  )
}
