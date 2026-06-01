import { describe, it, expect } from "vitest"

// ── Pure helpers replicated from routers/folio.ts ───────────────────────────
// These functions are inlined in the router; we test the logic here so any
// future extraction is already covered.

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(String(v))
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function computeTotals(
  items: Array<{ amount: unknown; isVoided: boolean }>,
  payments: Array<{ amount: unknown }>,
) {
  const charges = items.filter((i) => !i.isVoided).reduce((s, i) => s + toNum(i.amount), 0)
  const paid = payments.reduce((s, p) => s + toNum(p.amount), 0)
  return {
    chargesTotal: round2(charges),
    paymentsTotal: round2(paid),
    balance: round2(charges - paid),
  }
}

// ── Booking overlap formula (from availability router) ───────────────────────
// Overlap iff: booking.checkIn < query.checkOut AND booking.checkOut > query.checkIn
function overlaps(
  bStart: Date, bEnd: Date,   // existing booking
  qStart: Date, qEnd: Date,   // query range
): boolean {
  return bStart < qEnd && bEnd > qStart
}

// ── Discount validation (from folio router) ──────────────────────────────────
const MANAGER_ROLES = ["MANAGER", "ADMIN"]
function canApplyDiscount(discountPct: number, role: string): boolean {
  if (discountPct > 10) return MANAGER_ROLES.includes(role)
  return true // any staff
}

// ── toNum ─────────────────────────────────────────────────────────────────────
describe("toNum — Prisma Decimal interop", () => {
  it("passes through plain numbers", () => {
    expect(toNum(1_000_000)).toBe(1_000_000)
    expect(toNum(0)).toBe(0)
  })

  it("converts Prisma Decimal-like object via .toNumber()", () => {
    const decimal = { toNumber: () => 500_000 }
    expect(toNum(decimal)).toBe(500_000)
  })

  it("converts string representation", () => {
    expect(toNum("800000")).toBe(800_000)
    expect(toNum("1500000.50")).toBeCloseTo(1_500_000.5)
  })

  it("handles zero string", () => {
    expect(toNum("0")).toBe(0)
  })
})

// ── round2 ────────────────────────────────────────────────────────────────────
describe("round2 — currency rounding", () => {
  it("leaves integers unchanged (typical VNĐ amounts)", () => {
    expect(round2(1_000_000)).toBe(1_000_000)
    expect(round2(800_000)).toBe(800_000)
    expect(round2(0)).toBe(0)
  })

  it("rounds cents to 2 decimal places", () => {
    expect(round2(1.234)).toBe(1.23)
    expect(round2(1.235)).toBe(1.24)
    expect(round2(1_000_000.1)).toBe(1_000_000.1)
  })

  it("handles negative (discount / overpayment)", () => {
    expect(round2(-200_000)).toBe(-200_000)
    expect(round2(-0.125)).toBe(-0.12)
  })
})

// ── computeTotals ─────────────────────────────────────────────────────────────
describe("computeTotals — folio balance", () => {
  it("no items no payments → all zero", () => {
    expect(computeTotals([], [])).toEqual({ chargesTotal: 0, paymentsTotal: 0, balance: 0 })
  })

  it("single room charge, no payment → balance = charge", () => {
    const items = [{ amount: 2_000_000, isVoided: false }]
    const { chargesTotal, paymentsTotal, balance } = computeTotals(items, [])
    expect(chargesTotal).toBe(2_000_000)
    expect(paymentsTotal).toBe(0)
    expect(balance).toBe(2_000_000)
  })

  it("voided items are excluded from charges", () => {
    const items = [
      { amount: 2_000_000, isVoided: false },
      { amount: 150_000,   isVoided: true  }, // voided minibar
    ]
    const { chargesTotal } = computeTotals(items, [])
    expect(chargesTotal).toBe(2_000_000)   // 150k NOT included
  })

  it("full payment → balance = 0", () => {
    const items    = [{ amount: 2_000_000, isVoided: false }]
    const payments = [{ amount: 2_000_000 }]
    const { balance } = computeTotals(items, payments)
    expect(balance).toBe(0)
  })

  it("partial payment → balance = remaining", () => {
    const items    = [{ amount: 2_000_000, isVoided: false }]
    const payments = [{ amount: 800_000 }]
    const { balance } = computeTotals(items, payments)
    expect(balance).toBe(1_200_000)
  })

  it("overpayment → balance negative (refund owed)", () => {
    const items    = [{ amount: 1_000_000, isVoided: false }]
    const payments = [{ amount: 1_200_000 }]
    const { balance } = computeTotals(items, payments)
    expect(balance).toBe(-200_000)
  })

  it("multiple charges + multiple payments", () => {
    const items = [
      { amount: 2_000_000, isVoided: false }, // room charge
      { amount: 150_000,   isVoided: false }, // minibar
      { amount: 80_000,    isVoided: false }, // laundry
      { amount: 50_000,    isVoided: true  }, // voided
    ]
    const payments = [
      { amount: 1_000_000 },
      { amount: 500_000   },
    ]
    const { chargesTotal, paymentsTotal, balance } = computeTotals(items, payments)
    expect(chargesTotal).toBe(2_230_000)   // 2M + 150k + 80k (50k voided)
    expect(paymentsTotal).toBe(1_500_000)
    expect(balance).toBe(730_000)
  })

  it("Prisma Decimal objects work end-to-end", () => {
    const items = [
      { amount: { toNumber: () => 3_000_000 }, isVoided: false },
    ]
    const payments = [
      { amount: { toNumber: () => 1_500_000 } },
    ]
    const { balance } = computeTotals(
      items as Array<{ amount: unknown; isVoided: boolean }>,
      payments as Array<{ amount: unknown }>,
    )
    expect(balance).toBe(1_500_000)
  })

  it("TC-FOLIO-02: settle fails when balance > 0", () => {
    const items    = [{ amount: 1_000_000, isVoided: false }]
    const payments = [{ amount: 800_000 }]
    const { balance } = computeTotals(items, payments)
    // Simulate the settle guard
    const canSettle = balance <= 0
    expect(canSettle).toBe(false)   // 200k still owed
  })

  it("TC-FOLIO-02: settle allowed when balance = 0", () => {
    const items    = [{ amount: 1_000_000, isVoided: false }]
    const payments = [{ amount: 1_000_000 }]
    const { balance } = computeTotals(items, payments)
    expect(balance <= 0).toBe(true)
  })
})

// ── Booking overlap ───────────────────────────────────────────────────────────
describe("overlaps — booking date conflict detection (TC-BOOK-05 logic)", () => {
  const jun1 = new Date("2026-06-01T00:00:00.000Z")
  const jun5 = new Date("2026-06-05T00:00:00.000Z")
  const jun8 = new Date("2026-06-08T00:00:00.000Z")
  const jun10 = new Date("2026-06-10T00:00:00.000Z")

  it("exact same range → overlaps", () => {
    expect(overlaps(jun1, jun5, jun1, jun5)).toBe(true)
  })

  it("adjacent ranges (end === start) → no overlap", () => {
    // Booking ends Jun5, new starts Jun5 (check-out == next check-in = ok)
    expect(overlaps(jun1, jun5, jun5, jun8)).toBe(false)
  })

  it("query range fully inside existing booking → overlaps", () => {
    // Existing: Jun1–Jun10, Query: Jun5–Jun8 (inside)
    expect(overlaps(jun1, jun10, jun5, jun8)).toBe(true)
  })

  it("existing booking fully inside query range → overlaps", () => {
    expect(overlaps(jun5, jun8, jun1, jun10)).toBe(true)
  })

  it("partial overlap at end → overlaps", () => {
    // Existing: Jun1–Jun5, Query: Jun3–Jun8 (overlap on Jun3-Jun5)
    const jun3 = new Date("2026-06-03T00:00:00.000Z")
    expect(overlaps(jun1, jun5, jun3, jun8)).toBe(true)
  })

  it("partial overlap at start → overlaps", () => {
    // Existing: Jun5–Jun10, Query: Jun1–Jun8
    expect(overlaps(jun5, jun10, jun1, jun8)).toBe(true)
  })

  it("completely before → no overlap", () => {
    // Existing: Jun1–Jun5, Query: Jun8–Jun10
    expect(overlaps(jun1, jun5, jun8, jun10)).toBe(false)
  })

  it("completely after → no overlap", () => {
    // Existing: Jun8–Jun10, Query: Jun1–Jun5
    expect(overlaps(jun8, jun10, jun1, jun5)).toBe(false)
  })

  it("single-night booking adjacent to existing → no overlap", () => {
    // Existing: Jun1–Jun5, New 1-night: Jun5–Jun6
    const jun6 = new Date("2026-06-06T00:00:00.000Z")
    expect(overlaps(jun1, jun5, jun5, jun6)).toBe(false)
  })
})

// ── Discount role guard ────────────────────────────────────────────────────────
describe("canApplyDiscount — TC-FOLIO-04: >10% requires Manager", () => {
  it("FRONT_DESK can apply ≤10% discount", () => {
    expect(canApplyDiscount(5,  "FRONT_DESK")).toBe(true)
    expect(canApplyDiscount(10, "FRONT_DESK")).toBe(true)
  })

  it("FRONT_DESK cannot apply >10% discount", () => {
    expect(canApplyDiscount(11, "FRONT_DESK")).toBe(false)
    expect(canApplyDiscount(50, "FRONT_DESK")).toBe(false)
  })

  it("MANAGER can apply any discount", () => {
    expect(canApplyDiscount(10, "MANAGER")).toBe(true)
    expect(canApplyDiscount(11, "MANAGER")).toBe(true)
    expect(canApplyDiscount(100, "MANAGER")).toBe(true)
  })

  it("ADMIN can apply any discount", () => {
    expect(canApplyDiscount(100, "ADMIN")).toBe(true)
  })

  it("HOUSEKEEPING cannot apply >10%", () => {
    expect(canApplyDiscount(15, "HOUSEKEEPING")).toBe(false)
  })

  it("ACCOUNTANT cannot apply >10%", () => {
    expect(canApplyDiscount(11, "ACCOUNTANT")).toBe(false)
  })
})
