import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@hotel/db"
import { signStaffToken, buildSessionCookie } from "@/lib/auth"
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit"

const LoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được để trống"),
  rememberMe: z.boolean().optional().default(false),
})

// Dummy hash used for constant-time comparison when user not found
const DUMMY_HASH = "$2b$12$invalidhashXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  const rateLimit = checkRateLimit(ip)
  if (!rateLimit.allowed) {
    const retryMinutes = Math.ceil((rateLimit.retryAfterSeconds ?? 900) / 60)
    return NextResponse.json(
      { error: `Quá nhiều lần thử. Vui lòng thử lại sau ${retryMinutes} phút.` },
      { status: 429 }
    )
  }

  // Parse and validate body
  const rawBody = await request.json().catch(() => null)
  const parsed = LoginSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 })
  }

  const { email, password, rememberMe } = parsed.data

  // Look up staff by email
  const staff = await db.staff.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      firstName: true,
      lastName: true,
      role: true,
      propertyId: true,
      isActive: true,
    },
  })

  // Constant-time comparison even when user not found (prevents timing attacks)
  const hashToCompare = staff?.passwordHash ?? DUMMY_HASH
  const passwordValid = await bcrypt.compare(password, hashToCompare)

  if (!staff || !passwordValid || !staff.isActive) {
    recordFailedAttempt(ip)
    return NextResponse.json(
      { error: "Email hoặc mật khẩu không đúng." },
      { status: 401 }
    )
  }

  // Success — clear rate limit, create token, then update last login
  clearAttempts(ip)

  const token = await signStaffToken(
    { staffId: staff.id, role: staff.role, propertyId: staff.propertyId },
    rememberMe
  )

  // Fire-and-forget — non-critical, don't block the response
  void db.staff.update({
    where: { id: staff.id },
    data: { lastLoginAt: new Date() },
  })

  const response = NextResponse.json({
    id: staff.id,
    email: staff.email,
    firstName: staff.firstName,
    lastName: staff.lastName,
    role: staff.role,
    propertyId: staff.propertyId,
  })

  response.cookies.set(buildSessionCookie(token, rememberMe))
  return response
}
