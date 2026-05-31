export type RoomCard = {
  id: string
  number: string
  floor: number
  status: string
  maintenanceNote: string | null
  maintenanceDue: string | null
  roomType: { id: string; name: string }
  currentBooking: {
    id: string
    confirmationCode: string
    status: string
    checkInDate: string
    checkOutDate: string
    guest: { id: string; firstName: string; lastName: string }
  } | null
}
