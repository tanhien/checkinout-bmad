import { NextRequest, NextResponse } from "next/server"
import { getStaffSession } from "@/lib/auth"
import { getServerCaller } from "@/lib/trpc-caller"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoiceDocument } from "@/lib/invoice-pdf"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
): Promise<NextResponse> {
  const session = await getStaffSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const caller = await getServerCaller()
  if (!caller) return new NextResponse("Server error", { status: 500 })

  const { bookingId } = await params

  // Fetch all required data
  const [property, folio] = await Promise.all([
    caller.property.getConfig(),
    caller.folio.getByBooking({ bookingId }),
  ]).catch(() => [null, null])

  if (!property || !folio) {
    return new NextResponse("Not found", { status: 404 })
  }

  const pdfBuffer = await renderToBuffer(
    InvoiceDocument({ property, folio }),
  )

  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${folio.booking.confirmationCode}.pdf"`,
    },
  })
}
