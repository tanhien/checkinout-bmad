"use server"

import { getServerCaller } from "@/lib/trpc-caller"
import { revalidatePath } from "next/cache"

type UpdateGuestData = {
  firstName?: string
  lastName?: string
  phone?: string | null
  nationality?: string | null
  dateOfBirth?: string | null
  tag?: "REGULAR" | "VIP" | "CORPORATE" | "BLACKLIST"
}

export async function updateGuestAction(guestId: string, data: UpdateGuestData): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.guest.update({ guestId, ...data })
  revalidatePath(`/guests/${guestId}`)
}

export async function addGuestNoteAction(guestId: string, content: string): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.guest.addNote({ guestId, content })
  revalidatePath(`/guests/${guestId}`)
}

export async function deleteGuestNoteAction(guestId: string, noteId: string): Promise<void> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.guest.deleteNote({ noteId })
  revalidatePath(`/guests/${guestId}`)
}
