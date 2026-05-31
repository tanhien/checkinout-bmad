import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

export type GuestSession = {
  guestId: string
  email: string
}

const secret = () => new TextEncoder().encode(process.env["GUEST_JWT_SECRET"] ?? "")

export async function signGuestToken(payload: GuestSession, rememberMe = false): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? "30d" : "7d")
    .sign(secret())
}

export async function verifyGuestToken(token: string): Promise<GuestSession | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as GuestSession
  } catch {
    return null
  }
}

export async function getGuestSession(): Promise<GuestSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("guest_token")?.value
  if (!token) return null
  return verifyGuestToken(token)
}

export function buildGuestCookie(token: string, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60
  return {
    name: "guest_token",
    value: token,
    httpOnly: true,
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}
