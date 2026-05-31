import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@hotel/api"

const apiUrl = import.meta.env.VITE_STAFF_API_URL ?? "http://localhost:3001"
const apiKey = import.meta.env.VITE_KIOSK_API_KEY ?? ""

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      headers: () => ({ "X-Kiosk-Api-Key": apiKey }),
    }),
  ],
})
