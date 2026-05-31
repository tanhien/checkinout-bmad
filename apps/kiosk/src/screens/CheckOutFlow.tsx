import { useState } from "react"
import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"
import { trpc } from "@/lib/trpc"
import { KioskButton } from "@/components/KioskButton"
import { ScreenHeader } from "@/components/ScreenHeader"
import { formatCurrency } from "@/lib/normalize"

type FolioItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  type: string
}

type BookingInfo = {
  id: string
  confirmationCode: string
  guestName: string
  guestEmail: string
  roomTypeName: string
  roomNumbers: string[]
  checkInDate: string
  checkOutDate: string
  folioItems: FolioItem[]
  totalCharges: number
  totalPayments: number
  balance: number
  folioStatus: string
}

type CheckoutResult = {
  confirmationCode: string
  guestName: string
  checkOutTime: string
  amountPaid: number
}

type Step = "lookup" | "folio" | "payment" | "processing" | "success"

// ─── Screen 1: Lookup ────────────────────────────────────────────────────────

function LookupScreen({
  onFound,
  onBack,
}: {
  onFound: (info: BookingInfo) => void
  onBack: () => void
}) {
  const { lang, resetIdleTimer } = useApp()
  const t = useT(lang)
  const [tab, setTab] = useState<"room" | "code">("room")
  const [roomNumber, setRoomNumber] = useState("")
  const [guestName, setGuestName] = useState("")
  const [confCode, setConfCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIssueMsg, setShowIssueMsg] = useState(false)

  async function handleSearch() {
    setError(null)
    setLoading(true)
    try {
      const result = tab === "room"
        ? await trpc.kiosk.lookupForCheckout.query({ roomNumber: roomNumber.trim(), guestName: guestName.trim() })
        : await trpc.kiosk.lookupForCheckout.query({ confirmationCode: confCode.trim().toUpperCase() })
      onFound(result)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("NAME_MISMATCH")) {
        setError(t("checkin.step3.mismatch"))
      } else if (msg.includes("NOT_FOUND")) {
        setError(t("error.call_staff"))
      } else {
        setError(t("error.generic"))
      }
    } finally {
      setLoading(false)
    }
  }

  const canSearch = tab === "room"
    ? roomNumber.trim() && guestName.trim()
    : confCode.trim()

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkout.title" onBack={onBack} step={1} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">{t("checkout.step1.title")}</h2>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-2xl bg-white/10 p-1">
            <button
              onClick={() => { setTab("room"); resetIdleTimer() }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${tab === "room" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"}`}
            >
              {t("checkout.step1.tab.room")}
            </button>
            <button
              onClick={() => { setTab("code"); resetIdleTimer() }}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${tab === "code" ? "bg-white text-blue-700 shadow" : "text-white/80 hover:text-white"}`}
            >
              {t("checkout.step1.tab.code")}
            </button>
          </div>

          <div className="space-y-4">
            {tab === "room" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("checkout.step1.room_number")}</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => { setRoomNumber(e.target.value); resetIdleTimer() }}
                    className="w-full rounded-2xl bg-white px-5 py-4 text-xl font-bold text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
                    placeholder="301"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("checkout.step1.guest_name")}</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => { setGuestName(e.target.value); resetIdleTimer() }}
                    className="w-full rounded-2xl bg-white px-5 py-4 text-lg font-medium text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("checkout.step1.conf_code")}</label>
                <input
                  type="text"
                  value={confCode}
                  onChange={(e) => { setConfCode(e.target.value.toUpperCase()); resetIdleTimer() }}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-xl font-mono font-bold text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
                  placeholder="HTL-2025-ABC123"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/20 px-4 py-3 text-base text-red-100">{error}</div>
            )}

            <KioskButton
              fullWidth
              size="xl"
              disabled={!canSearch || loading}
              onClick={() => void handleSearch()}
              icon="🔍"
            >
              {loading ? t("loading") : t("checkout.step1.btn")}
            </KioskButton>
          </div>

          {/* Issue / dispute help */}
          {showIssueMsg && (
            <div className="mt-4 rounded-xl bg-amber-500/20 px-4 py-3 text-sm text-amber-100">
              {t("checkout.step2.issue_msg")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Screen 2: Folio display ─────────────────────────────────────────────────

function FolioScreen({
  booking,
  onPay,
  onBack,
}: {
  booking: BookingInfo
  onPay: () => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [showIssueMsg, setShowIssueMsg] = useState(false)

  const TYPE_ICON: Record<string, string> = {
    ROOM_CHARGE: "🛏",
    SERVICE: "🍽",
    DISCOUNT: "🏷",
    TAX: "📋",
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkout.title" onBack={onBack} step={2} totalSteps={5} />

      <div className="flex flex-1 flex-col px-6">
        <h2 className="mb-2 text-center text-3xl font-bold text-white">{t("checkout.step2.title")}</h2>
        <p className="mb-4 text-center text-base text-blue-200">
          {booking.guestName} · {booking.roomNumbers.join(", ")} · {booking.checkInDate} → {booking.checkOutDate}
        </p>

        {/* Scrollable folio items */}
        <div className="mb-4 flex-1 overflow-y-auto rounded-2xl bg-white shadow-xl">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t("checkout.step2.charges")}</p>
          </div>

          <div className="divide-y divide-gray-100">
            {booking.folioItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                <span className="text-xl mt-0.5">{TYPE_ICON[item.type] ?? "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium text-gray-900 leading-tight">{item.description}</p>
                  {item.quantity !== 1 && (
                    <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  )}
                </div>
                <p className="text-base font-bold text-gray-900 shrink-0">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-200 bg-gray-50 px-5 py-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-700">{t("checkout.step2.total")}</span>
              <span className="text-2xl font-black text-gray-900">{formatCurrency(booking.totalCharges)}</span>
            </div>
            {booking.totalPayments > 0 && (
              <div className="mt-1 flex justify-between items-center text-sm text-green-600">
                <span>Đã thanh toán</span>
                <span>{formatCurrency(booking.totalPayments)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Dispute help */}
        <div className="mb-4">
          <button
            onClick={() => setShowIssueMsg(!showIssueMsg)}
            className="text-sm text-blue-200 underline hover:text-white"
          >
            {t("checkout.step2.issue")}
          </button>
          {showIssueMsg && (
            <p className="mt-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm text-amber-100">
              {t("checkout.step2.issue_msg")}
            </p>
          )}
        </div>

        <KioskButton fullWidth size="xl" onClick={onPay} icon="💳">
          {t("checkout.step2.btn")} — {formatCurrency(booking.balance)}
        </KioskButton>
        <div className="h-4" />
      </div>
    </div>
  )
}

// ─── Screen 3: Payment confirm ───────────────────────────────────────────────

function PaymentConfirmScreen({
  booking,
  onConfirm,
  onBack,
}: {
  booking: BookingInfo
  onConfirm: () => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkout.title" onBack={onBack} step={3} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 text-6xl">💳</div>
          <h2 className="mb-4 text-3xl font-bold text-white">{t("checkout.step3.title")}</h2>
          <p className="mb-2 text-lg text-blue-200">{t("checkout.step3.total")}</p>
          <p className="mb-8 text-6xl font-black text-white">{formatCurrency(booking.balance)}</p>

          <KioskButton fullWidth size="xl" onClick={onConfirm} icon="✔">
            {t("checkout.step3.btn")}
          </KioskButton>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: Demo payment ──────────────────────────────────────────────────

function DemoPaymentScreen({
  booking,
  onSuccess,
}: {
  booking: BookingInfo
  onSuccess: (result: CheckoutResult) => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function confirmPayment() {
    setPhase("processing")
    setError(null)
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const result = await trpc.kiosk.checkOut.mutate({ bookingId: booking.id })
      setPhase("done")
      setTimeout(() => onSuccess(result), 1500)
    } catch {
      setPhase("idle")
      setError(t("error.generic"))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="checkout.title" step={4} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md text-center">
          {phase === "done" ? (
            <>
              <div className="mb-4 text-7xl">✅</div>
              <h2 className="text-3xl font-bold text-white">{t("checkout.step4.success")}</h2>
            </>
          ) : (
            <>
              <div className="mb-6 text-6xl">💳</div>
              <h2 className="mb-6 text-3xl font-bold text-white">{t("checkout.step4.title")}</h2>

              {/* Demo card */}
              <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 p-6 shadow-xl text-left">
                <p className="text-xs text-gray-400 mb-6">DEMO CARD</p>
                <p className="text-2xl font-mono tracking-widest text-white mb-4">•••• •••• •••• 1234</p>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{booking.guestName.toUpperCase()}</span>
                  <span>12/27</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-xl bg-red-500/20 px-4 py-3 text-base text-red-100">{error}</div>
              )}

              <KioskButton
                fullWidth
                size="xl"
                disabled={phase === "processing"}
                onClick={() => void confirmPayment()}
                icon={phase === "processing" ? undefined : "✔"}
              >
                {phase === "processing" ? t("checkout.step4.processing") : t("walkin.step5.btn")}
              </KioskButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Screen 5: Success ───────────────────────────────────────────────────────

function CheckOutSuccessScreen({
  result,
  onReset,
}: {
  result: CheckoutResult
  onReset: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [remaining, setRemaining] = useState(30)

  useState(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(interval); onReset(); return 0 }
        return r - 1
      })
    }, 1000)
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-lg text-center">
        <div className="mb-6 text-7xl">👋</div>
        <h2 className="mb-2 text-4xl font-bold text-white">{t("checkout.step5.title")}</h2>
        <p className="mb-8 text-xl text-blue-200">{t("checkout.step5.thanks")}</p>

        <div className="mb-8 overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="px-6 py-5 space-y-3">
            <InfoRow label="Mã đặt phòng" value={result.confirmationCode} />
            <InfoRow label="Khách hàng" value={result.guestName} />
            {result.amountPaid > 0 && (
              <InfoRow label="Đã thanh toán" value={formatCurrency(result.amountPaid)} />
            )}
          </div>
        </div>

        <p className="mb-4 text-base text-blue-200">
          {t("checkout.step5.reset")} <span className="font-bold text-white">{remaining}s</span>
        </p>
        <KioskButton variant="ghost" onClick={onReset} className="text-white border border-white/30">
          {t("btn.home")}
        </KioskButton>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-base text-gray-500">{label}</span>
      <span className="text-base font-semibold text-gray-900">{value}</span>
    </div>
  )
}

// ─── Main flow ───────────────────────────────────────────────────────────────

export function CheckOutFlow() {
  const { resetToHome } = useApp()
  const [step, setStep] = useState<Step>("lookup")
  const [booking, setBooking] = useState<BookingInfo | null>(null)
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)

  return (
    <>
      {step === "lookup" && (
        <LookupScreen
          onFound={(info) => { setBooking(info); setStep("folio") }}
          onBack={resetToHome}
        />
      )}
      {step === "folio" && booking && (
        <FolioScreen
          booking={booking}
          onPay={() => setStep("payment")}
          onBack={() => setStep("lookup")}
        />
      )}
      {step === "payment" && booking && (
        <PaymentConfirmScreen
          booking={booking}
          onConfirm={() => setStep("processing")}
          onBack={() => setStep("folio")}
        />
      )}
      {step === "processing" && booking && (
        <DemoPaymentScreen
          booking={booking}
          onSuccess={(r) => { setCheckoutResult(r); setStep("success") }}
        />
      )}
      {step === "success" && checkoutResult && (
        <CheckOutSuccessScreen result={checkoutResult} onReset={resetToHome} />
      )}
    </>
  )
}
