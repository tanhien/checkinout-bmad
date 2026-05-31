import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Hotel Booking",
    template: "%s | Hotel Booking",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
