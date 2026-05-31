import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { StaffClient } from "./_components/StaffClient"

export default async function StaffSettingsPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const staffList = await caller.staff.list()

  const serialized = staffList.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    role: s.role,
    isActive: s.isActive,
    lastLoginAt: s.lastLoginAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }))

  return <StaffClient staffList={serialized} currentStaffId={session.staffId} />
}
