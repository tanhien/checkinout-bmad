// Pure pricing functions — no DB access, fully testable

export interface RatePlanForPricing {
  name: string
  isNonRefundable: boolean
  discountPercent: number | null
  weekdayPrice: number | null  // Mon–Thu override
  weekendPrice: number | null  // Fri–Sun override
}

export interface PricingBreakdownDay {
  date: string        // YYYY-MM-DD
  pricePerNight: number
  isWeekend: boolean
}

export interface PricingResult {
  nights: number
  breakdown: PricingBreakdownDay[]
  subtotal: number      // sum of per-night prices
  discountPercent: number | null
  discountAmount: number  // savings vs undiscounted base total
  total: number         // equals subtotal (discount already factored in per-night)
  isNonRefundable: boolean
  ratePlanName: string | null
}

// Weekend = Fri (5), Sat (6), Sun (0) in UTC
function isWeekendDay(date: Date): boolean {
  const dow = date.getUTCDay()
  return dow === 0 || dow === 5 || dow === 6
}

/**
 * Returns the effective price for a single night, given:
 *  - basePrice: room type's base rate
 *  - ratePlan: optional plan with weekday/weekend overrides or discount %
 *  - priceOverride: per-room-type override within the rate plan (RatePlanRoomType.priceOverride)
 *  - date: the night being priced (UTC midnight)
 *
 * Priority: day-specific price → priceOverride+discount → basePrice+discount → basePrice
 */
export function getEffectivePrice(
  basePrice: number,
  ratePlan: RatePlanForPricing | null,
  priceOverride: number | null,
  date: Date,
): number {
  if (!ratePlan) return priceOverride ?? basePrice

  const weekend = isWeekendDay(date)

  if (weekend && ratePlan.weekendPrice !== null) return ratePlan.weekendPrice
  if (!weekend && ratePlan.weekdayPrice !== null) return ratePlan.weekdayPrice

  const base = priceOverride ?? basePrice

  if (ratePlan.discountPercent !== null) {
    return Math.round(base * (1 - ratePlan.discountPercent / 100) * 100) / 100
  }

  return base
}

/**
 * Builds a full pricing breakdown for a date range.
 * checkIn and checkOut must be UTC midnight dates.
 */
export function calculatePricing(
  basePrice: number,
  ratePlan: RatePlanForPricing | null,
  priceOverride: number | null,
  checkIn: Date,
  checkOut: Date,
): PricingResult {
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000)
  const breakdown: PricingBreakdownDay[] = []

  const cursor = new Date(checkIn)
  for (let i = 0; i < nights; i++) {
    const day = new Date(cursor)
    const weekend = isWeekendDay(day)
    breakdown.push({
      date: day.toISOString().slice(0, 10),
      pricePerNight: getEffectivePrice(basePrice, ratePlan, priceOverride, day),
      isWeekend: weekend,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  const subtotal = Math.round(breakdown.reduce((s, d) => s + d.pricePerNight, 0) * 100) / 100
  const undiscountedBase = Math.round(nights * (priceOverride ?? basePrice) * 100) / 100
  const discountAmount = Math.max(0, Math.round((undiscountedBase - subtotal) * 100) / 100)

  return {
    nights,
    breakdown,
    subtotal,
    discountPercent: ratePlan?.discountPercent ?? null,
    discountAmount,
    total: subtotal,
    isNonRefundable: ratePlan?.isNonRefundable ?? false,
    ratePlanName: ratePlan?.name ?? null,
  }
}
