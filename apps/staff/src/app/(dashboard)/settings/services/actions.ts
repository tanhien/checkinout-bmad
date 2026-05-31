"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

type ServiceCategory = "FOOD_BEVERAGE" | "LAUNDRY" | "SPA" | "MINIBAR" | "TRANSPORT" | "OTHER"

export async function createServiceAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.service.create({
      name: formData.get("name") as string,
      category: formData.get("category") as ServiceCategory,
      unit: formData.get("unit") as string,
      price: Number(formData.get("price")),
    })
    revalidatePath("/settings/services")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateServiceAction(id: string, formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.service.update({
      id,
      name: (formData.get("name") as string) || undefined,
      category: (formData.get("category") as ServiceCategory) || undefined,
      unit: (formData.get("unit") as string) || undefined,
      price: formData.get("price") ? Number(formData.get("price")) : undefined,
    })
    revalidatePath("/settings/services")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function toggleServiceAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.service.toggleActive({ id })
    revalidatePath("/settings/services")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
