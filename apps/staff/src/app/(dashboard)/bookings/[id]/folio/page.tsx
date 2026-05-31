import Link from "next/link"
import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { FolioManager } from "./_components/FolioManager"

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(String(v ?? 0))
}

export default async function FolioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  const { id: bookingId } = await params
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const [folio, services] = await Promise.all([
    caller.folio.getByBooking({ bookingId }),
    caller.service.list(),
  ])

  const isManager = ["MANAGER", "ADMIN"].includes(session.role)

  // Serialize for client — convert Decimal + Date to primitives
  const serializedFolio = {
    id: folio.id,
    bookingId: folio.bookingId,
    status: folio.status as string,
    chargesTotal: folio.chargesTotal,
    paymentsTotal: folio.paymentsTotal,
    balance: folio.balance,
    booking: {
      id: folio.booking.id,
      confirmationCode: folio.booking.confirmationCode,
      status: folio.booking.status,
      checkInDate: folio.booking.checkInDate.toISOString(),
      checkOutDate: folio.booking.checkOutDate.toISOString(),
      guest: folio.booking.guest,
    },
    items: folio.items.map((i) => ({
      id: i.id,
      type: i.type as string,
      description: i.description,
      quantity: toNum(i.quantity),
      unitPrice: toNum(i.unitPrice),
      amount: toNum(i.amount),
      chargeDate: i.chargeDate.toISOString(),
      isVoided: i.isVoided,
      voidReason: i.voidReason,
    })),
    payments: folio.payments.map((p) => ({
      id: p.id,
      method: p.method as string,
      amount: toNum(p.amount),
      reference: p.reference,
      createdAt: p.createdAt.toISOString(),
    })),
  }

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category as string,
    unit: s.unit,
    price: toNum(s.price),
  }))

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/bookings" className="hover:text-gray-700">
          Đặt phòng
        </Link>
        <span>/</span>
        <Link href={`/bookings/${bookingId}` as `/bookings/${string}`} className="hover:text-gray-700">
          {folio.booking.confirmationCode}
        </Link>
        <span>/</span>
        <span className="text-gray-700">Folio</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Folio & Thanh toán</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {folio.booking.guest.firstName} {folio.booking.guest.lastName} ·{" "}
            <span className="font-mono">{folio.booking.confirmationCode}</span>
          </p>
        </div>
        {/* PDF download button */}
        <a
          href={`/api/bookings/${bookingId}/invoice`}
          download={`invoice-${folio.booking.confirmationCode}.pdf`}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          📄 Tải hóa đơn PDF
        </a>
      </div>

      {/* Interactive folio manager */}
      <FolioManager
        folio={serializedFolio}
        services={serializedServices}
        bookingId={bookingId}
        isManager={isManager}
      />
    </div>
  )
}
