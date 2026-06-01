import { describe, it, expect } from "vitest"
import { getEffectivePrice, calculatePricing } from "./pricing"

// 2026-06-01 = Monday (verified: 2026-01-01 is Thu; +151 days = Mon)
const MON = new Date("2026-06-01T00:00:00.000Z") // Mon
const THU = new Date("2026-06-04T00:00:00.000Z")
const FRI = new Date("2026-06-05T00:00:00.000Z")
const SAT = new Date("2026-06-06T00:00:00.000Z")
const SUN = new Date("2026-06-07T00:00:00.000Z")

const BASE = 1_000_000

describe("getEffectivePrice", () => {
  it("returns basePrice when no rate plan", () => {
    expect(getEffectivePrice(BASE, null, null, MON)).toBe(1_000_000)
  })

  it("returns priceOverride when no rate plan but override set", () => {
    expect(getEffectivePrice(BASE, null, 1_200_000, MON)).toBe(1_200_000)
  })

  it("uses weekdayPrice on Monday", () => {
    const plan = { name: "P", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }
    expect(getEffectivePrice(BASE, plan, null, MON)).toBe(800_000)
  })

  it("uses weekdayPrice on Thursday", () => {
    const plan = { name: "P", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }
    expect(getEffectivePrice(BASE, plan, null, THU)).toBe(800_000)
  })

  it("uses weekendPrice on Friday", () => {
    const plan = { name: "P", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }
    expect(getEffectivePrice(BASE, plan, null, FRI)).toBe(1_200_000)
  })

  it("uses weekendPrice on Saturday", () => {
    const plan = { name: "P", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }
    expect(getEffectivePrice(BASE, plan, null, SAT)).toBe(1_200_000)
  })

  it("uses weekendPrice on Sunday", () => {
    const plan = { name: "P", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }
    expect(getEffectivePrice(BASE, plan, null, SUN)).toBe(1_200_000)
  })

  it("applies discountPercent when no weekday/weekend override", () => {
    const plan = { name: "10% Off", isNonRefundable: true, discountPercent: 10, weekdayPrice: null, weekendPrice: null }
    expect(getEffectivePrice(BASE, plan, null, MON)).toBe(900_000)
  })

  it("applies discountPercent to priceOverride when both set", () => {
    const plan = { name: "10% Off", isNonRefundable: false, discountPercent: 10, weekdayPrice: null, weekendPrice: null }
    // 1,200,000 * 0.90 = 1,080,000
    expect(getEffectivePrice(BASE, plan, 1_200_000, MON)).toBe(1_080_000)
  })

  it("weekday/weekend price takes priority over discountPercent", () => {
    const plan = { name: "Mixed", isNonRefundable: false, discountPercent: 50, weekdayPrice: 900_000, weekendPrice: null }
    // discountPercent (50%) would give 500k, but weekdayPrice (900k) takes priority
    expect(getEffectivePrice(BASE, plan, null, MON)).toBe(900_000)
  })
})

describe("calculatePricing", () => {
  it("3-night weekday booking, no rate plan → basePrice × 3", () => {
    const checkIn = MON
    const checkOut = THU // Mon, Tue, Wed = 3 nights
    const result = calculatePricing(BASE, null, null, checkIn, checkOut)

    expect(result.nights).toBe(3)
    expect(result.subtotal).toBe(3_000_000)
    expect(result.total).toBe(3_000_000)
    expect(result.discountAmount).toBe(0)
    expect(result.discountPercent).toBeNull()
    expect(result.isNonRefundable).toBe(false)
    expect(result.ratePlanName).toBeNull()
    expect(result.breakdown).toHaveLength(3)
    expect(result.breakdown[0]!.isWeekend).toBe(false)
  })

  it("weekday/weekend pricing across a 6-night booking", () => {
    // Mon–Sat (6 nights): Mon(800k) Tue(800k) Wed(800k) Thu(800k) Fri(1200k) Sat(1200k)
    const checkIn = MON
    const checkOut = SUN // = Mon+6 nights
    const plan = { name: "Summer", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }

    const result = calculatePricing(BASE, plan, null, checkIn, checkOut)

    expect(result.nights).toBe(6)
    expect(result.subtotal).toBe(4 * 800_000 + 2 * 1_200_000) // 3_200_000 + 2_400_000 = 5_600_000
    expect(result.total).toBe(5_600_000)
    // Weekend days: Fri + Sat
    const weekendDays = result.breakdown.filter((d) => d.isWeekend)
    expect(weekendDays).toHaveLength(2)
    weekendDays.forEach((d) => expect(d.pricePerNight).toBe(1_200_000))
    const weekdayDays = result.breakdown.filter((d) => !d.isWeekend)
    expect(weekdayDays).toHaveLength(4)
    weekdayDays.forEach((d) => expect(d.pricePerNight).toBe(800_000))
  })

  it("multi-week booking (2 weeks) weekday/weekend", () => {
    // 2 weeks = 14 nights: 8 weekday (Mon-Thu × 2) + 6 weekend (Fri,Sat,Sun × 2)
    const checkIn = MON // 2026-06-01
    const checkOut = new Date("2026-06-15T00:00:00.000Z") // 14 nights
    const plan = { name: "W2", isNonRefundable: false, discountPercent: null, weekdayPrice: 700_000, weekendPrice: 1_100_000 }

    const result = calculatePricing(BASE, plan, null, checkIn, checkOut)

    expect(result.nights).toBe(14)
    const weekends = result.breakdown.filter((d) => d.isWeekend).length
    const weekdays = result.breakdown.filter((d) => !d.isWeekend).length
    // Week 1: Mon Tue Wed Thu Fri Sat Sun = 4 weekday + 3 weekend nights counted
    // But SUN (2026-06-07) is a weekend and it's counted as a night (check-out is 06-14 Mon)
    // Actually: Mon 1, Tue 2, Wed 3, Thu 4, Fri 5, Sat 6, Sun 7, Mon 8, Tue 9, Wed 10, Thu 11, Fri 12, Sat 13, Sun 14? No.
    // checkIn = 2026-06-01 (Mon), checkOut = 2026-06-15 (Mon)
    // Nights: 1,2,3,4,5,6,7,8,9,10,11,12,13,14 = Mon-Sun week1 (7) + Mon-Sun week2 starts on 8th
    // Wait: 2026-06-01(Mon), 06-02(Tue), 06-03(Wed), 06-04(Thu), 06-05(Fri), 06-06(Sat), 06-07(Sun),
    //        06-08(Mon), 06-09(Tue), 06-10(Wed), 06-11(Thu), 06-12(Fri), 06-13(Sat), 06-14(Sun) = 14 nights
    // Weekday (Mon-Thu): 01,02,03,04,08,09,10,11 = 8 nights
    // Weekend (Fri-Sun): 05,06,07,12,13,14 = 6 nights
    expect(weekdays).toBe(8)
    expect(weekends).toBe(6)
    expect(result.subtotal).toBe(8 * 700_000 + 6 * 1_100_000)
  })

  it("10% discount plan → subtotal reduced, discountAmount > 0", () => {
    // 3 nights × 1,000,000 × 0.9 = 2,700,000; savings = 300,000
    const checkIn = MON
    const checkOut = THU
    const plan = { name: "10% Off", isNonRefundable: true, discountPercent: 10, weekdayPrice: null, weekendPrice: null }

    const result = calculatePricing(BASE, plan, null, checkIn, checkOut)

    expect(result.nights).toBe(3)
    expect(result.subtotal).toBe(2_700_000)
    expect(result.total).toBe(2_700_000)
    expect(result.discountPercent).toBe(10)
    expect(result.discountAmount).toBe(300_000)
    expect(result.isNonRefundable).toBe(true)
    expect(result.ratePlanName).toBe("10% Off")
  })

  it("no discount when weekday/weekend prices used (discountAmount = difference vs base)", () => {
    // weekendPrice (1200k) > BASE (1000k) → no savings on weekend
    // weekdayPrice (800k) < BASE → savings on weekday
    const checkIn = MON
    const checkOut = FRI // Mon-Thu = 4 weekday nights
    const plan = { name: "W", isNonRefundable: false, discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000 }

    const result = calculatePricing(BASE, plan, null, checkIn, checkOut)

    // 4 nights × 800k = 3,200,000; base would be 4 × 1,000,000 = 4,000,000
    expect(result.nights).toBe(4)
    expect(result.subtotal).toBe(3_200_000)
    expect(result.discountAmount).toBe(800_000)
  })

  it("breakdown dates are in YYYY-MM-DD format", () => {
    const checkIn = new Date("2026-01-31T00:00:00.000Z")
    const checkOut = new Date("2026-02-02T00:00:00.000Z")
    const result = calculatePricing(BASE, null, null, checkIn, checkOut)
    expect(result.breakdown[0]!.date).toBe("2026-01-31")
    expect(result.breakdown[1]!.date).toBe("2026-02-01")
  })
})
