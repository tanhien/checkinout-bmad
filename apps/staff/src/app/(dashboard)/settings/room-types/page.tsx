import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { RoomTypesClient } from "./_components/RoomTypesClient"

export default async function RoomTypesSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const roomTypes = await caller.roomType.list({ includeInactive: true })

  const serialized = roomTypes.map((rt) => ({
    id: rt.id,
    name: rt.name,
    slug: rt.slug,
    description: rt.description,
    areaM2: rt.areaM2,
    maxAdults: rt.maxAdults,
    maxChildren: rt.maxChildren,
    bedType: rt.bedType,
    basePrice: Number(rt.basePrice),
    isActive: rt.isActive,
    isFeatured: rt.isFeatured,
    _count: rt._count,
  }))

  return <RoomTypesClient roomTypes={serialized} />
}
