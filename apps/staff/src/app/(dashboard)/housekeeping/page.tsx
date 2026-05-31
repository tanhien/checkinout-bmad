import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { HousekeepingBoard } from "./_components/HousekeepingBoard"
import type { HousekeepingRoom, HousekeepingStaff } from "./_components/types"

export default async function HousekeepingPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const canAssign = ["MANAGER", "ADMIN", "FRONT_DESK"].includes(session.role)
  const isManager = ["MANAGER", "ADMIN"].includes(session.role)

  const [{ rooms, checkInHour }, housekeepingStaff] = await Promise.all([
    caller.room.listForHousekeeping(),
    canAssign ? caller.staff.listHousekeepingStaff() : Promise.resolve([]),
  ])

  const serializedRooms: HousekeepingRoom[] = rooms.map((r) => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    status: r.status as string,
    cleaningStartAt: r.cleaningStartAt?.toISOString() ?? null,
    assignedTo: r.assignedTo
      ? {
          id: r.assignedTo.id,
          firstName: r.assignedTo.firstName,
          lastName: r.assignedTo.lastName,
        }
      : null,
    roomType: { id: r.roomType.id, name: r.roomType.name },
    upcomingCheckIn: r.bookingRooms[0]?.booking.checkInDate.toISOString() ?? null,
  }))

  const serializedStaff: HousekeepingStaff[] = housekeepingStaff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
  }))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Housekeeping</h1>
          <p className="text-xs text-gray-500">{rooms.length} phòng cần xử lý</p>
        </div>
      </div>

      {/* Board */}
      <HousekeepingBoard
        rooms={serializedRooms}
        checkInHour={checkInHour}
        housekeepingStaff={serializedStaff}
        propertyId={session.propertyId}
        canAssign={canAssign}
        isManager={isManager}
      />
    </div>
  )
}
