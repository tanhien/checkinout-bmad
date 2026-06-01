import { describe, it, expect, beforeEach, vi } from "vitest"

// getPublicUrl and roomPhotoKey are tested here.
// DEMO_MODE is a module-level constant in storage.ts, so we must reset
// the module registry before each env-sensitive test.

describe("getPublicUrl — demo mode (no CLOUDFLARE_R2_ACCOUNT_ID)", () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env["CLOUDFLARE_R2_ACCOUNT_ID"]
    delete process.env["CLOUDFLARE_R2_PUBLIC_URL"]
  })

  it("returns /demo-placeholder/{key} when R2 not configured", async () => {
    const { getPublicUrl } = await import("./storage.js")
    expect(getPublicUrl("rooms/rt-1/photo.webp")).toBe("/demo-placeholder/rooms/rt-1/photo.webp")
  })

  it("demo URL preserves nested path", async () => {
    const { getPublicUrl } = await import("./storage.js")
    expect(getPublicUrl("a/b/c/d.webp")).toBe("/demo-placeholder/a/b/c/d.webp")
  })

  it("returns public URL with base when CLOUDFLARE_R2_PUBLIC_URL is set", async () => {
    process.env["CLOUDFLARE_R2_ACCOUNT_ID"] = "fake-account"
    process.env["CLOUDFLARE_R2_PUBLIC_URL"] = "https://cdn.example.com"
    vi.resetModules()
    const { getPublicUrl } = await import("./storage.js")
    expect(getPublicUrl("rooms/rt-1/photo.webp")).toBe("https://cdn.example.com/rooms/rt-1/photo.webp")
  })
})

describe("roomPhotoKey — key format", () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env["CLOUDFLARE_R2_ACCOUNT_ID"]
  })

  it("starts with rooms/{roomTypeId}/", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const key = roomPhotoKey("rt-abc123", "photo.jpg")
    expect(key.startsWith("rooms/rt-abc123/")).toBe(true)
  })

  it("ends with .webp regardless of original extension", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    expect(roomPhotoKey("rt-1", "image.png")).toMatch(/\.webp$/)
    expect(roomPhotoKey("rt-1", "photo.jpeg")).toMatch(/\.webp$/)
    expect(roomPhotoKey("rt-1", "file.gif")).toMatch(/\.webp$/)
  })

  it("strips original extension from filename", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const key = roomPhotoKey("rt-1", "my-photo.jpg")
    expect(key).not.toContain(".jpg")
  })

  it("sanitizes spaces and parentheses to underscores", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const key = roomPhotoKey("rt-1", "my photo (1).jpg")
    expect(key).not.toMatch(/[ ()]/g)
  })

  it("includes a numeric timestamp segment within the test window", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const before = Date.now()
    const key = roomPhotoKey("rt-1", "image.jpg")
    const after = Date.now()
    const segment = key.split("/")[2]!        // "{timestamp}-{name}.webp"
    const ts = parseInt(segment.split("-")[0]!, 10)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it("two calls produce different keys due to timestamp", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const k1 = roomPhotoKey("rt-1", "photo.jpg")
    await new Promise((r) => setTimeout(r, 2))
    const k2 = roomPhotoKey("rt-1", "photo.jpg")
    expect(k1).not.toBe(k2)
  })

  it("preserves safe filename chars: letters, numbers, hyphen", async () => {
    const { roomPhotoKey } = await import("./storage.js")
    const key = roomPhotoKey("rt-1", "deluxe-suite-01.jpg")
    expect(key).toContain("deluxe-suite-01")
  })
})
