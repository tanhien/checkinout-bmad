"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

type TaxAppliesTo = "ROOM" | "SERVICE" | "ALL"

export async function createTaxAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.taxRate.create({
      name: formData.get("name") as string,
      rate: Number(formData.get("rate")),
      appliesTo: (formData.get("appliesTo") as TaxAppliesTo) || "ALL",
    })
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateTaxAction(id: string, formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.taxRate.update({
      id,
      name: (formData.get("name") as string) || undefined,
      rate: formData.get("rate") ? Number(formData.get("rate")) : undefined,
      appliesTo: (formData.get("appliesTo") as TaxAppliesTo) || undefined,
    })
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function toggleTaxAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.taxRate.toggleActive({ id })
    revalidatePath("/settings/taxes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
