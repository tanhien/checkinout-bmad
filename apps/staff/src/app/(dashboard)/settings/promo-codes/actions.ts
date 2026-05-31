"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT"

export async function createPromoAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    const roomTypeIdsRaw = formData.get("roomTypeIds") as string
    const roomTypeIds = roomTypeIdsRaw ? roomTypeIdsRaw.split(",").map((s) => s.trim()).filter(Boolean) : []
    await caller.promoCode.create({
      code: formData.get("code") as string,
      description: (formData.get("description") as string) || undefined,
      discountType: formData.get("discountType") as DiscountType,
      discountValue: Number(formData.get("discountValue")),
      maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : undefined,
      validFrom: new Date(formData.get("validFrom") as string).toISOString(),
      validUntil: new Date(formData.get("validUntil") as string + "T23:59:59Z").toISOString(),
      roomTypeIds,
    })
    revalidatePath("/settings/promo-codes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function togglePromoAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.promoCode.toggleActive({ id })
    revalidatePath("/settings/promo-codes")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
