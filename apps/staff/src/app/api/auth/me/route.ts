import { NextRequest, NextResponse } from "next/server"
import { db } from "@hotel/db"
import { withStaffAuth } from "@/lib/auth"
import type { StaffSession } from "@/lib/auth"

export const GET = withStaffAuth(async (_req: NextRequest, session: StaffSession) => {
  const staff = await db.staff.findUnique({
    where: { id: session.staffId, isActive: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      propertyId: true,
      language: true,
      lastLoginAt: true,
    },
  })

  if (!staff) {
    return NextResponse.json({ error: "Staff not found" }, { status: 404 })
  }

  return NextResponse.json(staff)
})
