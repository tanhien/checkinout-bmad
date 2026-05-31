import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { ServicesClient } from "./_components/ServicesClient"

export default async function ServicesSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const services = await caller.service.listAll()
  const serialized = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    unit: s.unit,
    price: Number(s.price),
    isActive: s.isActive,
  }))

  return <ServicesClient services={serialized} />
}
