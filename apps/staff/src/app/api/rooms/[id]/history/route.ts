import type { NextRequest } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id: roomId } = await context.params
  const caller = await getServerCaller()
  if (!caller) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const history = await caller.room.getHistory({ roomId })
    return Response.json(
      history.map((h) => ({
        id: h.id,
        oldStatus: h.oldStatus,
        newStatus: h.newStatus,
        note: h.note,
        createdAt: h.createdAt.toISOString(),
        staff: h.staff
          ? { firstName: h.staff.firstName, lastName: h.staff.lastName, role: h.staff.role }
          : null,
      })),
    )
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 })
  }
}
