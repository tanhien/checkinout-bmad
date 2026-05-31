import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { RoomsClient } from "./_components/RoomsClient"

export default async function RoomsSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [rooms, roomTypes] = await Promise.all([
    caller.room.list({ isActive: undefined }),
    caller.roomType.list({ includeInactive: false }),
  ])

  const serializedRooms = rooms.map((r) => ({
    id: r.id,
    number: r.number,
    floor: r.floor,
    status: r.status,
    isActive: r.isActive,
    roomType: { id: r.roomType.id, name: r.roomType.name },
  }))

  const serializedTypes = roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))

  return <RoomsClient rooms={serializedRooms} roomTypes={serializedTypes} />
}
