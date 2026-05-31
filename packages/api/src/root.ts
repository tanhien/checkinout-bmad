import { router, createCallerFactory } from "./trpc"
import { portalRouter } from "./routers/portal"
import { propertyRouter } from "./routers/property"
import { roomTypeRouter } from "./routers/room-type"
import { amenityRouter } from "./routers/amenity"
import { bookingRouter } from "./routers/booking"
import { roomRouter } from "./routers/room"
import { guestRouter } from "./routers/guest"
import { folioRouter } from "./routers/folio"
import { housekeepingRouter } from "./routers/housekeeping"
import { staffRouter } from "./routers/staff"
import { reportRouter } from "./routers/report"
import { promoCodeRouter } from "./routers/promo-code"
import { serviceRouter } from "./routers/service"
import { kioskRouter } from "./routers/kiosk"
import { availabilityRouter } from "./routers/availability"
import { ratePlanRouter } from "./routers/rate-plan"
import { pricingRouter } from "./routers/pricing"
import { taxRateRouter } from "./routers/tax-rate"

export const appRouter = router({
  portal: portalRouter,
  property: propertyRouter,
  roomType: roomTypeRouter,
  amenity: amenityRouter,
  booking: bookingRouter,
  room: roomRouter,
  guest: guestRouter,
  folio: folioRouter,
  housekeeping: housekeepingRouter,
  staff: staffRouter,
  report: reportRouter,
  promoCode: promoCodeRouter,
  service: serviceRouter,
  kiosk: kioskRouter,
  availability: availabilityRouter,
  ratePlan: ratePlanRouter,
  pricing: pricingRouter,
  taxRate: taxRateRouter,
})

export type AppRouter = typeof appRouter

// Direct server-side caller (use in Server Components — no HTTP overhead)
export const createCaller = createCallerFactory(appRouter)
