import { createCaller, createContext } from "@hotel/api"
import { headers } from "next/headers"

export async function getPortalCaller() {
  const headersList = await headers()
  const cookieHeader = headersList.get("cookie") ?? ""
  const req = new Request("http://localhost", {
    headers: { cookie: cookieHeader },
  })
  const ctx = await createContext(req)
  return createCaller(ctx)
}
