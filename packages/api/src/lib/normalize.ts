/**
 * Normalize a Vietnamese name for fuzzy comparison:
 * strip diacritics, replace đ/Đ, lowercase, collapse whitespace.
 *
 * Used on the kiosk check-in/check-out flows to match guest names
 * without requiring accent-perfect input on the touchscreen.
 */
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

/**
 * Build a confirmation code in the format HTL-{YEAR}-{6ALPHANUMERIC}.
 * The 6-char suffix is derived from the provided bytes (must be >= 6 bytes).
 */
export function buildConfirmationCode(year: number, suffixBytes: Buffer): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let suffix = ""
  for (let i = 0; i < 6; i++) suffix += chars[suffixBytes[i]! % chars.length]!
  return `HTL-${year}-${suffix}`
}
