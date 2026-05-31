import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { RatePlansClient } from "./_components/RatePlansClient"

export default async function RatePlansSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [ratePlans, roomTypes] = await Promise.all([
    caller.ratePlan.list(),
    caller.roomType.list({ includeInactive: false }),
  ])

  const serializedPlans = ratePlans.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isNonRefundable: p.isNonRefundable,
    discountPercent: p.discountPercent != null ? Number(p.discountPercent) : null,
    minStayNights: p.minStayNights,
    weekdayPrice: p.weekdayPrice != null ? Number(p.weekdayPrice) : null,
    weekendPrice: p.weekendPrice != null ? Number(p.weekendPrice) : null,
    isActive: p.isActive,
    roomTypes: p.roomTypes.map((rt) => ({
      roomTypeId: rt.roomTypeId,
      priceOverride: rt.priceOverride != null ? Number(rt.priceOverride) : null,
      roomType: { id: rt.roomType.id, name: rt.roomType.name },
    })),
  }))

  const serializedTypes = roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))

  return <RatePlansClient ratePlans={serializedPlans} roomTypes={serializedTypes} />
}
