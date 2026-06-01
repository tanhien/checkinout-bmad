import { redirect } from "next/navigation"
import { getServerCaller } from "@/lib/trpc-caller"
import { ContentForm } from "./_components/ContentForm"
import type { PropertyContent } from "./_components/ContentForm"

// Extract the editable fields from a messages JSON file into a PropertyContent object
function extractDefaults(messages: Record<string, unknown>): PropertyContent {
  const w = (messages.home as Record<string, unknown>)?.why as Record<string, Record<string, string>> | undefined
  const about = messages.about as Record<string, unknown> | undefined
  const policies = about?.policies as Record<string, { value?: string }> | undefined
  const footer = messages.footer as Record<string, string> | undefined

  return {
    footerTagline:  footer?.tagline ?? "",
    story:          (about?.story        as string) ?? "",
    locationDesc:   (about?.location_desc as string) ?? "",
    teamDesc:       (about?.team_desc    as string) ?? "",
    awards:         (about?.awards       as string[]) ?? [],
    cancelPolicy:   policies?.cancel?.value   ?? "",
    childrenPolicy: policies?.children?.value ?? "",
    petsPolicy:     policies?.pets?.value     ?? "",
    smokingPolicy:  policies?.smoking?.value  ?? "",
    paymentPolicy:  policies?.payment?.value  ?? "",
    whyItems: {
      free_cancel: { title: w?.free_cancel?.title ?? "", desc: w?.free_cancel?.desc ?? "" },
      best_price:  { title: w?.best_price?.title  ?? "", desc: w?.best_price?.desc  ?? "" },
      heritage:    { title: w?.heritage?.title    ?? "", desc: w?.heritage?.desc    ?? "" },
      spa:         { title: w?.spa?.title         ?? "", desc: w?.spa?.desc         ?? "" },
    },
  }
}

// Merge DB override on top of JSON defaults (DB wins for non-empty values)
function mergeWithDefaults(
  defaults: PropertyContent,
  db: Record<string, unknown>,
): PropertyContent {
  if (!db || Object.keys(db).length === 0) return defaults
  const d = db as Partial<PropertyContent>
  return {
    footerTagline:  d.footerTagline  || defaults.footerTagline,
    story:          d.story          || defaults.story,
    locationDesc:   d.locationDesc   || defaults.locationDesc,
    teamDesc:       d.teamDesc       || defaults.teamDesc,
    awards:         (d.awards?.length ? d.awards : defaults.awards),
    cancelPolicy:   d.cancelPolicy   || defaults.cancelPolicy,
    childrenPolicy: d.childrenPolicy || defaults.childrenPolicy,
    petsPolicy:     d.petsPolicy     || defaults.petsPolicy,
    smokingPolicy:  d.smokingPolicy  || defaults.smokingPolicy,
    paymentPolicy:  d.paymentPolicy  || defaults.paymentPolicy,
    whyItems: {
      free_cancel: {
        title: d.whyItems?.free_cancel?.title || defaults.whyItems?.free_cancel?.title || "",
        desc:  d.whyItems?.free_cancel?.desc  || defaults.whyItems?.free_cancel?.desc  || "",
      },
      best_price: {
        title: d.whyItems?.best_price?.title || defaults.whyItems?.best_price?.title || "",
        desc:  d.whyItems?.best_price?.desc  || defaults.whyItems?.best_price?.desc  || "",
      },
      heritage: {
        title: d.whyItems?.heritage?.title || defaults.whyItems?.heritage?.title || "",
        desc:  d.whyItems?.heritage?.desc  || defaults.whyItems?.heritage?.desc  || "",
      },
      spa: {
        title: d.whyItems?.spa?.title || defaults.whyItems?.spa?.title || "",
        desc:  d.whyItems?.spa?.desc  || defaults.whyItems?.spa?.desc  || "",
      },
    },
  }
}

export default async function ContentSettingsPage() {
  const caller = await getServerCaller()
  if (!caller) redirect("/login")

  const { contentVi, contentEn } = await caller.property.getContent()

  // Read booking portal message files to show current defaults in form
  let messagesVi: Record<string, unknown> = {}
  let messagesEn: Record<string, unknown> = {}
  try {
    const { readFileSync } = await import("fs")
    const { resolve } = await import("path")
    const base = resolve(process.cwd(), "../booking/messages")
    messagesVi = JSON.parse(readFileSync(resolve(base, "vi.json"), "utf-8")) as Record<string, unknown>
    messagesEn = JSON.parse(readFileSync(resolve(base, "en.json"), "utf-8")) as Record<string, unknown>
  } catch {
    // fallback: empty defaults if files not found
  }

  const defaultsVi = extractDefaults(messagesVi)
  const defaultsEn = extractDefaults(messagesEn)

  const initialVi = mergeWithDefaults(defaultsVi, contentVi) as unknown as Record<string, unknown>
  const initialEn = mergeWithDefaults(defaultsEn, contentEn) as unknown as Record<string, unknown>

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500 mb-6">
        Nội dung hiển thị trên trang đặt phòng (localhost:3000). Lưu xong trang portal tự cập nhật ngay.
      </p>
      <ContentForm initialVi={initialVi} initialEn={initialEn} />
    </div>
  )
}
