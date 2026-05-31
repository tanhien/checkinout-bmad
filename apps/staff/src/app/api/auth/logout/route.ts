import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/auth"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const response = NextResponse.redirect(new URL("/login", req.url))
  response.cookies.delete(COOKIE_NAME)
  return response
}
