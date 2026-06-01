import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner"

// ─── Config ───────────────────────────────────────────────────────────────────

const DEMO_MODE = !process.env["CLOUDFLARE_R2_ACCOUNT_ID"]

function getClient(): S3Client | null {
  if (DEMO_MODE) return null
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env["CLOUDFLARE_R2_ACCOUNT_ID"]!}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env["CLOUDFLARE_R2_ACCESS_KEY_ID"]!,
      secretAccessKey: process.env["CLOUDFLARE_R2_SECRET_ACCESS_KEY"]!,
    },
  })
}

const BUCKET = process.env["CLOUDFLARE_R2_BUCKET"] ?? "hotel-demo"
const PUBLIC_URL_BASE = process.env["CLOUDFLARE_R2_PUBLIC_URL"] ?? ""

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to R2 (or no-op in demo mode).
 * Returns the public URL of the stored object.
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  if (DEMO_MODE) {
    // Demo: return a placeholder URL — upload is skipped
    return `/demo-placeholder/${key}`
  }
  const client = getClient()!
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return PUBLIC_URL_BASE ? `${PUBLIC_URL_BASE}/${key}` : `https://${BUCKET}.r2.cloudflarestorage.com/${key}`
}

/**
 * Generate a signed URL for temporary private access (e.g. invoices).
 * TTL defaults to 3600 seconds (1 hour).
 */
export async function getSignedUrl(key: string, ttlSeconds = 3600): Promise<string> {
  if (DEMO_MODE) return `/demo-signed/${key}`
  const client = getClient()!
  return awsGetSignedUrl(
    client,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn: ttlSeconds },
  )
}

/**
 * Delete a file from R2.
 */
export async function deleteFile(key: string): Promise<void> {
  if (DEMO_MODE) return
  const client = getClient()!
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

/**
 * Build the public URL for a known key without signing.
 */
export function getPublicUrl(key: string): string {
  if (DEMO_MODE) return `/demo-placeholder/${key}`
  return PUBLIC_URL_BASE ? `${PUBLIC_URL_BASE}/${key}` : `https://${BUCKET}.r2.cloudflarestorage.com/${key}`
}

/**
 * Convert an uploaded image buffer to WebP and resize to max 1920px wide.
 * Returns the processed buffer. Falls back to original if sharp fails.
 */
export async function processImage(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default
    return await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
  } catch {
    return buffer
  }
}

/**
 * Build a storage key for a room photo.
 * Format: rooms/{roomTypeId}/{timestamp}-{safeFilename}.webp
 */
export function roomPhotoKey(roomTypeId: string, originalName: string): string {
  const safe = originalName
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .replace(/\.[^.]+$/, "")
  return `rooms/${roomTypeId}/${Date.now()}-${safe}.webp`
}
