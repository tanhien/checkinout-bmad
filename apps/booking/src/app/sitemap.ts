import type { MetadataRoute } from "next"
import { getPortalCaller } from "@/lib/portal-caller"

const BASE_URL = process.env["BOOKING_BASE_URL"] ?? "http://localhost:3000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ["", "/about", "/amenities", "/contact", "/rooms"]
  const locales = ["vi", "en"]

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}${page}`])),
      },
    })),
  )

  let roomTypeEntries: MetadataRoute.Sitemap = []
  try {
    const caller = await getPortalCaller()
    const roomTypes = await caller.portal.getRoomTypes({})
    roomTypeEntries = roomTypes.flatMap((rt) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}/rooms/${rt.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/rooms/${rt.slug}`])),
        },
      })),
    )
  } catch { /* silently skip if DB unavailable at build time */ }

  return [...staticEntries, ...roomTypeEntries]
}
