import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

// Local type — mirrors Prisma's StaffRole enum to keep this file edge-compatible
export type StaffRole = "ADMIN" | "MANAGER" | "FRONT_DESK" | "HOUSEKEEPING" | "ACCOUNTANT"

export type StaffSession = {
  staffId: string
  role: StaffRole
  propertyId: string
}

export const COOKIE_NAME = "staff_token"
const SESSION_DURATION_NORMAL = 8 * 60 * 60       // 8 hours in seconds
const SESSION_DURATION_REMEMBER = 30 * 24 * 60 * 60 // 30 days in seconds

function getJwtSecret(): Uint8Array {
  const secret = process.env["STAFF_JWT_SECRET"]
  if (!secret || secret.length < 32) {
    throw new Error("STAFF_JWT_SECRET must be set and at least 32 characters")
  }
  return new TextEncoder().encode(secret)
}

// Sign a new staff JWT (edge-compatible via jose)
export async function signStaffToken(
  payload: StaffSession,
  rememberMe = false
): Promise<string> {
  const expiresIn = rememberMe ? "30d" : "8h"
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret())
}

// Verify a staff JWT (edge-compatible via jose)
export async function verifyStaffToken(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (
      typeof payload["staffId"] !== "string" ||
      typeof payload["role"] !== "string" ||
      typeof payload["propertyId"] !== "string"
    ) {
      return null
    }
    return {
      staffId: payload["staffId"],
      role: payload["role"] as StaffRole,
      propertyId: payload["propertyId"],
    }
  } catch {
    return null
  }
}

// Read session from cookies — for use in Server Components and Server Actions
export async function getStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyStaffToken(token)
}

export type SessionCookieOptions = {
  name: string
  value: string
  httpOnly: boolean
  secure: boolean
  sameSite: "lax" | "strict" | "none"
  path: string
  maxAge: number
}

// Build cookie options for setting the session cookie
export function buildSessionCookie(token: string, rememberMe: boolean): SessionCookieOptions {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    path: "/",
    maxAge: rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_NORMAL,
  }
}

// withStaffAuth — HOC that wraps API route handlers with auth + RBAC
// Usage: export const GET = withStaffAuth(async (req, session) => { ... })
// With roles: export const POST = withStaffAuth(async (req, session) => { ... }, ['ADMIN'])
type AuthedHandler = (
  req: NextRequest,
  session: StaffSession,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<Response>

export function withStaffAuth(handler: AuthedHandler, allowedRoles?: StaffRole[]) {
  return async (
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = await verifyStaffToken(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (allowedRoles && !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return handler(req, session, ctx)
  }
}
