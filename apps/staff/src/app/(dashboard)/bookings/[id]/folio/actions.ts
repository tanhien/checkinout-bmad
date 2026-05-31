"use server"

import { getServerCaller } from "@/lib/trpc-caller"
import { revalidatePath } from "next/cache"

async function getCaller(bookingId: string) {
  const caller = await getServerCaller()
  if (!caller) throw new Error("Unauthorized")
  // revalidate after each action
  void bookingId
  return caller
}

export async function addChargeAction(
  bookingId: string,
  folioId: string,
  data: {
    serviceId?: string
    description: string
    quantity: number
    unitPrice: number
    chargeDate: string
  },
): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.addServiceCharge({ folioId, ...data })
  revalidatePath(`/bookings/${bookingId}/folio`)
}

export async function voidItemAction(
  bookingId: string,
  folioItemId: string,
  reason: string,
): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.voidItem({ folioItemId, reason })
  revalidatePath(`/bookings/${bookingId}/folio`)
}

export async function addPaymentAction(
  bookingId: string,
  folioId: string,
  data: {
    method: "CASH" | "CARD" | "BANK_TRANSFER" | "DEMO" | "OTHER"
    amount: number
    reference?: string
  },
): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.addPayment({ folioId, ...data })
  revalidatePath(`/bookings/${bookingId}/folio`)
}

export async function settleFolioAction(bookingId: string, folioId: string): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.settle({ folioId })
  revalidatePath(`/bookings/${bookingId}/folio`)
}

export async function reopenFolioAction(
  bookingId: string,
  folioId: string,
  reason: string,
): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.reopen({ folioId, reason })
  revalidatePath(`/bookings/${bookingId}/folio`)
}

export async function addDiscountAction(
  bookingId: string,
  folioId: string,
  data: {
    type: "PERCENTAGE" | "FIXED_AMOUNT"
    value: number
    reason: string
  },
): Promise<void> {
  const caller = await getCaller(bookingId)
  await caller.folio.addDiscount({ folioId, ...data })
  revalidatePath(`/bookings/${bookingId}/folio`)
}
