// Server-side Socket.io emit helper for API routes
// Used to broadcast realtime events to connected clients
import type { RoomStatusChangedEvent, CallForHelpEvent } from "@hotel/types"

export function emitRoomStatusChanged(event: RoomStatusChangedEvent) {
  const io = (global as any).staffIO
  if (!io) {
    console.warn("[Socket.io] Not initialized — event not emitted")
    return
  }
  io.to(`property:${event.propertyId}`).emit("room:statusChanged", event)
}

export function emitCallForHelp(event: CallForHelpEvent) {
  const io = (global as any).staffIO
  if (!io) return
  io.to(`property:${event.propertyId}`).emit("alert:callForHelp", event)
}
