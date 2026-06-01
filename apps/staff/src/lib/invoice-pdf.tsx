import React from "react"
import path from "path"
import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer"

// Register Arial fonts (supports full Vietnamese Unicode)
const fontsDir = path.join(process.cwd(), "public", "fonts")
Font.register({
  family: "Arial",
  fonts: [
    { src: path.join(fontsDir, "Arial-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(fontsDir, "ArialBold.ttf"), fontWeight: "bold" },
  ],
})

const styles = StyleSheet.create({
  page:          { padding: 40, fontSize: 10, fontFamily: "Arial", color: "#1a1a1a" },
  header:        { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  hotelName:     { fontSize: 18, fontWeight: "bold", color: "#1d4ed8" },
  hotelSub:      { fontSize: 9, color: "#6b7280", marginTop: 2 },
  invoiceTitle:  { fontSize: 22, fontWeight: "bold", color: "#1a1a1a", textAlign: "right" },
  invoiceCode:   { fontSize: 10, color: "#6b7280", textAlign: "right", marginTop: 2 },
  section:       { marginBottom: 16 },
  sectionTitle:  { fontSize: 9, fontWeight: "bold", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  row:           { flexDirection: "row", marginBottom: 3 },
  label:         { width: "35%", color: "#6b7280" },
  value:         { flex: 1, color: "#1a1a1a" },
  divider:       { borderBottom: 1, borderColor: "#e5e7eb", marginBottom: 12 },
  table:         { marginTop: 4 },
  tableHeader:   { flexDirection: "row", backgroundColor: "#f3f4f6", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { fontSize: 9, fontWeight: "bold", color: "#6b7280" },
  tableRow:      { flexDirection: "row", padding: "5 8", borderBottom: 1, borderColor: "#f3f4f6" },
  tableRowText:  { fontSize: 9 },
  col_desc:      { flex: 1 },
  col_qty:       { width: 40, textAlign: "right" },
  col_unit:      { width: 70, textAlign: "right" },
  col_amount:    { width: 75, textAlign: "right" },
  totalsSection: { marginTop: 12, alignItems: "flex-end" },
  totalRow:      { flexDirection: "row", marginBottom: 3 },
  totalLabel:    { width: 120, textAlign: "right", color: "#6b7280" },
  totalValue:    { width: 80, textAlign: "right" },
  grandTotalRow: { flexDirection: "row", marginTop: 6, paddingTop: 6, borderTop: 2, borderColor: "#1d4ed8" },
  grandTotalLabel: { width: 120, textAlign: "right", fontWeight: "bold", fontSize: 12 },
  grandTotalValue: { width: 80, textAlign: "right", fontWeight: "bold", fontSize: 12, color: "#1d4ed8" },
  footer:        { marginTop: 32, paddingTop: 12, borderTop: 1, borderColor: "#e5e7eb", flexDirection: "row", justifyContent: "space-between" },
  footerText:    { fontSize: 8, color: "#9ca3af" },
  voidedText:    { color: "#ef4444" },
  paymentRow:    { flexDirection: "row", padding: "4 8", backgroundColor: "#f0fdf4", borderRadius: 3, marginBottom: 2 },
})

function fmtVND(amount: number): string {
  return amount.toLocaleString("vi-VN") + " VND"
}

function fmtDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
}

type Property = {
  name: string
  address: string
  phone: string
  email: string
  taxCode?: string | null
  bankAccount?: string | null
}

type FolioItem = {
  id: string
  description: string
  quantity: number | { toNumber(): number }
  unitPrice: number | { toNumber(): number }
  amount: number | { toNumber(): number }
  type: string
  isVoided: boolean
  chargeDate: Date | string
}

type Payment = {
  id: string
  method: string
  amount: number | { toNumber(): number }
  reference?: string | null
  createdAt: Date | string
}

type FolioData = {
  status: string
  booking: {
    confirmationCode: string
    checkInDate: Date | string
    checkOutDate: Date | string
    totalNights: number
    roomType: { name: string }
    guest: { firstName: string; lastName: string; email: string }
  }
  items: FolioItem[]
  payments: Payment[]
  chargesTotal: number
  paymentsTotal: number
  balance: number
}

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  CASH: "Tiền mặt", CARD: "Thẻ tín dụng", BANK_TRANSFER: "Chuyển khoản", DEMO: "Demo", OTHER: "Khác",
}

function toNum(v: number | { toNumber(): number }): number {
  return typeof v === "number" ? v : v.toNumber()
}

export function InvoiceDocument({ property, folio }: { property: Property; folio: FolioData }) {
  const { booking } = folio
  const activeItems = folio.items.filter((i) => !i.isVoided)
  const voidedItems = folio.items.filter((i) => i.isVoided)

  return (
    <Document title={`Invoice ${booking.confirmationCode}`} author={property.name}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hotelName}>{property.name}</Text>
            <Text style={styles.hotelSub}>{property.address}</Text>
            <Text style={styles.hotelSub}>{property.phone} · {property.email}</Text>
            {property.taxCode && <Text style={styles.hotelSub}>MST: {property.taxCode}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>HÓA ĐƠN</Text>
            <Text style={styles.invoiceCode}>{booking.confirmationCode}</Text>
            <Text style={styles.invoiceCode}>{fmtDate(new Date())}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Guest + booking info */}
        <View style={{ flexDirection: "row", marginBottom: 20, gap: 24 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Họ tên</Text>
              <Text style={styles.value}>{booking.guest.firstName} {booking.guest.lastName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{booking.guest.email}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Thông tin đặt phòng</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Loại phòng</Text>
              <Text style={styles.value}>{booking.roomType.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Nhận phòng</Text>
              <Text style={styles.value}>{fmtDate(booking.checkInDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Trả phòng</Text>
              <Text style={styles.value}>{fmtDate(booking.checkOutDate)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Số đêm</Text>
              <Text style={styles.value}>{booking.totalNights}</Text>
            </View>
          </View>
        </View>

        {/* Charges table */}
        <Text style={styles.sectionTitle}>Chi tiết phí dịch vụ</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col_desc]}>Mô tả</Text>
            <Text style={[styles.tableHeaderText, styles.col_qty]}>SL</Text>
            <Text style={[styles.tableHeaderText, styles.col_unit]}>Đơn giá</Text>
            <Text style={[styles.tableHeaderText, styles.col_amount]}>Thành tiền</Text>
          </View>

          {activeItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableRowText, styles.col_desc]}>{item.description}</Text>
              <Text style={[styles.tableRowText, styles.col_qty]}>{toNum(item.quantity)}</Text>
              <Text style={[styles.tableRowText, styles.col_unit]}>{fmtVND(toNum(item.unitPrice))}</Text>
              <Text style={[styles.tableRowText, styles.col_amount]}>{fmtVND(toNum(item.amount))}</Text>
            </View>
          ))}

          {voidedItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableRowText, styles.voidedText, styles.col_desc]}>{item.description} (đã hủy)</Text>
              <Text style={[styles.tableRowText, styles.col_qty, styles.voidedText]}>{toNum(item.quantity)}</Text>
              <Text style={[styles.tableRowText, styles.col_unit, styles.voidedText]}>—</Text>
              <Text style={[styles.tableRowText, styles.col_amount, styles.voidedText]}>—</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng phí:</Text>
            <Text style={styles.totalValue}>{fmtVND(folio.chargesTotal)}</Text>
          </View>
          {folio.paymentsTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Đã thanh toán:</Text>
              <Text style={styles.totalValue}>-{fmtVND(folio.paymentsTotal)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Còn lại:</Text>
            <Text style={styles.grandTotalValue}>{fmtVND(folio.balance)}</Text>
          </View>
        </View>

        {/* Payment history */}
        {folio.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Lịch sử thanh toán</Text>
            {folio.payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <Text style={[styles.tableRowText, { flex: 1 }]}>
                  {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                  {p.reference ? ` — Ref: ${p.reference}` : ""}
                  {" · "}{fmtDate(p.createdAt)}
                </Text>
                <Text style={[styles.tableRowText, { width: 80, textAlign: "right", color: "#166534" }]}>
                  {fmtVND(toNum(p.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bank account info */}
        {property.bankAccount && (
          <View style={{ marginTop: 16, padding: "8 10", backgroundColor: "#f8fafc", borderRadius: 4 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 3 }]}>Thông tin chuyển khoản</Text>
            <Text style={{ fontSize: 9, color: "#374151" }}>{property.bankAccount}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Cảm ơn quý khách đã lưu trú tại {property.name}!</Text>
          <Text style={styles.footerText}>{property.phone} · {property.email}</Text>
        </View>
      </Page>
    </Document>
  )
}
