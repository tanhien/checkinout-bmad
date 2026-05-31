"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  addChargeAction,
  voidItemAction,
  addPaymentAction,
  settleFolioAction,
  reopenFolioAction,
  addDiscountAction,
} from "../actions"

// ─── Types ────────────────────────────────────────────────────────────────────

type FolioItem = {
  id: string
  type: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  chargeDate: string
  isVoided: boolean
  voidReason: string | null
}

type Payment = {
  id: string
  method: string
  amount: number
  reference: string | null
  createdAt: string
}

type Service = {
  id: string
  name: string
  category: string
  unit: string
  price: number
}

type Folio = {
  id: string
  bookingId: string
  status: string
  chargesTotal: number
  paymentsTotal: number
  balance: number
  booking: {
    id: string
    confirmationCode: string
    status: string
    guest: { id: string; firstName: string; lastName: string; email: string }
  }
  items: FolioItem[]
  payments: Payment[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_ORDER: Record<string, number> = {
  ROOM_CHARGE: 0, SERVICE: 1, DISCOUNT: 2, TAX: 3,
}
const TYPE_LABEL: Record<string, string> = {
  ROOM_CHARGE: "Tiền phòng", SERVICE: "Dịch vụ", DISCOUNT: "Giảm giá", TAX: "Thuế",
}
const TYPE_BADGE: Record<string, string> = {
  ROOM_CHARGE: "bg-blue-100 text-blue-700",
  SERVICE:     "bg-teal-100 text-teal-700",
  DISCOUNT:    "bg-green-100 text-green-700",
  TAX:         "bg-gray-100 text-gray-600",
}
const METHOD_LABEL: Record<string, string> = {
  CASH: "Tiền mặt", CARD: "Thẻ", BANK_TRANSFER: "Chuyển khoản", DEMO: "Demo", OTHER: "Khác",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + " đ"
}

function fmtDate(iso: string) {
  return iso.slice(0, 10)
}

function sortItems(items: FolioItem[]): FolioItem[] {
  return [...items].sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionToggle({
  label,
  active,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string
  active: boolean
  onClick: () => void
  disabled?: boolean
  variant?: "default" | "red" | "green"
}) {
  const colors = {
    default: active ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50",
    red:     active ? "bg-red-600 text-white"  : "border border-red-300 text-red-700 hover:bg-red-50",
    green:   active ? "bg-green-600 text-white": "border border-green-300 text-green-700 hover:bg-green-50",
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${colors[variant]}`}
    >
      {label}
    </button>
  )
}

// ─── FolioManager ─────────────────────────────────────────────────────────────

export function FolioManager({
  folio,
  services,
  bookingId,
  isManager,
}: {
  folio: Folio
  services: Service[]
  bookingId: string
  isManager: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activePanel, setActivePanel] = useState<"charge" | "payment" | "discount" | "reopen" | null>(null)
  const [voidingId, setVoidingId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState("")
  const [error, setError] = useState("")

  // Add charge form state
  const [chargeMode, setChargeMode] = useState<"catalog" | "free">("catalog")
  const [chargeServiceId, setChargeServiceId] = useState("")
  const [chargeDesc, setChargeDesc] = useState("")
  const [chargeQty, setChargeQty] = useState("1")
  const [chargePrice, setChargePrice] = useState("")
  const [chargeDate, setChargeDate] = useState(new Date().toISOString().slice(0, 10))

  // Add payment form state
  const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "BANK_TRANSFER" | "DEMO" | "OTHER">("CASH")
  const [payAmount, setPayAmount] = useState("")
  const [payRef, setPayRef] = useState("")

  // Discount form state
  const [discType, setDiscType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE")
  const [discValue, setDiscValue] = useState("")
  const [discReason, setDiscReason] = useState("")

  // Reopen reason
  const [reopenReason, setReopenReason] = useState("")

  const folioOpen = folio.status === "OPEN"

  function toggle(panel: typeof activePanel) {
    setActivePanel((prev) => (prev === panel ? null : panel))
    setError("")
  }

  function run(fn: () => Promise<void>) {
    setError("")
    startTransition(async () => {
      try {
        await fn()
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định")
      }
    })
  }

  // ── Service catalog selection autofill ─────────────────────────────────────
  function onSelectService(svcId: string) {
    setChargeServiceId(svcId)
    const svc = services.find((s) => s.id === svcId)
    if (svc) {
      setChargeDesc(svc.name)
      setChargePrice(String(svc.price))
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAddCharge() {
    const qty = parseFloat(chargeQty)
    const price = parseFloat(chargePrice)
    if (!chargeDesc.trim() || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0 || !chargeDate) {
      setError("Vui lòng điền đầy đủ thông tin khoản phí")
      return
    }
    run(async () => {
      await addChargeAction(bookingId, folio.id, {
        serviceId: chargeMode === "catalog" && chargeServiceId ? chargeServiceId : undefined,
        description: chargeDesc.trim(),
        quantity: qty,
        unitPrice: price,
        chargeDate,
      })
      setActivePanel(null)
      setChargeDesc(""); setChargeQty("1"); setChargePrice(""); setChargeServiceId("")
    })
  }

  function handleVoid(itemId: string) {
    if (!voidReason.trim()) { setError("Nhập lý do hủy"); return }
    run(async () => {
      await voidItemAction(bookingId, itemId, voidReason.trim())
      setVoidingId(null); setVoidReason("")
    })
  }

  function handleAddPayment() {
    const amt = parseFloat(payAmount)
    if (isNaN(amt) || amt <= 0) { setError("Số tiền không hợp lệ"); return }
    run(async () => {
      await addPaymentAction(bookingId, folio.id, {
        method: payMethod, amount: amt, reference: payRef.trim() || undefined,
      })
      setActivePanel(null); setPayAmount(""); setPayRef("")
    })
  }

  function handleSettle() {
    run(() => settleFolioAction(bookingId, folio.id))
  }

  function handleReopen() {
    if (!reopenReason.trim()) { setError("Nhập lý do mở lại"); return }
    run(async () => {
      await reopenFolioAction(bookingId, folio.id, reopenReason.trim())
      setActivePanel(null); setReopenReason("")
    })
  }

  function handleDiscount() {
    const val = parseFloat(discValue)
    if (isNaN(val) || val <= 0 || !discReason.trim()) {
      setError("Điền đầy đủ thông tin giảm giá")
      return
    }
    run(async () => {
      await addDiscountAction(bookingId, folio.id, {
        type: discType, value: val, reason: discReason.trim(),
      })
      setActivePanel(null); setDiscValue(""); setDiscReason("")
    })
  }

  const sorted = sortItems(folio.items)

  return (
    <div className="space-y-5">
      {/* ── Balance summary ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200 text-center">
          <p className="text-xs text-gray-400 mb-1">Tổng phí</p>
          <p className="text-lg font-bold text-gray-900">{fmtVnd(folio.chargesTotal)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200 text-center">
          <p className="text-xs text-gray-400 mb-1">Đã thanh toán</p>
          <p className="text-lg font-bold text-green-600">{fmtVnd(folio.paymentsTotal)}</p>
        </div>
        <div className={`rounded-xl p-4 text-center ring-1 ${
          folio.balance === 0
            ? "bg-green-50 ring-green-200"
            : folio.balance > 0
              ? "bg-red-50 ring-red-200"
              : "bg-gray-50 ring-gray-200"
        }`}>
          <p className="text-xs text-gray-400 mb-1">Còn lại</p>
          <p className={`text-lg font-bold ${
            folio.balance === 0 ? "text-green-600" : folio.balance > 0 ? "text-red-600" : "text-gray-500"
          }`}>
            {fmtVnd(folio.balance)}
          </p>
        </div>
      </div>

      {/* Folio status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
          folio.status === "SETTLED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        }`}>
          {folio.status === "SETTLED" ? "Đã quyết toán" : "Đang mở"}
        </span>
        {!folioOpen && isManager && (
          <SectionToggle
            label="Mở lại folio"
            active={activePanel === "reopen"}
            onClick={() => toggle("reopen")}
            variant="red"
          />
        )}
        {folioOpen && (
          <button
            onClick={handleSettle}
            disabled={folio.balance > 0 || isPending}
            title={folio.balance > 0 ? "Cần thanh toán đủ trước khi quyết toán" : undefined}
            className="rounded-lg border border-green-400 px-4 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isManager ? "Quyết toán folio" : "Đề nghị quyết toán"}
          </button>
        )}
      </div>

      {/* Reopen form */}
      {activePanel === "reopen" && (
        <div className="rounded-xl bg-red-50 p-4 space-y-2 ring-1 ring-red-200">
          <p className="text-sm font-medium text-red-800">Lý do mở lại folio</p>
          <input
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            placeholder="Nhập lý do..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleReopen}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "..." : "Xác nhận mở lại"}
          </button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
      )}

      {/* ── Items list ───────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Các khoản phí ({folio.items.filter((i) => !i.isVoided).length} khoản)
          </h2>
          {folioOpen && (
            <div className="flex gap-2">
              <SectionToggle label="+ Khoản phí" active={activePanel === "charge"} onClick={() => toggle("charge")} />
              <SectionToggle label="% Giảm giá" active={activePanel === "discount"} onClick={() => toggle("discount")} variant="green" />
            </div>
          )}
        </div>

        {/* Add charge form */}
        {activePanel === "charge" && (
          <div className="border-b border-gray-100 bg-blue-50 px-5 py-4 space-y-3">
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={chargeMode === "catalog"} onChange={() => setChargeMode("catalog")} />
                Từ catalog
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={chargeMode === "free"} onChange={() => setChargeMode("free")} />
                Nhập tự do
              </label>
            </div>
            {chargeMode === "catalog" ? (
              <select
                value={chargeServiceId}
                onChange={(e) => onSelectService(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">— Chọn dịch vụ —</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.unit}) — {s.price.toLocaleString("vi-VN")} đ
                  </option>
                ))}
              </select>
            ) : null}
            <input
              value={chargeDesc}
              onChange={(e) => setChargeDesc(e.target.value)}
              placeholder="Mô tả khoản phí"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Số lượng</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={chargeQty}
                  onChange={(e) => setChargeQty(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Đơn giá (VND)</label>
                <input
                  type="number"
                  min="0"
                  value={chargePrice}
                  onChange={(e) => setChargePrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ngày</label>
                <input
                  type="date"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              {chargeQty && chargePrice ? (
                <span className="text-sm font-medium text-gray-700">
                  Tổng: {(parseFloat(chargeQty) * parseFloat(chargePrice)).toLocaleString("vi-VN")} đ
                </span>
              ) : <span />}
              <button
                onClick={handleAddCharge}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {isPending ? "..." : "Thêm khoản phí"}
              </button>
            </div>
          </div>
        )}

        {/* Discount form */}
        {activePanel === "discount" && (
          <div className="border-b border-gray-100 bg-green-50 px-5 py-4 space-y-3">
            <div className="flex gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={discType === "PERCENTAGE"} onChange={() => setDiscType("PERCENTAGE")} />
                Phần trăm (%)
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" checked={discType === "FIXED_AMOUNT"} onChange={() => setDiscType("FIXED_AMOUNT")} />
                Số tiền cố định
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {discType === "PERCENTAGE" ? "Tỷ lệ (%)" : "Số tiền (VND)"}
                </label>
                <input
                  type="number"
                  min="0.01"
                  value={discValue}
                  onChange={(e) => setDiscValue(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                {discType === "PERCENTAGE" && parseFloat(discValue) > 10 && !isManager && (
                  <p className="text-xs text-red-600 mt-1">Trên 10% cần quyền Manager</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Lý do</label>
                <input
                  value={discReason}
                  onChange={(e) => setDiscReason(e.target.value)}
                  placeholder="Lý do giảm giá"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleDiscount}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "..." : "Áp dụng giảm giá"}
            </button>
          </div>
        )}

        {/* Items table */}
        <div className="divide-y divide-gray-50">
          {sorted.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Chưa có khoản phí nào</p>
          ) : sorted.map((item) => (
            <div key={item.id} className="px-5 py-3">
              {/* Void dialog for this item */}
              {voidingId === item.id ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Lý do hủy..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => handleVoid(item.id)}
                    disabled={isPending}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {isPending ? "..." : "Xác nhận hủy"}
                  </button>
                  <button
                    onClick={() => { setVoidingId(null); setVoidReason("") }}
                    className="rounded-lg border px-3 py-1.5 text-sm text-gray-600"
                  >
                    Bỏ
                  </button>
                </div>
              ) : (
                <div className={`flex items-start gap-3 ${item.isVoided ? "opacity-50" : ""}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${item.isVoided ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {item.description}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_BADGE[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.quantity !== 1 && `×${item.quantity} · `}
                      {fmtVnd(item.unitPrice)}{item.quantity !== 1 ? ` / đv` : ""} · {fmtDate(item.chargeDate)}
                    </p>
                    {item.isVoided && item.voidReason && (
                      <p className="text-xs text-red-400 mt-0.5">Lý do hủy: {item.voidReason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-medium ${
                      item.amount < 0 ? "text-green-600" : item.isVoided ? "line-through text-gray-400" : "text-gray-900"
                    }`}>
                      {fmtVnd(item.amount)}
                    </span>
                    {!item.isVoided && folioOpen && item.type !== "TAX" && (
                      <button
                        onClick={() => { setVoidingId(item.id); setVoidReason(""); setError("") }}
                        className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Payments ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Thanh toán ({folio.payments.length})
          </h2>
          {folioOpen && (
            <SectionToggle label="+ Thanh toán" active={activePanel === "payment"} onClick={() => toggle("payment")} variant="green" />
          )}
        </div>

        {/* Add payment form */}
        {activePanel === "payment" && (
          <div className="border-b border-gray-100 bg-green-50 px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Phương thức</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {(["CASH", "CARD", "BANK_TRANSFER", "DEMO", "OTHER"] as const).map((m) => (
                    <option key={m} value={m}>{METHOD_LABEL[m]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Số tiền (VND)</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={folio.balance > 0 ? String(folio.balance) : ""}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <input
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="Số tham chiếu / mã giao dịch (tùy chọn)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={handleAddPayment}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isPending ? "..." : "Ghi nhận thanh toán"}
            </button>
          </div>
        )}

        {/* Payments list */}
        <div className="divide-y divide-gray-50">
          {folio.payments.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">Chưa có thanh toán nào</p>
          ) : folio.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm text-gray-900">{METHOD_LABEL[p.method] ?? p.method}</p>
                {p.reference && (
                  <p className="text-xs text-gray-400 font-mono">{p.reference}</p>
                )}
                <p className="text-xs text-gray-400">{p.createdAt.slice(0, 16).replace("T", " ")} UTC</p>
              </div>
              <span className="text-sm font-semibold text-green-600">{fmtVnd(p.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
