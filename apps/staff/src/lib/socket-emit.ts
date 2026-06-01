// Server-side Socket.io emit helper for API routes
// Used to broadcast realtime events to connected clients
import type { RoomStatusChangedEvent, CallForHelpEvent } from "@hotel/types"

type StaffIO = {
  to(room: string): { emit(event: string, data: unknown): void }
}

declare global {
  var staffIO: StaffIO | undefined
}

export function emitRoomStatusChanged(event: RoomStatusChangedEvent) {
  if (!global.staffIO) {
    console.warn("[Socket.io] Not initialized — event not emitted")
    return
  }
  global.staffIO.to(`property:${event.propertyId}`).emit("room:statusChanged", event)
}

export function emitCallForHelp(event: CallForHelpEvent) {
  if (!global.staffIO) return
  global.staffIO.to(`property:${event.propertyId}`).emit("alert:callForHelp", event)
}
