import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter, createContext } from "@hotel/api"
import { type NextRequest } from "next/server"

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Kiosk-Api-Key, Authorization",
}

// Handle CORS preflight
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

async function handler(req: NextRequest): Promise<Response> {
  const res = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req: request }) => createContext(request),
    onError: ({ error, path }) => {
      if (process.env["NODE_ENV"] !== "production") {
        console.error(`[tRPC] Error on ${path ?? "unknown"}:`, error.message)
      }
    },
  })

  // Add CORS headers to every tRPC response
  const corsRes = new Response(res.body, res)
  Object.entries(CORS_HEADERS).forEach(([k, v]) => corsRes.headers.set(k, v))
  return corsRes
}

export { handler as GET, handler as POST }
