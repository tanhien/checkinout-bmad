import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { PropertyForm } from "./_components/PropertyForm"

export default async function PropertySettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const property = await caller.property.getConfig()

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-6">Thông tin khách sạn</h2>
      <PropertyForm property={property} />
    </div>
  )
}
