import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { TaxesClient } from "./_components/TaxesClient"

export default async function TaxesSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const taxes = await caller.taxRate.list()
  const serialized = taxes.map((t) => ({
    id: t.id,
    name: t.name,
    rate: Number(t.rate),
    appliesTo: t.appliesTo,
    isActive: t.isActive,
  }))

  return <TaxesClient taxes={serialized} />
}
