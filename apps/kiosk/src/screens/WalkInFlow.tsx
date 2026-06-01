import { useState } from "react"
import { useApp } from "@/context/AppContext"
import { useT } from "@/lib/i18n"
import { trpc } from "@/lib/trpc"
import { KioskButton } from "@/components/KioskButton"
import { ScreenHeader } from "@/components/ScreenHeader"
import { formatCurrency } from "@/lib/normalize"

type RoomTypeResult = {
  id: string
  name: string
  description: string | null
  areaM2: number | null
  maxAdults: number
  maxChildren: number
  bedType: string
  photoUrls: string[]
  basePrice: number
  pricePerNight: number
  totalPrice: number
  nights: number
  available: number
  amenities: { name: string; icon: string }[]
}

type BookingResult = {
  confirmationCode: string
  roomNumber: string
  floor: number
  guestName: string
  checkInDate: string
  checkOutDate: string
  totalAmount: number
}

type Step = "dates" | "room-types" | "guest-info" | "summary" | "payment" | "success"

type SearchParams = { checkIn: string; checkOut: string; adults: number; children: number }
type GuestInfo = { firstName: string; lastName: string; phone: string; email: string }

// ─── Screen 1: Date + guest count ───────────────────────────────────────────

function DateSearchScreen({
  onSearch,
  onBack,
}: {
  onSearch: (params: SearchParams) => void
  onBack: () => void
}) {
  const { lang, resetIdleTimer } = useApp()
  const t = useT(lang)

  // Default: check-in today, check-out tomorrow
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const [checkIn] = useState(today)  // always today per walkinMaxDays=0
  const [checkOut, setCheckOut] = useState(tomorrow)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function handleSearch() {
    if (checkOut <= checkIn) { setError(t("walkin.step1.checkin_today")); return }
    setError(null)
    onSearch({ checkIn, checkOut, adults, children })
  }

  // Min check-out = tomorrow
  const minCheckOut = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="walkin.title" onBack={onBack} step={1} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">{t("walkin.step1.title")}</h2>

          <div className="space-y-5">
            {/* Check-in date (read-only = today) */}
            <div className="rounded-2xl bg-white/10 px-5 py-4">
              <p className="mb-1 text-sm font-medium text-blue-200">{t("walkin.step1.checkin")}</p>
              <p className="text-xl font-bold text-white">{checkIn}</p>
              <p className="text-xs text-blue-300 mt-0.5">{t("walkin.step1.checkin_today")}</p>
            </div>

            {/* Check-out date */}
            <div className="rounded-2xl bg-white p-1">
              <p className="px-4 pt-2 text-sm font-medium text-gray-500">{t("walkin.step1.checkout")}</p>
              <input
                type="date"
                min={minCheckOut}
                value={checkOut}
                onChange={(e) => { setCheckOut(e.target.value); resetIdleTimer() }}
                className="w-full rounded-xl px-4 py-3 text-xl font-bold text-gray-900 focus:outline-none"
              />
            </div>

            {/* Guests */}
            <div className="grid grid-cols-2 gap-4">
              <CounterField
                label={t("walkin.step1.adults")}
                value={adults}
                min={1}
                max={8}
                onChange={(v) => { setAdults(v); resetIdleTimer() }}
              />
              <CounterField
                label={t("walkin.step1.children")}
                value={children}
                min={0}
                max={6}
                onChange={(v) => { setChildren(v); resetIdleTimer() }}
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/20 px-4 py-3 text-base text-red-100">{error}</div>
            )}

            <KioskButton fullWidth size="xl" onClick={handleSearch} icon="🔍">
              {t("walkin.step1.btn")}
            </KioskButton>
          </div>
        </div>
      </div>
    </div>
  )
}

function CounterField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="mb-2 text-center text-sm font-medium text-gray-500">{label}</p>
      <div className="flex items-center justify-between">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-2xl font-bold text-gray-700 hover:bg-gray-200 active:bg-gray-300"
        >
          −
        </button>
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 hover:bg-blue-200 active:bg-blue-300"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── Screen 2: Room type list ────────────────────────────────────────────────

function RoomTypeListScreen({
  params,
  onSelect,
  onBack,
}: {
  params: SearchParams
  onSelect: (rt: RoomTypeResult) => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [rooms, setRooms] = useState<RoomTypeResult[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useState(() => {
    trpc.kiosk.getAvailableRoomTypes.query(params)
      .then((data) => { setRooms(data); setLoading(false) })
      .catch(() => { setError(t("error.generic")); setLoading(false) })
  })

  const BED_ICON: Record<string, string> = {
    SINGLE: "🛏", DOUBLE: "🛏", TWIN: "🛏", KING: "👑", QUEEN: "💑", BUNK: "🪵",
  }

  return (
    <div className="flex h-screen flex-col">
      <ScreenHeader titleKey="walkin.title" onBack={onBack} step={2} totalSteps={5} />

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <h2 className="mb-6 text-center text-3xl font-bold text-white">{t("walkin.step2.title")}</h2>

        {loading && (
          <div className="flex h-40 items-center justify-center text-2xl text-white">{t("loading")}</div>
        )}

        {error && (
          <div className="text-center text-xl text-red-200">{error}</div>
        )}

        {rooms && rooms.length === 0 && (
          <div className="rounded-2xl bg-white/10 p-8 text-center text-xl text-white">
            {t("walkin.step2.no_rooms")}
          </div>
        )}

        {rooms && rooms.map((rt) => (
          <div
            key={rt.id}
            className="mb-5 overflow-hidden rounded-3xl bg-white shadow-xl"
          >
            {/* Photo */}
            {rt.photoUrls.length > 0 ? (
              <img src={rt.photoUrls[0]} alt={rt.name} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-32 items-center justify-center bg-blue-100 text-5xl">🏠</div>
            )}

            <div className="p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold text-gray-900">{rt.name}</h3>
                <div className="text-right">
                  <p className="text-2xl font-black text-blue-700">
                    {formatCurrency(rt.pricePerNight)}
                    <span className="text-sm font-normal text-gray-500">/{t("walkin.step2.per_night")}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("walkin.step2.total")}: {formatCurrency(rt.totalPrice)} ({rt.nights} {t("walkin.step2.nights")})
                  </p>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2 text-sm text-gray-600">
                <span>{BED_ICON[rt.bedType] ?? "🛏"} {rt.bedType}</span>
                {rt.areaM2 && <span>• {rt.areaM2} {t("walkin.step2.area")}</span>}
                <span>• {rt.maxAdults} {t("walkin.step2.adults")}</span>
              </div>

              {rt.amenities.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {rt.amenities.map((a) => (
                    <span key={a.name} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {a.icon} {a.name}
                    </span>
                  ))}
                </div>
              )}

              <KioskButton fullWidth size="lg" onClick={() => onSelect(rt)}>
                {t("walkin.step2.select")}
              </KioskButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Screen 3: Guest info form ───────────────────────────────────────────────

function GuestInfoScreen({
  onSubmit,
  onBack,
}: {
  onSubmit: (info: GuestInfo) => void
  onBack: () => void
}) {
  const { lang, resetIdleTimer } = useApp()
  const t = useT(lang)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim(), email: email.trim() })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="walkin.title" onBack={onBack} step={3} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-8 text-center text-3xl font-bold text-white">{t("walkin.step3.title")}</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("walkin.step3.last_name")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); resetIdleTimer() }}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-lg font-medium text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("walkin.step3.first_name")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); resetIdleTimer() }}
                  className="w-full rounded-2xl bg-white px-5 py-4 text-lg font-medium text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("walkin.step3.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); resetIdleTimer() }}
                className="w-full rounded-2xl bg-white px-5 py-4 text-lg font-medium text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-blue-200">{t("walkin.step3.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); resetIdleTimer() }}
                className="w-full rounded-2xl bg-white px-5 py-4 text-lg font-medium text-gray-900 shadow focus:outline-none focus:ring-4 focus:ring-white/40"
              />
            </div>

            <KioskButton
              fullWidth
              size="xl"
              disabled={!firstName.trim() || !lastName.trim() || !phone.trim()}
              onClick={handleSubmit}
            >
              {t("walkin.step3.btn")}
            </KioskButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen 4: Booking summary ───────────────────────────────────────────────

function BookingSummaryScreen({
  params,
  roomType,
  guest,
  onConfirm,
  onBack,
}: {
  params: SearchParams
  roomType: RoomTypeResult
  guest: GuestInfo
  onConfirm: () => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="walkin.title" onBack={onBack} step={4} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md">
          <h2 className="mb-6 text-center text-3xl font-bold text-white">{t("walkin.step4.title")}</h2>

          <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="divide-y divide-gray-100 px-6">
              <SRow label={t("walkin.step4.room")} value={roomType.name} />
              <SRow
                label={t("walkin.step4.dates")}
                value={`${params.checkIn} → ${params.checkOut} (${roomType.nights} đêm)`}
              />
              <SRow
                label={t("walkin.step4.guests")}
                value={`${params.adults} người lớn${params.children > 0 ? ` + ${params.children} trẻ em` : ""}`}
              />
              <SRow
                label={`${guest.lastName} ${guest.firstName}`}
                value={guest.phone}
              />
            </div>
            <div className="bg-blue-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-white">{t("walkin.step4.total")}</span>
                <span className="text-2xl font-black text-white">{formatCurrency(roomType.totalPrice)}</span>
              </div>
            </div>
          </div>

          <p className="mb-6 text-center text-sm text-blue-200">{t("walkin.step4.payment_note")}</p>

          <KioskButton fullWidth size="xl" icon="💳" onClick={onConfirm}>
            {t("walkin.step4.btn")}
          </KioskButton>
        </div>
      </div>
    </div>
  )
}

function SRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-base text-gray-500 shrink-0">{label}</span>
      <span className="text-base font-semibold text-gray-900 text-right">{value}</span>
    </div>
  )
}

// ─── Screen 5: Demo payment → success ───────────────────────────────────────

function DemoPaymentScreen({
  amount,
  params,
  roomType,
  guest,
  onSuccess,
  onBack,
}: {
  amount: number
  params: SearchParams
  roomType: RoomTypeResult
  guest: GuestInfo
  onSuccess: (result: BookingResult) => void
  onBack: () => void
}) {
  const { lang } = useApp()
  const t = useT(lang)
  const [phase, setPhase] = useState<"idle" | "processing" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  async function confirmPayment() {
    setPhase("processing")
    setError(null)
    // Simulate 2s payment delay
    await new Promise((r) => setTimeout(r, 2000))
    try {
      const result = await trpc.kiosk.walkInBook.mutate({
        roomTypeId: roomType.id,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        adults: params.adults,
        children: params.children,
        firstName: guest.firstName,
        lastName: guest.lastName,
        phone: guest.phone,
        ...(guest.email ? { email: guest.email } : {}),
      })
      setPhase("done")
      setTimeout(() => onSuccess(result), 1500)
    } catch {
      setPhase("idle")
      setError(t("error.generic"))
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScreenHeader titleKey="walkin.title" onBack={phase === "idle" ? onBack : undefined} step={5} totalSteps={5} />

      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <div className="w-full max-w-md text-center">
          {phase === "done" ? (
            <>
              <div className="mb-6 text-7xl">✅</div>
              <h2 className="text-3xl font-bold text-white">{t("walkin.step5.success")}</h2>
            </>
          ) : (
            <>
              <div className="mb-6 text-7xl">💳</div>
              <h2 className="mb-4 text-3xl font-bold text-white">{t("walkin.step5.title")}</h2>
              <p className="mb-2 text-lg text-blue-200">{t("walkin.step5.amount")}</p>
              <p className="mb-8 text-5xl font-black text-white">{formatCurrency(amount)}</p>

              {/* Demo payment card illustration */}
              <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-purple-600 p-6 shadow-xl text-left">
                <p className="text-xs text-white/70 mb-6">DEMO CARD</p>
                <p className="text-2xl font-mono tracking-widest text-white mb-4">•••• •••• •••• 1234</p>
                <div className="flex justify-between text-sm text-white/80">
                  <span>DEMO GUEST</span>
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
                {phase === "processing" ? t("walkin.step5.processing") : t("walkin.step5.btn")}
              </KioskButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Success screen (reuses check-in success styling) ───────────────────────

function WalkInSuccessScreen({
  result,
  onReset,
}: {
  result: BookingResult
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
        <div className="mb-6 text-7xl">🎉</div>
        <h2 className="mb-2 text-4xl font-bold text-white">{t("checkin.step4.title")}</h2>

        <div className="mb-8 overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-blue-600 py-8 text-center">
            <p className="text-lg font-medium text-blue-200">{t("checkin.step4.room")}</p>
            <p className="text-8xl font-black text-white">{result.roomNumber}</p>
            <p className="text-lg text-blue-200">{t("checkin.step4.floor")} {result.floor}</p>
          </div>
          <div className="px-6 py-4">
            <p className="text-center text-sm text-gray-500 font-mono">{result.confirmationCode}</p>
            <p className="mt-1 text-center text-sm text-gray-400">{result.checkInDate} → {result.checkOutDate}</p>
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

// ─── Main flow ───────────────────────────────────────────────────────────────

export function WalkInFlow() {
  const { resetToHome } = useApp()
  const [step, setStep] = useState<Step>("dates")
  const [params, setParams] = useState<SearchParams | null>(null)
  const [roomType, setRoomType] = useState<RoomTypeResult | null>(null)
  const [guest, setGuest] = useState<GuestInfo | null>(null)
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)

  return (
    <>
      {step === "dates" && (
        <DateSearchScreen
          onSearch={(p) => { setParams(p); setStep("room-types") }}
          onBack={resetToHome}
        />
      )}
      {step === "room-types" && params && (
        <RoomTypeListScreen
          params={params}
          onSelect={(rt) => { setRoomType(rt); setStep("guest-info") }}
          onBack={() => setStep("dates")}
        />
      )}
      {step === "guest-info" && (
        <GuestInfoScreen
          onSubmit={(g) => { setGuest(g); setStep("summary") }}
          onBack={() => setStep("room-types")}
        />
      )}
      {step === "summary" && params && roomType && guest && (
        <BookingSummaryScreen
          params={params}
          roomType={roomType}
          guest={guest}
          onConfirm={() => setStep("payment")}
          onBack={() => setStep("guest-info")}
        />
      )}
      {step === "payment" && params && roomType && guest && (
        <DemoPaymentScreen
          amount={roomType.totalPrice}
          params={params}
          roomType={roomType}
          guest={guest}
          onSuccess={(r) => { setBookingResult(r); setStep("success") }}
          onBack={() => setStep("summary")}
        />
      )}
      {step === "success" && bookingResult && (
        <WalkInSuccessScreen result={bookingResult} onReset={resetToHome} />
      )}
    </>
  )
}
