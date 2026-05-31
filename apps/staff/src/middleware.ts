import { NextRequest, NextResponse } from "next/server"
import { verifyStaffToken, COOKIE_NAME } from "@/lib/auth"

// Paths that do NOT require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"]

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const session = await verifyStaffToken(token)

  if (!session) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      res.cookies.delete(COOKIE_NAME)
      return res
    }
    const res = NextResponse.redirect(new URL("/login", request.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  // Attach session info to request headers for downstream Server Components
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-staff-id", session.staffId)
  requestHeaders.set("x-staff-role", session.role)
  requestHeaders.set("x-property-id", session.propertyId)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
