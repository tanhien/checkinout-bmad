"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

export type ContentLocale = "vi" | "en"

export async function updateContentAction(
  locale: ContentLocale,
  content: Record<string, unknown>,
) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.property.updateContent({ locale, content })
    revalidatePath("/settings/content")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
