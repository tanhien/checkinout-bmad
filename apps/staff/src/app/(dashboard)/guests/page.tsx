import Link from "next/link"
import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { GuestSearch } from "./_components/GuestSearch"

const TAG_BADGE: Record<string, string> = {
  VIP:       "bg-yellow-100 text-yellow-800",
  BLACKLIST: "bg-red-100 text-red-800",
  CORPORATE: "bg-blue-100 text-blue-800",
  REGULAR:   "bg-gray-100 text-gray-600",
}
const TAG_LABEL: Record<string, string> = {
  VIP: "VIP", BLACKLIST: "Blacklist", CORPORATE: "Corporate", REGULAR: "Thường",
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-green-500", "bg-amber-500",
  "bg-pink-500",  "bg-teal-500",  "bg-indigo-500", "bg-rose-500",
]

function avatarBg(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = ((h * 31) + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!
}

function initials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? "") + (lastName[0] ?? "")).toUpperCase()
}

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q.trim() : ""

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  let guests: Awaited<ReturnType<typeof caller.guest.search>> = []
  if (q.length >= 2) {
    guests = await caller.guest.search({ query: q })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900">Khách hàng</h1>

      {/* Search bar */}
      <GuestSearch initialQuery={q} />

      {/* Hint */}
      {q.length > 0 && q.length < 2 && (
        <p className="text-sm text-gray-400 text-center py-4">Nhập ít nhất 2 ký tự để tìm kiếm</p>
      )}

      {/* No results */}
      {q.length >= 2 && guests.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          Không tìm thấy khách hàng nào với từ khóa &ldquo;{q}&rdquo;
        </p>
      )}

      {/* Results */}
      {guests.length > 0 && (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-200 divide-y divide-gray-100">
          <p className="px-4 py-2.5 text-xs text-gray-400">
            {guests.length} kết quả
          </p>
          {guests.map((g) => {
            const name = `${g.firstName} ${g.lastName}`
            const bg = avatarBg(g.id)
            return (
              <Link
                key={g.id}
                href={`/guests/${g.id}` as `/guests/${string}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${bg}`}
                >
                  {initials(g.firstName, g.lastName)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{name}</span>
                    {g.tag !== "REGULAR" && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${TAG_BADGE[g.tag] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {TAG_LABEL[g.tag] ?? g.tag}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-gray-500">{g.email}</p>
                  {g.phone && <p className="text-xs text-gray-400">{g.phone}</p>}
                </div>

                {/* Stays count */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-700">{g._count.bookings}</p>
                  <p className="text-xs text-gray-400">lần ở</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Empty state when no search */}
      {q.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm text-gray-400">Nhập tên, email hoặc số điện thoại để tìm khách hàng</p>
        </div>
      )}
    </div>
  )
}
