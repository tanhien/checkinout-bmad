import { describe, it, expect } from "vitest"
import { normalizeName, buildConfirmationCode } from "./normalize"

describe("normalizeName — Vietnamese diacritics", () => {
  it("strips common vowel diacritics", () => {
    expect(normalizeName("Nguyễn")).toBe("nguyen")
    expect(normalizeName("Trần")).toBe("tran")
    expect(normalizeName("Lê")).toBe("le")
    expect(normalizeName("Phạm")).toBe("pham")
  })

  it("replaces đ with d (lowercase)", () => {
    expect(normalizeName("Đặng")).toBe("dang")
    expect(normalizeName("đình")).toBe("dinh")
  })

  it("replaces Đ with D then lowercases to d", () => {
    expect(normalizeName("ĐỖ")).toBe("do")
  })

  it("full Vietnamese name round-trip", () => {
    expect(normalizeName("Nguyễn Thị Hoa")).toBe("nguyen thi hoa")
    expect(normalizeName("Trần Văn Mạnh")).toBe("tran van manh")
    expect(normalizeName("Lê Thị Ánh Tuyết")).toBe("le thi anh tuyet")
  })

  it("lowercases Latin uppercase", () => {
    expect(normalizeName("NGUYEN VAN A")).toBe("nguyen van a")
    expect(normalizeName("John Smith")).toBe("john smith")
  })

  it("collapses multiple internal spaces", () => {
    expect(normalizeName("Hoa  Mai")).toBe("hoa mai")
    expect(normalizeName("A   B   C")).toBe("a b c")
  })

  it("trims leading and trailing whitespace", () => {
    expect(normalizeName("  Hoa  ")).toBe("hoa")
    expect(normalizeName("\tNguyen\n")).toBe("nguyen")
  })

  it("handles empty string", () => {
    expect(normalizeName("")).toBe("")
  })

  it("leaves already-normalized string unchanged", () => {
    expect(normalizeName("nguyen van a")).toBe("nguyen van a")
  })

  it("handles mixed diacritics + uppercase + extra spaces", () => {
    // Input as might be typed on kiosk screen with autofill
    expect(normalizeName("  NGUYỄN  VĂN  A  ")).toBe("nguyen van a")
  })
})

describe("buildConfirmationCode", () => {
  it("produces HTL-{YEAR}-{6CHAR} format", () => {
    const code = buildConfirmationCode(2026, Buffer.from([0, 1, 2, 3, 4, 5]))
    expect(code).toMatch(/^HTL-2026-[A-Z0-9]{6}$/)
  })

  it("uses the provided year", () => {
    const code = buildConfirmationCode(2030, Buffer.from([10, 20, 30, 40, 50, 60]))
    expect(code.startsWith("HTL-2030-")).toBe(true)
  })

  it("suffix is exactly 6 alphanumeric uppercase chars", () => {
    for (let i = 0; i < 10; i++) {
      const bytes = Buffer.from(Array.from({ length: 6 }, (_, j) => i * 7 + j))
      const code = buildConfirmationCode(2026, bytes)
      const suffix = code.split("-")[2]!
      expect(suffix).toHaveLength(6)
      expect(suffix).toMatch(/^[A-Z0-9]+$/)
    }
  })

  it("deterministic given same bytes", () => {
    const bytes = Buffer.from([100, 200, 50, 75, 25, 10])
    const code1 = buildConfirmationCode(2026, bytes)
    const code2 = buildConfirmationCode(2026, bytes)
    expect(code1).toBe(code2)
  })

  it("byte 0 maps to 'A' (first char in alphabet)", () => {
    const bytes = Buffer.from([0, 0, 0, 0, 0, 0])
    const code = buildConfirmationCode(2026, bytes)
    expect(code).toBe("HTL-2026-AAAAAA")
  })

  it("all 36 charset chars are reachable", () => {
    const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    const seen = new Set<string>()
    for (let b = 0; b < 36; b++) {
      const bytes = Buffer.from([b, b, b, b, b, b])
      const code = buildConfirmationCode(2026, bytes)
      const char = code.split("-")[2]![0]!
      seen.add(char)
    }
    expect(seen.size).toBe(36)
    for (const ch of CHARSET) expect(seen.has(ch)).toBe(true)
  })
})
