import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import type { TRPCError } from "@trpc/server"
import { appRouter, createContext } from "@hotel/api"

const handler = (req: Request): Promise<Response> =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: ({ req: request }: { req: Request }) => createContext(request),
    onError: ({ error, path }: { error: TRPCError; path: string | undefined }) => {
      if (process.env["NODE_ENV"] !== "production") {
        console.error(`[tRPC/booking] Error on ${path ?? "unknown"}:`, error.message)
      }
    },
  })

export { handler as GET, handler as POST }
