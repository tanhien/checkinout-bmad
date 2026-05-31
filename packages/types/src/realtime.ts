// WebSocket event types — shared across staff and kiosk apps

export type RoomStatusChangedEvent = {
  roomId: string
  roomNumber: string
  newStatus: string
  oldStatus?: string
  propertyId: string
  timestamp: number
}

export type CallForHelpEvent = {
  kioskId: string
  propertyId: string
  timestamp: number
}

export type StaffAlertEvent = {
  type: "call_for_help" | "room_dirty_before_checkin" | "late_checkout"
  kioskId?: string
  roomNumber?: string
  message: string
  timestamp: number
}
