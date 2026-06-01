"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export async function updatePropertyAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }

  try {
    await caller.property.update({
      name: (formData.get("name") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      tagline: (formData.get("tagline") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      checkInHour: formData.get("checkInHour") ? Number(formData.get("checkInHour")) : undefined,
      checkOutHour: formData.get("checkOutHour") ? Number(formData.get("checkOutHour")) : undefined,
      timezone: (formData.get("timezone") as string) || undefined,
      currency: (formData.get("currency") as string) || undefined,
      wifiPassword: (formData.get("wifiPassword") as string) || undefined,
      breakfastHours: (formData.get("breakfastHours") as string) || undefined,
      freeCancelHours: formData.get("freeCancelHours") ? Number(formData.get("freeCancelHours")) : undefined,
      childMaxAge: formData.get("childMaxAge") ? Number(formData.get("childMaxAge")) : undefined,
      walkinMaxDays: formData.get("walkinMaxDays") ? Number(formData.get("walkinMaxDays")) : undefined,
      maxAdvanceDays: formData.get("maxAdvanceDays") ? Number(formData.get("maxAdvanceDays")) : undefined,
      minStayNights: formData.get("minStayNights") ? Number(formData.get("minStayNights")) : undefined,
      taxCode: (formData.get("taxCode") as string) || undefined,
      bankAccount: (formData.get("bankAccount") as string) || undefined,
    })
    revalidatePath("/settings/property")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateEmailTemplateAction(template: string | null) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.property.update({ emailTemplate: template })
    revalidatePath("/settings/property")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function previewEmailTemplateAction(template: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" } as { error: string; html?: string }
  try {
    return await caller.property.previewEmailTemplate({ template })
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Template error" } as { error: string; html?: string }
  }
}
