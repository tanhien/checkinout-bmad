import type { Metadata } from "next"
import { getLocale } from "next-intl/server"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Hotel Booking",
    template: "%s | Hotel Booking",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
