import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { PropertyForm } from "./_components/PropertyForm"
import { EmailTemplateSection } from "./_components/EmailTemplateSection"

export default async function PropertySettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [property, defaultTpl] = await Promise.all([
    caller.property.getConfig(),
    caller.property.getDefaultEmailTemplate(),
  ])

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-6">Thông tin khách sạn</h2>
      <PropertyForm property={property} />
      <EmailTemplateSection
        currentTemplate={property.emailTemplate}
        defaultTemplate={defaultTpl.template}
      />
    </div>
  )
}
