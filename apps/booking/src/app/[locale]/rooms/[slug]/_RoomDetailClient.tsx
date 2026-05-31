"use client"

import { useState } from "react"
import Image from "next/image"

export function RoomDetailClient({ photoUrls, roomName }: { photoUrls: string[]; roomName: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (photoUrls.length === 0) {
    return (
      <div className="h-72 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-300">
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      {/* Main photo */}
      <div
        className="relative h-72 md:h-96 rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={photoUrls[activeIdx]!}
          alt={roomName}
          fill
          className="object-cover"
          priority={activeIdx === 0}
        />
        {photoUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
            {activeIdx + 1} / {photoUrls.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {photoUrls.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {photoUrls.slice(0, 20).map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden ring-2 transition-all ${i === activeIdx ? "ring-blue-500" : "ring-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={url} alt="" fill className="object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setLightboxOpen(false)}>×</button>
          <button
            className="absolute left-4 text-white text-4xl px-4"
            onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i - 1 + photoUrls.length) % photoUrls.length) }}
          >‹</button>
          <div className="relative w-full max-w-3xl h-[70vh]" onClick={(e) => e.stopPropagation()}>
            <Image src={photoUrls[activeIdx]!} alt={roomName} fill className="object-contain" />
          </div>
          <button
            className="absolute right-4 text-white text-4xl px-4"
            onClick={(e) => { e.stopPropagation(); setActiveIdx((i) => (i + 1) % photoUrls.length) }}
          >›</button>
        </div>
      )}
    </>
  )
}
