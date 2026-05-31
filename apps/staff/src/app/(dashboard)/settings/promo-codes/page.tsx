import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { PromoCodesClient } from "./_components/PromoCodesClient"

export default async function PromoCodesSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [promos, roomTypes] = await Promise.all([
    caller.promoCode.list(),
    caller.roomType.list({ includeInactive: false }),
  ])

  const serializedPromos = promos.map((p) => ({
    id: p.id,
    code: p.code,
    description: p.description,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
    maxUses: p.maxUses,
    usedCount: p.usedCount,
    validFrom: p.validFrom.toISOString(),
    validUntil: p.validUntil.toISOString(),
    roomTypeIds: p.roomTypeIds,
    isActive: p.isActive,
  }))

  const serializedTypes = roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))

  return <PromoCodesClient promos={serializedPromos} roomTypes={serializedTypes} />
}
