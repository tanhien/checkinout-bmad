import { jwtVerify } from "jose"
import { db } from "@hotel/db"
import type { PrismaClient } from "@hotel/db"

// ─── Auth session types (with discriminant for type narrowing) ────────────────

export type StaffRole = "ADMIN" | "MANAGER" | "FRONT_DESK" | "HOUSEKEEPING" | "ACCOUNTANT"

export type StaffAuth = {
  type: "staff"
  staffId: string
  role: StaffRole
  propertyId: string
}

export type GuestAuth = {
  type: "guest"
  guestId: string
  email: string
}

export type KioskAuth = {
  type: "kiosk"
  propertyId: string
}

export type Auth = StaffAuth | GuestAuth | KioskAuth

// ─── Request context (passed to every tRPC procedure) ────────────────────────

export type RequestContext = {
  db: PrismaClient
  redis: null // Upgraded to Redis | null in E1-S5
  auth: Auth | null
  propertyId: string | null
}

// ─── Context factory (call once per request) ─────────────────────────────────

export async function createContext(req: Request): Promise<RequestContext> {
  const auth = await resolveAuth(req)
  const propertyId = auth && auth.type !== "guest" ? auth.propertyId : null

  return {
    db,
    redis: null,
    auth,
    propertyId,
  }
}

// ─── Auth resolution helpers ─────────────────────────────────────────────────

async function resolveAuth(req: Request): Promise<Auth | null> {
  // 1. Kiosk API key (checked first — no cookie needed)
  const kioskKey = req.headers.get("x-kiosk-api-key")
  if (kioskKey) {
    const property = await db.property.findUnique({
      where: { kioskApiKey: kioskKey },
      select: { id: true },
    })
    if (property) {
      return { type: "kiosk", propertyId: property.id }
    }
    return null // Invalid key → reject
  }

  const cookieHeader = req.headers.get("cookie") ?? ""

  // 2. Staff JWT cookie
  const staffToken = parseCookieValue(cookieHeader, "staff_token")
  if (staffToken) {
    const session = await verifyJwt<{ staffId: string; role: StaffRole; propertyId: string }>(
      staffToken,
      process.env["STAFF_JWT_SECRET"] ?? ""
    )
    if (session) {
      return { type: "staff", staffId: session.staffId, role: session.role, propertyId: session.propertyId }
    }
  }

  // 3. Guest JWT cookie (booking portal)
  const guestToken = parseCookieValue(cookieHeader, "guest_token")
  if (guestToken) {
    const session = await verifyJwt<{ guestId: string; email: string }>(
      guestToken,
      process.env["GUEST_JWT_SECRET"] ?? ""
    )
    if (session) {
      return { type: "guest", guestId: session.guestId, email: session.email }
    }
  }

  return null
}

async function verifyJwt<T extends Record<string, unknown>>(
  token: string,
  secret: string
): Promise<T | null> {
  if (!secret || secret.length < 32) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return payload as T
  } catch {
    return null
  }
}

function parseCookieValue(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : undefined
}
