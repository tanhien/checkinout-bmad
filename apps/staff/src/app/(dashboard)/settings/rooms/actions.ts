"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export async function createRoomAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.room.create({
      number: formData.get("number") as string,
      floor: Number(formData.get("floor")),
      roomTypeId: formData.get("roomTypeId") as string,
    })
    revalidatePath("/settings/rooms")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function bulkCreateRoomsAction(
  rooms: { number: string; floor: number; roomTypeId: string }[]
) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    const result = await caller.room.bulkCreate({ rooms })
    revalidatePath("/settings/rooms")
    return { success: true, count: result.count }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function toggleRoomActiveAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.room.toggleActive({ id })
    revalidatePath("/settings/rooms")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
