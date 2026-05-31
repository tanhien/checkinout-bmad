// Client-side Socket.io helper for dashboard realtime updates
import io from "socket.io-client"
import type { RoomStatusChangedEvent } from "@hotel/types"

export function createStaffSocket() {
  return io("/staff", {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })
}

export function subscribeToRoom(socket: ReturnType<typeof createStaffSocket>, propertyId: string) {
  socket.emit("join", { room: `property:${propertyId}` })
}

export function onRoomStatusChanged(
  socket: ReturnType<typeof createStaffSocket>,
  callback: (event: RoomStatusChangedEvent) => void
) {
  socket.on("room:statusChanged", callback)
}
