import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import type { RoomCard } from "./_components/types"
import { RoomGrid } from "./_components/RoomGrid"

const STATUS_SUMMARY_LABEL: Record<string, string> = {
  OCCUPIED: "Có khách",
  CLEAN: "Sạch",
  INSPECTED: "Đã kiểm",
  DIRTY: "Cần dọn",
  CLEANING: "Đang dọn",
  MAINTENANCE: "Bảo trì",
  RESERVED: "Đã đặt",
}

const STATUS_SUMMARY_COLOR: Record<string, string> = {
  OCCUPIED: "bg-gray-100 text-gray-700",
  CLEAN: "bg-green-100 text-green-700",
  INSPECTED: "bg-green-100 text-green-700",
  DIRTY: "bg-red-100 text-red-700",
  CLEANING: "bg-purple-100 text-purple-700",
  MAINTENANCE: "bg-orange-100 text-orange-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
}

export default async function RoomsPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const rawRooms = await caller.room.listForView()

  const rooms: RoomCard[] = rawRooms.map((r) => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    status: r.status,
    maintenanceNote: r.maintenanceNote,
    maintenanceDue: r.maintenanceDue?.toISOString() ?? null,
    roomType: { id: r.roomType.id, name: r.roomType.name },
    currentBooking: r.bookingRooms[0]
      ? {
          id: r.bookingRooms[0].booking.id,
          confirmationCode: r.bookingRooms[0].booking.confirmationCode,
          status: r.bookingRooms[0].booking.status,
          checkInDate: r.bookingRooms[0].booking.checkInDate.toISOString(),
          checkOutDate: r.bookingRooms[0].booking.checkOutDate.toISOString(),
          guest: {
            id: r.bookingRooms[0].booking.guest.id,
            firstName: r.bookingRooms[0].booking.guest.firstName,
            lastName: r.bookingRooms[0].booking.guest.lastName,
          },
        }
      : null,
  }))

  // Status summary counts
  const byStatus: Record<string, number> = {}
  for (const r of rooms) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1
  }

  const summaryOrder = ["OCCUPIED", "RESERVED", "CLEAN", "INSPECTED", "DIRTY", "CLEANING", "MAINTENANCE"]

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý phòng</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rooms.length} phòng</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summaryOrder
            .filter((s) => byStatus[s])
            .map((s) => (
              <span
                key={s}
                className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_SUMMARY_COLOR[s] ?? "bg-gray-100 text-gray-700"}`}
              >
                {byStatus[s]} {STATUS_SUMMARY_LABEL[s]}
              </span>
            ))}
        </div>
      </div>

      {/* Grid + panel */}
      <RoomGrid rooms={rooms} propertyId={session.propertyId} />
    </div>
  )
}
