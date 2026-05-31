"use client"

import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@hotel/api"

export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
})
