import { redirect } from "next/navigation"
import { db } from "@hotel/db"
import { getStaffSession } from "@/lib/auth"
import { AppShell } from "./_components/AppShell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  // Fetch staff display name — staffId is in JWT, name is not
  const staff = await db.staff.findUnique({
    where: { id: session.staffId },
    select: { firstName: true, lastName: true },
  })

  const staffName = staff ? `${staff.firstName} ${staff.lastName}` : session.staffId

  return (
    <AppShell role={session.role} staffName={staffName}>
      {children}
    </AppShell>
  )
}
