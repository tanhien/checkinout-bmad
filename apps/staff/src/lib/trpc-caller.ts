// Server-side tRPC caller for use in Server Components and Server Actions.
// Bypasses HTTP entirely — calls procedures directly (type-safe, no fetch overhead).
import { createCaller } from "@hotel/api"
import { db } from "@hotel/db"
import { getStaffSession } from "@/lib/auth"

export async function getServerCaller() {
  const session = await getStaffSession()
  if (!session) return null

  return createCaller({
    db,
    redis: null,
    auth: {
      type: "staff",
      staffId: session.staffId,
      role: session.role,
      propertyId: session.propertyId,
    },
    propertyId: session.propertyId,
  })
}
