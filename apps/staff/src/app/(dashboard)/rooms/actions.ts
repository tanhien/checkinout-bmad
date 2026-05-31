"use server"

import { getServerCaller } from "@/lib/trpc-caller"
import { revalidatePath } from "next/cache"

export async function changeRoomStatusAction(
  roomId: string,
  newStatus: string,
  note?: string,
): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.room.updateStatus({
    roomId,
    newStatus: newStatus as
      | "CLEAN"
      | "DIRTY"
      | "CLEANING"
      | "INSPECTED"
      | "OCCUPIED"
      | "MAINTENANCE"
      | "RESERVED",
    note,
  })
  revalidatePath("/rooms")
}

export async function setRoomMaintenanceAction(
  roomId: string,
  note: string,
  estimatedDoneAt: string,
): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.room.setMaintenance({ roomId, note, estimatedDoneAt })
  revalidatePath("/rooms")
}
