"use client"

import { useRef, useState, useTransition } from "react"

type Props = {
  roomTypeId: string
  photoUrls: string[]
  onPhotosChanged: (urls: string[]) => void
}

export function PhotoManager({ roomTypeId, photoUrls, onPhotosChanged }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setError(null)
    setUploading(true)

    const newUrls: string[] = []
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} vượt quá 10 MB`); continue
      }
      const fd = new FormData()
      fd.append("file", file)
      fd.append("roomTypeId", roomTypeId)
      try {
        const res = await fetch("/api/upload/room-photo", { method: "POST", body: fd })
        if (!res.ok) { const d = await res.json() as { error?: string }; setError(d.error ?? "Upload thất bại"); continue }
        const { url } = await res.json() as { url: string }
        newUrls.push(url)
      } catch {
        setError("Lỗi kết nối")
      }
    }

    if (newUrls.length) {
      const updated = [...photoUrls, ...newUrls]
      onPhotosChanged(updated)
      // Persist to DB
      startTransition(async () => {
        await fetch("/api/upload/update-photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomTypeId, photoUrls: updated }),
        })
      })
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  function handleRemove(url: string) {
    const updated = photoUrls.filter((u) => u !== url)
    onPhotosChanged(updated)
    startTransition(async () => {
      await fetch("/api/upload/update-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomTypeId, photoUrls: updated }),
      })
    })
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return
    const updated = [...photoUrls]
    ;[updated[idx - 1], updated[idx]] = [updated[idx]!, updated[idx - 1]!]
    onPhotosChanged(updated)
    startTransition(async () => {
      await fetch("/api/upload/update-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomTypeId, photoUrls: updated }),
      })
    })
  }

  return (
    <div className="mt-2 space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* Photo thumbnails */}
      {photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photoUrls.map((url, idx) => (
            <div key={url} className="group relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                {idx > 0 && (
                  <button
                    onClick={() => handleMoveUp(idx)}
                    className="rounded bg-white/80 text-gray-800 px-1 text-xs font-bold"
                    title="Di chuyển lên"
                  >←</button>
                )}
                <button
                  onClick={() => handleRemove(url)}
                  className="rounded bg-red-600 text-white px-1 text-xs font-bold"
                  title="Xóa ảnh"
                >✕</button>
              </div>
              {idx === 0 && (
                <span className="absolute top-0.5 left-0.5 rounded text-[9px] font-medium bg-blue-600 text-white px-1">Chính</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || isPending}
          className="rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Đang tải lên..." : "+ Thêm ảnh (tối đa 10 MB/ảnh)"}
        </button>
      </div>
    </div>
  )
}
