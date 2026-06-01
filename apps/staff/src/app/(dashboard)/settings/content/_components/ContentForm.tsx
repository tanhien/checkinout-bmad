"use client"

import { useState, useTransition } from "react"
import { updateContentAction } from "../actions"

type WhyItem = { title: string; desc: string }

export type PropertyContent = {
  footerTagline?: string
  story?: string
  locationDesc?: string
  teamDesc?: string
  awards?: string[]
  cancelPolicy?: string
  childrenPolicy?: string
  petsPolicy?: string
  smokingPolicy?: string
  paymentPolicy?: string
  whyItems?: {
    free_cancel?: WhyItem
    best_price?: WhyItem
    heritage?: WhyItem
    spa?: WhyItem
  }
}

const WHY_SLOTS = [
  { key: "free_cancel", label: "Lý do 1" },
  { key: "best_price",  label: "Lý do 2" },
  { key: "heritage",    label: "Lý do 3" },
  { key: "spa",         label: "Lý do 4" },
] as const

function toContent(raw: Record<string, unknown>): PropertyContent {
  return raw as unknown as PropertyContent
}

function ContentPanel({
  locale,
  initial,
}: {
  locale: "vi" | "en"
  initial: Record<string, unknown>
}) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ success?: boolean; error?: string } | null>(null)
  const data = toContent(initial)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string | null) ?? ""

    const awards = get("awards")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const whyItems: PropertyContent["whyItems"] = {}
    for (const slot of WHY_SLOTS) {
      const title = get(`why_${slot.key}_title`)
      const desc  = get(`why_${slot.key}_desc`)
      if (title || desc) whyItems[slot.key] = { title, desc }
    }

    const content: PropertyContent = {
      footerTagline:  get("footerTagline")  || undefined,
      story:          get("story")          || undefined,
      locationDesc:   get("locationDesc")   || undefined,
      teamDesc:       get("teamDesc")       || undefined,
      awards:         awards.length ? awards : undefined,
      cancelPolicy:   get("cancelPolicy")   || undefined,
      childrenPolicy: get("childrenPolicy") || undefined,
      petsPolicy:     get("petsPolicy")     || undefined,
      smokingPolicy:  get("smokingPolicy")  || undefined,
      paymentPolicy:  get("paymentPolicy")  || undefined,
      whyItems:       Object.keys(whyItems).length ? whyItems : undefined,
    }

    startTransition(async () => {
      const res = await updateContentAction(locale, content as Record<string, unknown>)
      setMsg(res)
      setTimeout(() => setMsg(null), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {msg?.success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Đã lưu thành công</div>
      )}
      {msg?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{msg.error}</div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <Section title="Footer">
        <Field label="Tagline" name="footerTagline" defaultValue={data.footerTagline ?? ""} />
      </Section>

      {/* ── Home — Tại sao chọn chúng tôi ─────────────────────────────────── */}
      <Section title="Trang chủ — Tại sao chọn chúng tôi">
        {WHY_SLOTS.map((slot) => (
          <div key={slot.key} className="rounded-lg border border-gray-200 p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{slot.label}</p>
            <Field
              label="Tiêu đề"
              name={`why_${slot.key}_title`}
              defaultValue={data.whyItems?.[slot.key]?.title ?? ""}
            />
            <Textarea
              label="Mô tả"
              name={`why_${slot.key}_desc`}
              rows={2}
              defaultValue={data.whyItems?.[slot.key]?.desc ?? ""}
            />
          </div>
        ))}
      </Section>

      {/* ── Giới thiệu ─────────────────────────────────────────────────────── */}
      <Section title="Trang Giới thiệu">
        <Textarea label="Câu chuyện khách sạn" name="story" rows={6} defaultValue={data.story ?? ""} />
        <Textarea label="Vị trí" name="locationDesc" rows={3} defaultValue={data.locationDesc ?? ""} />
        <Textarea label="Đội ngũ" name="teamDesc" rows={3} defaultValue={data.teamDesc ?? ""} />
        <Textarea
          label="Giải thưởng (mỗi dòng một giải)"
          name="awards"
          rows={4}
          defaultValue={(data.awards ?? []).join("\n")}
        />
      </Section>

      {/* ── Chính sách ─────────────────────────────────────────────────────── */}
      <Section title="Chính sách khách sạn">
        <Textarea label="Chính sách hủy phòng" name="cancelPolicy" rows={2} defaultValue={data.cancelPolicy ?? ""} />
        <Textarea label="Chính sách trẻ em" name="childrenPolicy" rows={2} defaultValue={data.childrenPolicy ?? ""} />
        <Textarea label="Thú cưng" name="petsPolicy" rows={2} defaultValue={data.petsPolicy ?? ""} />
        <Textarea label="Hút thuốc" name="smokingPolicy" rows={2} defaultValue={data.smokingPolicy ?? ""} />
        <Textarea label="Thanh toán" name="paymentPolicy" rows={2} defaultValue={data.paymentPolicy ?? ""} />
      </Section>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Đang lưu..." : "Lưu nội dung"}
      </button>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-800 border-b border-gray-200 pb-2">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function Textarea({
  label,
  name,
  rows,
  defaultValue,
}: {
  label: string
  name: string
  rows: number
  defaultValue: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
      />
    </div>
  )
}

// ─── Main export with VI/EN tab switcher ──────────────────────────────────────

export function ContentForm({
  initialVi,
  initialEn,
}: {
  initialVi: Record<string, unknown>
  initialEn: Record<string, unknown>
}) {
  const [tab, setTab] = useState<"vi" | "en">("vi")

  return (
    <div className="max-w-2xl">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(["vi", "en"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={[
              "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors",
              tab === l
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {l === "vi" ? "Tiếng Việt" : "English"}
          </button>
        ))}
      </div>

      {tab === "vi" ? (
        <ContentPanel key="vi" locale="vi" initial={initialVi} />
      ) : (
        <ContentPanel key="en" locale="en" initial={initialEn} />
      )}
    </div>
  )
}
