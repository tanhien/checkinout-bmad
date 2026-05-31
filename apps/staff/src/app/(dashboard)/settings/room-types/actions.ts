"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export async function createRoomTypeAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.roomType.create({
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      areaM2: formData.get("areaM2") ? Number(formData.get("areaM2")) : undefined,
      maxAdults: Number(formData.get("maxAdults")),
      maxChildren: Number(formData.get("maxChildren") ?? 2),
      bedType: formData.get("bedType") as "SINGLE" | "DOUBLE" | "TWIN" | "KING" | "QUEEN" | "BUNK",
      basePrice: Number(formData.get("basePrice")),
      isFeatured: formData.get("isFeatured") === "true",
    })
    revalidatePath("/settings/room-types")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateRoomTypeAction(id: string, formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.roomType.update({
      id,
      name: (formData.get("name") as string) || undefined,
      slug: (formData.get("slug") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      areaM2: formData.get("areaM2") ? Number(formData.get("areaM2")) : undefined,
      maxAdults: formData.get("maxAdults") ? Number(formData.get("maxAdults")) : undefined,
      maxChildren: formData.get("maxChildren") ? Number(formData.get("maxChildren")) : undefined,
      bedType: (formData.get("bedType") as "SINGLE" | "DOUBLE" | "TWIN" | "KING" | "QUEEN" | "BUNK") || undefined,
      basePrice: formData.get("basePrice") ? Number(formData.get("basePrice")) : undefined,
      isFeatured: formData.has("isFeatured") ? formData.get("isFeatured") === "true" : undefined,
    })
    revalidatePath("/settings/room-types")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function toggleRoomTypeAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.roomType.toggleActive({ id })
    revalidatePath("/settings/room-types")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
