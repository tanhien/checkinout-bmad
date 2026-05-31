"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export async function createRatePlanAction(data: {
  name: string
  description?: string
  isNonRefundable: boolean
  discountPercent?: number
  minStayNights: number
  weekdayPrice?: number
  weekendPrice?: number
  roomTypeIds: { roomTypeId: string; priceOverride?: number }[]
}) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.ratePlan.create(data)
    revalidatePath("/settings/rate-plans")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateRatePlanAction(
  id: string,
  data: {
    name?: string
    description?: string | null
    isNonRefundable?: boolean
    discountPercent?: number | null
    minStayNights?: number
    weekdayPrice?: number | null
    weekendPrice?: number | null
    roomTypeIds?: { roomTypeId: string; priceOverride?: number }[]
  }
) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.ratePlan.update({ id, ...data })
    revalidatePath("/settings/rate-plans")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function deleteRatePlanAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.ratePlan.delete({ id })
    revalidatePath("/settings/rate-plans")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
