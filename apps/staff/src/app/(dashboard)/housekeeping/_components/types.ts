export type HousekeepingRoom = {
  id: string
  number: string
  floor: number
  status: string
  cleaningStartAt: string | null
  assignedTo: { id: string; firstName: string; lastName: string } | null
  roomType: { id: string; name: string }
  upcomingCheckIn: string | null
}

export type HousekeepingStaff = {
  id: string
  firstName: string
  lastName: string
}
