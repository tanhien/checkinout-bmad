import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { encrypt, decrypt, safeDecrypt } from "./crypto"

// AES-256-GCM requires a 64-char hex key (32 bytes)
const TEST_KEY = "a".repeat(64) // 0xaaaa...aa (32 bytes of 0xaa)

beforeAll(() => {
  process.env["PII_ENCRYPTION_KEY"] = TEST_KEY
})

afterAll(() => {
  delete process.env["PII_ENCRYPTION_KEY"]
})

describe("encrypt / decrypt — round-trip", () => {
  it("round-trip ASCII string", () => {
    const plain = "HTL-2026-ABCXYZ"
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it("round-trip Vietnamese string with diacritics", () => {
    const plain = "Nguyễn Thị Hoa"
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it("round-trip empty string", () => {
    const plain = ""
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it("round-trip string with special characters", () => {
    const plain = `<script>alert("XSS")</script> & 'quotes' \n newline`
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it("round-trip 1 000-char string", () => {
    const plain = "A".repeat(500) + "Ặ".repeat(250) + "z".repeat(250)
    expect(decrypt(encrypt(plain))).toBe(plain)
  })

  it("round-trip CCCD / passport number formats", () => {
    const ids = ["012345678901", "B12345678", "A9999999"]
    for (const id of ids) {
      expect(decrypt(encrypt(id))).toBe(id)
    }
  })
})

describe("encrypt — output format and randomness", () => {
  it("produces three colon-separated hex segments", () => {
    const ct = encrypt("test")
    const parts = ct.split(":")
    expect(parts).toHaveLength(3)
    const [iv, tag, body] = parts as [string, string, string]
    // IV = 12 bytes = 24 hex chars
    expect(iv).toHaveLength(24)
    expect(iv).toMatch(/^[0-9a-f]+$/)
    // GCM auth tag = 16 bytes = 32 hex chars
    expect(tag).toHaveLength(32)
    expect(tag).toMatch(/^[0-9a-f]+$/)
    // body is at least 1 hex char pair (even for 1-char input)
    expect(body.length).toBeGreaterThan(0)
    expect(body).toMatch(/^[0-9a-f]+$/)
  })

  it("same plaintext produces different ciphertexts (random IV)", () => {
    const plain = "idempotency"
    const ct1 = encrypt(plain)
    const ct2 = encrypt(plain)
    expect(ct1).not.toBe(ct2)
  })

  it("ciphertext length grows with plaintext length", () => {
    const short = encrypt("hi")
    const long = encrypt("hi".repeat(100))
    expect(long.length).toBeGreaterThan(short.length)
  })
})

describe("decrypt — error cases", () => {
  it("throws on wrong number of colon segments", () => {
    expect(() => decrypt("notavalidciphertext")).toThrow("Invalid ciphertext format")
  })

  it("throws on tampered auth tag (GCM authentication failure)", () => {
    const ct = encrypt("original")
    const parts = ct.split(":")
    // Flip last byte of tag
    const tag = parts[1]!
    const tamperedTag = tag.slice(0, -2) + (tag.slice(-2) === "00" ? "ff" : "00")
    const tampered = [parts[0], tamperedTag, parts[2]].join(":")
    expect(() => decrypt(tampered)).toThrow()
  })

  it("throws on tampered ciphertext body", () => {
    const ct = encrypt("original data")
    const parts = ct.split(":")
    const body = parts[2]!
    const tamperedBody = (body.slice(0, -2) + (body.slice(-2) === "00" ? "ff" : "00"))
    const tampered = [parts[0], parts[1], tamperedBody].join(":")
    expect(() => decrypt(tampered)).toThrow()
  })
})

describe("safeDecrypt — never throws", () => {
  it("returns decrypted value for valid ciphertext", () => {
    const plain = "safe value"
    expect(safeDecrypt(encrypt(plain))).toBe(plain)
  })

  it("returns null for garbage input", () => {
    expect(safeDecrypt("garbage")).toBeNull()
  })

  it("returns null for tampered ciphertext", () => {
    const ct = encrypt("data")
    const tampered = ct.slice(0, -4) + "ffff"
    expect(safeDecrypt(tampered)).toBeNull()
  })

  it("returns null when PII_ENCRYPTION_KEY is missing", () => {
    const saved = process.env["PII_ENCRYPTION_KEY"]
    delete process.env["PII_ENCRYPTION_KEY"]
    // safeDecrypt catches the thrown error from getKey()
    expect(safeDecrypt("aa:bb:cc")).toBeNull()
    process.env["PII_ENCRYPTION_KEY"] = saved
  })
})
