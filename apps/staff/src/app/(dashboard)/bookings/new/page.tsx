import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { BookingCreateForm } from "./_components/BookingCreateForm"

export default async function NewBookingPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  // roomType.list: staffProcedure — all roles can see
  // ratePlan.list: managerProcedure — only MANAGER/ADMIN
  const isManager = session.role === "MANAGER" || session.role === "ADMIN"

  const [roomTypes, ratePlans] = await Promise.all([
    caller.roomType.list(),
    isManager ? caller.ratePlan.list() : Promise.resolve([]),
  ])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={"/bookings" as Parameters<typeof Link>[0]["href"]}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Danh sách đặt phòng
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">Tạo booking mới</h1>
      </div>

      <BookingCreateForm
        roomTypes={roomTypes.map((rt) => ({
          id: rt.id,
          name: rt.name,
          basePrice: Number(rt.basePrice),
        }))}
        ratePlans={ratePlans.map((rp) => ({
          id: rp.id,
          name: rp.name,
          isNonRefundable: rp.isNonRefundable,
        }))}
      />
    </div>
  )
}
