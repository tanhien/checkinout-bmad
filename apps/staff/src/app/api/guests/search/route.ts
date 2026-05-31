import { type NextRequest, NextResponse } from "next/server"
import { getServerCaller } from "@/lib/trpc-caller"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? ""
  if (q.length < 2) return NextResponse.json([])

  const caller = await getServerCaller()
  if (!caller) return NextResponse.json([], { status: 401 })

  const results = await caller.guest.search({ query: q })
  return NextResponse.json(results)
}
