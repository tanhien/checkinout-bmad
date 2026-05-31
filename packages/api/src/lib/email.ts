import { Resend } from "resend"

// Lazy-initialised client — no-ops when RESEND_API_KEY is absent (dev / demo)
let _client: Resend | null = null

function getClient(): Resend | null {
  const key = process.env["RESEND_API_KEY"]
  if (!key) return null
  if (!_client) _client = new Resend(key)
  return _client
}

const DEFAULT_FROM = "Hotel <noreply@hotel.local>"

// ─── Templates ────────────────────────────────────────────────────────────────

function checkinHtml(p: {
  guestName: string
  confirmationCode: string
  roomNumber: string
  checkInDate: string
  checkOutDate: string
  propertyName: string
  wifiPassword?: string | null
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#1d4ed8">Welcome to ${p.propertyName}!</h2>
  <p>Dear ${p.guestName},</p>
  <p>Your check-in is confirmed. Here are your details:</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;font-weight:600;width:40%">Booking</td><td style="padding:8px">${p.confirmationCode}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Room</td><td style="padding:8px">${p.roomNumber}</td></tr>
    <tr><td style="padding:8px;font-weight:600">Check-in</td><td style="padding:8px">${p.checkInDate}</td></tr>
    <tr style="background:#f3f4f6"><td style="padding:8px;font-weight:600">Check-out</td><td style="padding:8px">${p.checkOutDate}</td></tr>
    ${p.wifiPassword ? `<tr><td style="padding:8px;font-weight:600">Wi-Fi</td><td style="padding:8px">${p.wifiPassword}</td></tr>` : ""}
  </table>
  <p>Thank you for staying with us. Enjoy your stay!</p>
  <p style="color:#6b7280;font-size:12px">${p.propertyName}</p>
</body>
</html>`
}

// ─── Send functions ───────────────────────────────────────────────────────────

export async function sendCheckinConfirmation(params: {
  guestEmail: string
  guestName: string
  confirmationCode: string
  roomNumber: string
  checkInDate: string
  checkOutDate: string
  propertyName: string
  propertyEmail: string
  wifiPassword?: string | null
  customTemplate?: string | null
}): Promise<void> {
  const client = getClient()
  if (!client) return

  const html = params.customTemplate
    ? params.customTemplate
        .replace("{{guestName}}", params.guestName)
        .replace("{{confirmationCode}}", params.confirmationCode)
        .replace("{{roomNumber}}", params.roomNumber)
        .replace("{{checkInDate}}", params.checkInDate)
        .replace("{{checkOutDate}}", params.checkOutDate)
    : checkinHtml(params)

  await client.emails.send({
    from: DEFAULT_FROM,
    to: params.guestEmail,
    replyTo: params.propertyEmail,
    subject: `Check-in Confirmed — ${params.propertyName} (${params.confirmationCode})`,
    html,
  })
}
