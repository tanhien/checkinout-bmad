// Strip Vietnamese diacritics + lowercase + collapse spaces.
// Mirrors the server-side normalization in the kiosk tRPC router.
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export function formatCurrency(amount: number, currency = "VND"): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount)
}

export function formatDate(dateStr: string, lang: "vi" | "en"): string {
  const date = new Date(dateStr + "T00:00:00Z")
  return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
}
