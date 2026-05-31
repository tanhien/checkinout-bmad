"use server"

import { getServerCaller } from "@/lib/trpc-caller"
import { revalidatePath } from "next/cache"

export async function updateRoomStatusAction(
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
  revalidatePath("/housekeeping")
}

export async function assignHousekeepingAction(
  roomId: string,
  staffId: string | null,
): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.room.assignHousekeeping({ roomId, staffId })
  revalidatePath("/housekeeping")
}
