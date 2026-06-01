import { redirect } from "next/navigation"
import Link from "next/link"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { SingleDatePicker } from "../_components/SingleDatePicker"

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Đã đặt",
  CHECKED_IN: "Đang ở",
  CHECKED_OUT: "Đã trả phòng",
}

type BookingRow = {
  id: string
  confirmationCode: string
  status: string
  guest: { firstName: string; lastName: string; email: string; phone: string | null }
  roomType: string
  roomNumber: string | null
  checkInDate: string
  checkOutDate: string
  totalNights: number
}

function BookingTable({ rows, emptyMsg }: { rows: BookingRow[]; emptyMsg: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center text-sm text-gray-400 shadow-sm ring-1 ring-gray-200">
        {emptyMsg}
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Mã", "Khách", "Loại phòng", "Phòng", "Check-in", "Check-out", "Trạng thái"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <Link
                    href={`/bookings/${b.id}` as Parameters<typeof Link>[0]["href"]}
                    className="font-mono text-xs text-blue-600 hover:underline"
                  >
                    {b.confirmationCode}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-gray-900">
                  <p className="font-medium">
                    {b.guest.firstName} {b.guest.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{b.guest.phone ?? b.guest.email}</p>
                </td>
                <td className="px-4 py-2.5 text-gray-700">{b.roomType}</td>
                <td className="px-4 py-2.5 text-gray-700">{b.roomNumber ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{b.checkInDate}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{b.checkOutDate}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[b.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function ArrivalsDeparturesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getStaffSession()
  if (!session) redirect("/login")
  if (
    !["ADMIN", "MANAGER", "ACCOUNTANT", "FRONT_DESK"].includes(session.role)
  )
    redirect("/unauthorized")

  const sp = await searchParams
  const get = (k: string): string =>
    (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined)) ?? ""

  const today = new Date().toISOString().slice(0, 10)
  const date = get("date") || today

  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const data = await caller.report.getArrivalsAndDepartures({ date })

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SingleDatePicker initialDate={date} />
        <a
          href={`/api/reports/arrivals-departures?date=${date}`}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Xuất CSV
        </a>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Arrivals — {data.arrivals.length} khách
        </h2>
        <BookingTable
          rows={data.arrivals}
          emptyMsg="Không có khách check-in ngày này"
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">
          Departures — {data.departures.length} khách
        </h2>
        <BookingTable
          rows={data.departures}
          emptyMsg="Không có khách check-out ngày này"
        />
      </section>
    </div>
  )
}
