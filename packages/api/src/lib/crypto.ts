import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

// AES-256-GCM encryption for PII fields (idNumber).
// Key: PII_ENCRYPTION_KEY env var — must be exactly 64 hex chars (32 bytes).
// Ciphertext format: "{iv_hex}:{tag_hex}:{ciphertext_hex}"

const ALGO = "aes-256-gcm"
const KEY_HEX_LEN = 64 // 32 bytes

function getKey(): Buffer {
  const hex = process.env["PII_ENCRYPTION_KEY"] ?? ""
  if (hex.length !== KEY_HEX_LEN) {
    throw new Error("PII_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)")
  }
  return Buffer.from(hex, "hex")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const parts = ciphertext.split(":")
  if (parts.length !== 3) throw new Error("Invalid ciphertext format")
  const [ivHex, tagHex, encHex] = parts as [string, string, string]
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(tagHex, "hex"))
  return decipher.update(Buffer.from(encHex, "hex")).toString("utf8") + decipher.final("utf8")
}

// Returns null instead of throwing — safe to use in read paths where missing env is non-fatal
export function safeDecrypt(ciphertext: string): string | null {
  try {
    return decrypt(ciphertext)
  } catch {
    return null
  }
}
