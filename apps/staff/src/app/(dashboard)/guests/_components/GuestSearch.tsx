"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

export function GuestSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter()
  const [value, setValue] = useState(initialQuery)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(q: string) {
    setValue(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (q.length === 0) {
        router.push("/guests")
      } else if (q.length >= 2) {
        router.push(`/guests?q=${encodeURIComponent(q)}` as `/guests?${string}`)
      }
    }, 300)
  }

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
      <input
        type="text"
        placeholder="Tìm tên, email, số điện thoại... (ít nhất 2 ký tự)"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        autoFocus
        className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}
