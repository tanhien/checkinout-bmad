// Force Node.js runtime — @react-pdf/renderer requires Node APIs
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

import type { NextRequest } from "next/server"
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { createElement } from "react"
import { getServerCaller } from "@/lib/trpc-caller"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  if (typeof v === "number") return v
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber()
  }
  return Number(String(v ?? 0))
}

function fmtVnd(n: number): string {
  return n.toLocaleString("vi-VN") + " d"
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page:      { fontSize: 10, fontFamily: "Helvetica", padding: 40, color: "#1a1a1a" },
  header:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  title:     { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#1a1a1a", marginBottom: 4 },
  label:     { fontSize: 8, color: "#666", marginBottom: 4 },
  bold:      { fontFamily: "Helvetica-Bold" },
  section:   { marginBottom: 18 },
  row:       { flexDirection: "row", borderBottom: "1px solid #f0f0f0", paddingVertical: 5 },
  rowHeader: { flexDirection: "row", borderBottom: "1.5px solid #ddd", paddingVertical: 5, fontFamily: "Helvetica-Bold" },
  col1:      { flex: 3 },
  col2:      { flex: 1, textAlign: "right" },
  col3:      { flex: 1, textAlign: "right" },
  col4:      { flex: 1, textAlign: "right" },
  totalRow:  { flexDirection: "row", paddingVertical: 5, borderTop: "1.5px solid #ddd", marginTop: 2 },
  balanceBox: { backgroundColor: "#f0fdf4", padding: 8, borderRadius: 4, marginTop: 6 },
  divider:   { borderBottom: "1px solid #e5e5e5", marginVertical: 10 },
  grayText:  { color: "#666" },
  redText:   { color: "#dc2626" },
  greenText: { color: "#16a34a" },
  voided:    { color: "#aaa", textDecoration: "line-through" },
})

// ─── Invoice data type ────────────────────────────────────────────────────────

interface InvoiceData {
  confirmationCode: string
  checkInDate: string
  checkOutDate: string
  totalNights: number
  guest: { firstName: string; lastName: string; email: string }
  roomTypeName: string
  propertyName: string
  propertyAddress: string | null | undefined
  items: Array<{
    type: string
    description: string
    quantity: number
    unitPrice: number
    amount: number
    isVoided: boolean
  }>
  payments: Array<{ method: string; amount: number; reference: string | null }>
  chargesTotal: number
  paymentsTotal: number
  balance: number
}

const TYPE_ORDER: Record<string, number> = {
  ROOM_CHARGE: 0, SERVICE: 1, DISCOUNT: 2, TAX: 3,
}
const METHOD_LABEL: Record<string, string> = {
  CASH: "Tien mat", CARD: "The", BANK_TRANSFER: "CK ngan hang", DEMO: "Demo", OTHER: "Khac",
}

// ─── Build document (returns a Document element, not a wrapper component) ─────

function buildInvoiceDoc(data: InvoiceData) {
  const sorted = [...data.items].sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9),
  )

  return createElement(Document, {},
    createElement(Page, { size: "A4", style: s.page },

      // Header
      createElement(View, { style: s.header },
        createElement(View, {},
          createElement(Text, { style: s.title }, "HOA DON"),
          createElement(Text, { style: s.grayText }, data.propertyName),
          data.propertyAddress
            ? createElement(Text, { style: { ...s.grayText, fontSize: 9 } }, data.propertyAddress)
            : null,
        ),
        createElement(View, { style: { textAlign: "right" } },
          createElement(Text, { style: s.bold }, data.confirmationCode),
          createElement(Text, { style: s.grayText }, `Check-in:  ${data.checkInDate}`),
          createElement(Text, { style: s.grayText }, `Check-out: ${data.checkOutDate}`),
          createElement(Text, { style: s.grayText }, `${data.totalNights} dem`),
        ),
      ),

      // Guest
      createElement(View, { style: s.section },
        createElement(Text, { style: s.label }, "KHACH HANG"),
        createElement(View, { style: s.divider }),
        createElement(Text, { style: s.bold }, `${data.guest.firstName} ${data.guest.lastName}`),
        createElement(Text, { style: s.grayText }, data.guest.email),
        createElement(Text, { style: s.grayText }, data.roomTypeName),
      ),

      // Charges
      createElement(View, { style: s.section },
        createElement(Text, { style: s.label }, "CHI TIET KHOAN PHI"),
        createElement(View, { style: s.divider }),
        createElement(View, { style: s.rowHeader },
          createElement(Text, { style: s.col1 }, "Mo ta"),
          createElement(Text, { style: s.col2 }, "SL"),
          createElement(Text, { style: s.col3 }, "Don gia"),
          createElement(Text, { style: s.col4 }, "Thanh tien"),
        ),
        ...sorted.map((item, i) =>
          createElement(View, { key: String(i), style: s.row },
            createElement(Text, { style: { ...s.col1, ...(item.isVoided ? s.voided : {}) } },
              item.description),
            createElement(Text, { style: { ...s.col2, ...(item.isVoided ? s.voided : {}) } },
              String(item.quantity)),
            createElement(Text, { style: { ...s.col3, ...(item.isVoided ? s.voided : {}) } },
              fmtVnd(item.unitPrice)),
            createElement(Text, {
              style: {
                ...s.col4,
                ...(item.isVoided ? s.voided : {}),
                ...(item.amount < 0 ? s.greenText : {}),
              },
            }, fmtVnd(item.amount)),
          ),
        ),
        createElement(View, { style: s.totalRow },
          createElement(Text, { style: { ...s.col1, ...s.bold } }, "Tong phi"),
          createElement(Text, { style: { ...s.col4, ...s.bold } }, fmtVnd(data.chargesTotal)),
        ),
      ),

      // Payments
      data.payments.length > 0
        ? createElement(View, { style: s.section },
            createElement(Text, { style: s.label }, "LICH SU THANH TOAN"),
            createElement(View, { style: s.divider }),
            ...data.payments.map((p, i) =>
              createElement(View, { key: String(i), style: s.row },
                createElement(Text, { style: s.col1 },
                  `${METHOD_LABEL[p.method] ?? p.method}${p.reference ? ` — ${p.reference}` : ""}`),
                createElement(Text, { style: { ...s.col4, ...s.greenText } }, fmtVnd(p.amount)),
              ),
            ),
            createElement(View, { style: s.totalRow },
              createElement(Text, { style: { ...s.col1, ...s.bold } }, "Tong da thanh toan"),
              createElement(Text, { style: { ...s.col4, ...s.bold, ...s.greenText } }, fmtVnd(data.paymentsTotal)),
            ),
          )
        : null,

      // Balance
      createElement(View, { style: s.balanceBox },
        createElement(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
          createElement(Text, { style: s.bold }, "SO DU CON LAI"),
          createElement(Text, {
            style: {
              ...s.bold,
              fontSize: 13,
              ...(data.balance === 0 ? s.greenText : data.balance > 0 ? s.redText : s.grayText),
            },
          }, fmtVnd(data.balance)),
        ),
      ),

      // Footer
      createElement(View, { style: { marginTop: 30 } },
        createElement(Text, {
          style: { ...s.grayText, fontSize: 8, textAlign: "center" },
        }, `Tao luc: ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC  •  ${data.confirmationCode}`),
      ),
    ),
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params
  const caller = await getServerCaller()
  if (!caller) return new Response("Unauthorized", { status: 401 })

  try {
    const [folio, property] = await Promise.all([
      caller.folio.getByBooking({ bookingId }),
      caller.property.getConfig(),
    ])

    const data: InvoiceData = {
      confirmationCode: folio.booking.confirmationCode,
      checkInDate: fmtDate(folio.booking.checkInDate),
      checkOutDate: fmtDate(folio.booking.checkOutDate),
      totalNights: folio.booking.totalNights,
      guest: folio.booking.guest,
      roomTypeName: folio.booking.roomType.name,
      propertyName: property.name,
      propertyAddress: property.address,
      items: folio.items.map((i) => ({
        type: i.type as string,
        description: i.description,
        quantity: toNum(i.quantity),
        unitPrice: toNum(i.unitPrice),
        amount: toNum(i.amount),
        isVoided: i.isVoided,
      })),
      payments: folio.payments.map((p) => ({
        method: p.method as string,
        amount: toNum(p.amount),
        reference: p.reference,
      })),
      chargesTotal: folio.chargesTotal,
      paymentsTotal: folio.paymentsTotal,
      balance: folio.balance,
    }

    const nodeBuffer = await renderToBuffer(buildInvoiceDoc(data))
    // Convert Node.js Buffer to Uint8Array for Web Response compatibility
    const bytes = new Uint8Array(nodeBuffer)

    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${folio.booking.confirmationCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error generating PDF"
    return new Response(msg, { status: 500 })
  }
}
