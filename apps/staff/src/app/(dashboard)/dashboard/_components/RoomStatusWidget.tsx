"use client"

import { useEffect, useRef, useState } from "react"
import { createStaffSocket } from "@/lib/socket"
import type { RoomStatusChangedEvent } from "@hotel/types"

type RoomStatus = "CLEAN" | "DIRTY" | "CLEANING" | "INSPECTED" | "OCCUPIED" | "MAINTENANCE" | "RESERVED"

type RoomCounts = {
  occupied: number
  cleanAvailable: number
  dirty: number
  maintenance: number
  cleaning: number
  total: number
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-sm font-medium opacity-80">{label}</p>
    </div>
  )
}

export function RoomStatusWidget({
  initialCounts,
  propertyId,
}: {
  initialCounts: RoomCounts
  propertyId: string
}) {
  const [counts, setCounts] = useState(initialCounts)

  // Keep counts in sync when server re-fetches (router.refresh)
  useEffect(() => {
    setCounts(initialCounts)
  }, [initialCounts])

  // WebSocket: room:statusChanged → update counts immediately
  useEffect(() => {
    const socket = createStaffSocket()

    socket.on("room:statusChanged", (evt: RoomStatusChangedEvent) => {
      if (evt.propertyId !== propertyId) return
      const oldStatus = evt.oldStatus as RoomStatus | undefined
      const newStatus = evt.newStatus as RoomStatus

      setCounts((prev) => {
        const next = { ...prev }

        // Decrement old bucket
        if (oldStatus) {
          if (oldStatus === "OCCUPIED") next.occupied = Math.max(0, next.occupied - 1)
          else if (oldStatus === "CLEAN" || oldStatus === "INSPECTED") next.cleanAvailable = Math.max(0, next.cleanAvailable - 1)
          else if (oldStatus === "DIRTY") next.dirty = Math.max(0, next.dirty - 1)
          else if (oldStatus === "MAINTENANCE") next.maintenance = Math.max(0, next.maintenance - 1)
          else if (oldStatus === "CLEANING") next.cleaning = Math.max(0, next.cleaning - 1)
        }

        // Increment new bucket
        if (newStatus === "OCCUPIED") next.occupied += 1
        else if (newStatus === "CLEAN" || newStatus === "INSPECTED") next.cleanAvailable += 1
        else if (newStatus === "DIRTY") next.dirty += 1
        else if (newStatus === "MAINTENANCE") next.maintenance += 1
        else if (newStatus === "CLEANING") next.cleaning += 1

        return next
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [propertyId])

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Tình trạng phòng</h2>
      <div className="grid grid-cols-2 gap-3">
        {/* NFR-S-07 colours: gray=occupied, green=clean, red=dirty, orange=maintenance, purple=cleaning */}
        <StatBox label="Đang có khách" value={counts.occupied} color="bg-gray-100 text-gray-800" />
        <StatBox label="Sẵn sàng (sạch)" value={counts.cleanAvailable} color="bg-green-100 text-green-800" />
        <StatBox label="Cần dọn" value={counts.dirty} color="bg-red-100 text-red-800" />
        <StatBox label="Bảo trì" value={counts.maintenance} color="bg-orange-100 text-orange-800" />
      </div>
      {counts.cleaning > 0 && (
        <div className="mt-3">
          <StatBox label="Đang dọn" value={counts.cleaning} color="bg-purple-100 text-purple-800" />
        </div>
      )}
    </div>
  )
}
