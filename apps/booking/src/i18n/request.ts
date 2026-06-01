import { getRequestConfig } from "next-intl/server"
import { routing } from "./routing"
import { getPortalCaller } from "@/lib/portal-caller"

// Deep-merge: DB overrides take priority over JSON defaults.
// `override` is the flat PropertyContent object stored in contentVi / contentEn.
function applyContentOverrides(
  messages: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result = JSON.parse(JSON.stringify(messages)) as Record<string, unknown>

  function set(obj: Record<string, unknown>, path: string[], value: unknown) {
    let cur = obj
    for (let i = 0; i < path.length - 1; i++) {
      if (typeof cur[path[i]!] !== "object" || cur[path[i]!] === null) {
        cur[path[i]!] = {}
      }
      cur = cur[path[i]!] as Record<string, unknown>
    }
    cur[path[path.length - 1]!] = value
  }

  const KEY_MAP: Record<string, string> = {
    footerTagline: "footer.tagline",
    story:         "about.story",
    locationDesc:  "about.location_desc",
    teamDesc:      "about.team_desc",
    cancelPolicy:  "about.policies.cancel.value",
    childrenPolicy:"about.policies.children.value",
    petsPolicy:    "about.policies.pets.value",
    smokingPolicy: "about.policies.smoking.value",
    paymentPolicy: "about.policies.payment.value",
  }

  for (const [key, value] of Object.entries(override)) {
    if (value == null || value === "") continue
    const mapped = KEY_MAP[key]
    if (mapped) {
      set(result, mapped.split("."), value)
    } else if (key === "awards" && Array.isArray(value)) {
      set(result, ["about", "awards"], value)
    } else if (key === "whyItems" && typeof value === "object") {
      const wi = value as Record<string, { title?: string; desc?: string }>
      for (const [slot, item] of Object.entries(wi)) {
        if (item.title) set(result, ["home", "why", slot, "title"], item.title)
        if (item.desc)  set(result, ["home", "why", slot, "desc"],  item.desc)
      }
    }
  }

  return result
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as "vi" | "en")) {
    locale = routing.defaultLocale
  }

  const base = (await import(`../../messages/${locale}.json`)).default as Record<string, unknown>

  try {
    const caller = await getPortalCaller()
    const { contentVi, contentEn } = await caller.portal.getContent()
    const override = locale === "vi" ? contentVi : contentEn
    if (override && Object.keys(override).length > 0) {
      return { locale, messages: applyContentOverrides(base, override) }
    }
  } catch {
    // Fallback to base messages on any error
  }

  return { locale, messages: base }
})
