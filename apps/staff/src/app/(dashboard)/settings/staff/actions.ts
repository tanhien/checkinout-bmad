"use server"

import { revalidatePath } from "next/cache"
import { getServerCaller } from "@/lib/trpc-caller"

type StaffRole = "ADMIN" | "MANAGER" | "FRONT_DESK" | "HOUSEKEEPING" | "ACCOUNTANT"

export async function createStaffAction(formData: FormData) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }

  try {
    const staff = await caller.staff.create({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as StaffRole,
      // No password supplied — system generates onboarding token and sends welcome email
    })
    revalidatePath("/settings/staff")
    return { success: true, staffId: staff.id, emailSent: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function updateStaffRoleAction(id: string, role: StaffRole) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.staff.updateRole({ id, role })
    revalidatePath("/settings/staff")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}

export async function toggleStaffActiveAction(id: string) {
  const caller = await getServerCaller()
  if (!caller) return { error: "Chưa đăng nhập" }
  try {
    await caller.staff.deactivate({ id })
    revalidatePath("/settings/staff")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Lỗi không xác định" }
  }
}
