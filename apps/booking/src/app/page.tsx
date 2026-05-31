import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirect handled by next-intl middleware — this is a fallback
  redirect("/vi")
}
