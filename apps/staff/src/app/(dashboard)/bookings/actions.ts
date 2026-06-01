"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export async function cancelBookingAction(bookingId: string, reason: string) {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.booking.cancel({ bookingId, reason })
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/bookings")
}

export async function checkInBookingAction(bookingId: string) {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.booking.checkIn({ bookingId })
  revalidatePath(`/bookings/${bookingId}`)
}

export async function checkOutBookingAction(bookingId: string): Promise<{ folioUnsettled: boolean }> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  const result = await caller.booking.checkOut({ bookingId })
  revalidatePath(`/bookings/${bookingId}`)
  return { folioUnsettled: result.folioUnsettled }
}

export async function markNoShowAction(bookingId: string) {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.booking.markNoShow({ bookingId })
  revalidatePath(`/bookings/${bookingId}`)
}

export async function assignRoomAction(bookingId: string, roomId: string) {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  await caller.room.assign({ bookingId, roomId })
  revalidatePath(`/bookings/${bookingId}`)
}

export type CreateBookingInput = {
  guestId?: string
  guestEmail?: string
  guestFirstName?: string
  guestLastName?: string
  guestPhone?: string
  roomTypeId: string
  ratePlanId?: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  channel: "DIRECT" | "PHONE" | "WALK_IN" | "OTA" | "KIOSK"
  specialRequests?: string
}

export async function createBookingAction(input: CreateBookingInput): Promise<{ id: string }> {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")

  let guestId = input.guestId

  // Create guest inline if not selected from search
  if (!guestId) {
    if (!input.guestEmail || !input.guestFirstName || !input.guestLastName) {
      throw new Error("Guest information required")
    }
    const guest = await caller.guest.findOrCreate({
      email: input.guestEmail,
      firstName: input.guestFirstName,
      lastName: input.guestLastName,
      phone: input.guestPhone,
    })
    guestId = guest.id
  }

  const booking = await caller.booking.create({
    guestId,
    roomTypeId: input.roomTypeId,
    ratePlanId: input.ratePlanId,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    adults: input.adults,
    children: input.children,
    channel: input.channel,
    specialRequests: input.specialRequests,
  })

  return { id: booking.id }
}
