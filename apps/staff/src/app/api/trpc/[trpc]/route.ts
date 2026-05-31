import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter, createContext } from "@hotel/api"

const handler = (req: Request): Promise<Response> =>
  fetchRequestHandler({
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

export { handler as GET, handler as POST }
