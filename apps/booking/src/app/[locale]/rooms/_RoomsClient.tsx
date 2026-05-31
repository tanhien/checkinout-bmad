"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTranslations } from "next-intl"

type Room = {
  id: string
  slug: string
  name: string
  description: string | null
  areaM2: number | null
  maxAdults: number
  maxChildren: number
  bedType: string
  photoUrls: string[]
  basePrice: number
  isFeatured: boolean
  amenities: Array<{ id: string; name: string; icon?: string | null }>
  available: number | null
  meetsCapacity: boolean
  pricing: { total: number; nights: number } | null
}

const BED_LABELS: Record<string, string> = {
  SINGLE: "1 giường đơn",
  DOUBLE: "1 giường đôi",
  TWIN: "2 giường đơn",
  KING: "1 giường King",
  QUEEN: "1 giường Queen",
  BUNK: "Giường tầng",
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + " VNĐ"
}

export function RoomsClient({
  rooms,
  locale,
  checkin,
  checkout,
  adults,
  children,
  initialSort,
}: {
  rooms: Room[]
  locale: string
  checkin?: string
  checkout?: string
  adults: number
  children: number
  initialSort: string
}) {
  const t = useTranslations()
  const [sort, setSort] = useState(initialSort)
  const [photoIdx, setPhotoIdx] = useState<Record<string, number>>({})

  const sorted = useMemo(() => {
    const clone = [...rooms]
    if (sort === "price_asc") clone.sort((a, b) => a.basePrice - b.basePrice)
    else if (sort === "price_desc") clone.sort((a, b) => b.basePrice - a.basePrice)
    else if (sort === "area") clone.sort((a, b) => (b.areaM2 ?? 0) - (a.areaM2 ?? 0))
    return clone
  }, [rooms, sort])

  const hasDateRange = checkin && checkout

  function bookHref(roomId: string) {
    const params = new URLSearchParams({ roomTypeId: roomId })
    if (checkin) params.set("checkin", checkin)
    if (checkout) params.set("checkout", checkout)
    params.set("adults", String(adults))
    params.set("children", String(children))
    return `/${locale}/book?${params}`
  }

  return (
    <div>
      {/* Sort bar */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-gray-500">{rooms.length} phòng</span>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600">Sắp xếp:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="price_asc">{t("rooms.sort.price_asc")}</option>
            <option value="price_desc">{t("rooms.sort.price_desc")}</option>
            <option value="area">{t("rooms.sort.area")}</option>
          </select>
        </div>
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-16">{t("rooms.no_results")}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sorted.map((room) => {
          const isUnavailable = room.available !== null && room.available === 0
          const idx = photoIdx[room.id] ?? 0

          return (
            <div
              key={room.id}
              className={`rounded-2xl overflow-hidden bg-white shadow-sm ring-1 transition-all ${isUnavailable ? "opacity-60 ring-gray-200" : "ring-gray-200 hover:ring-blue-400 hover:shadow-md"}`}
            >
              {/* Photo slideshow */}
              <div className="relative h-48 bg-gray-100 group">
                {room.photoUrls.length > 0 ? (
                  <>
                    <Image
                      src={room.photoUrls[idx]!}
                      alt={room.name}
                      fill
                      className="object-cover"
                    />
                    {room.photoUrls.length > 1 && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="rounded-full bg-black/40 text-white w-7 h-7 text-xs flex items-center justify-center"
                          onClick={() => setPhotoIdx((p) => ({ ...p, [room.id]: (idx - 1 + room.photoUrls.length) % room.photoUrls.length }))}
                        >‹</button>
                        <button
                          className="rounded-full bg-black/40 text-white w-7 h-7 text-xs flex items-center justify-center"
                          onClick={() => setPhotoIdx((p) => ({ ...p, [room.id]: (idx + 1) % room.photoUrls.length }))}
                        >›</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {isUnavailable && (
                  <div className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-xs px-2 py-0.5 font-medium">
                    {t("rooms.unavailable")}
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-base mb-1">{room.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 mb-3">
                  {room.areaM2 && <span>{room.areaM2} {t("rooms.area")}</span>}
                  <span>{BED_LABELS[room.bedType] ?? room.bedType}</span>
                  <span>{room.maxAdults} người lớn</span>
                </div>

                {/* Amenities */}
                {room.amenities.slice(0, 4).map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 text-xs text-gray-500 mr-2 mb-1">
                    {a.icon && <span>{a.icon}</span>}
                    {a.name}
                  </span>
                ))}

                <div className="flex items-center justify-between mt-4">
                  <div>
                    {hasDateRange && room.pricing ? (
                      <>
                        <p className="font-bold text-blue-700 text-lg">{formatVND(room.pricing.total)}</p>
                        <p className="text-xs text-gray-500">{room.pricing.nights} {t("common.nights")}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-blue-700 text-lg">{formatVND(room.basePrice)}</p>
                        <p className="text-xs text-gray-500">{t("common.per_night")}</p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <Link
                      href={`/${locale}/rooms/${room.slug}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {t("common.view_details")}
                    </Link>
                    {!isUnavailable && (
                      <Link
                        href={bookHref(room.id)}
                        className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
                      >
                        {t("rooms.select")}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
