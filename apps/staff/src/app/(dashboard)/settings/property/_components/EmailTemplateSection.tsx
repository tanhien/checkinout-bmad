"use client"

import { useState, useTransition } from "react"
import { updateEmailTemplateAction, previewEmailTemplateAction } from "../actions"

const TEMPLATE_VARS = [
  "{{guestName}}", "{{confirmationCode}}", "{{checkIn}}", "{{checkOut}}",
  "{{roomType}}", "{{propertyName}}", "{{propertyAddress}}", "{{qrCodeImage}}",
]

export function EmailTemplateSection({
  currentTemplate,
  defaultTemplate,
}: {
  currentTemplate: string | null
  defaultTemplate: string
}) {
  const [template, setTemplate] = useState(currentTemplate ?? defaultTemplate)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  function handleSave() {
    setResult(null)
    startTransition(async () => {
      const res = await updateEmailTemplateAction(template)
      setResult(res)
    })
  }

  function handleRestore() {
    setTemplate(defaultTemplate)
    setPreviewHtml(null)
    setShowPreview(false)
    setResult(null)
    startTransition(async () => {
      const res = await updateEmailTemplateAction(null)
      setResult(res)
    })
  }

  function handlePreview() {
    startTransition(async () => {
      const res = await previewEmailTemplateAction(template)
      if ("html" in res && res.html) {
        setPreviewHtml(res.html)
        setShowPreview(true)
      } else if ("error" in res) {
        setResult({ error: res.error })
      }
    })
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Mẫu Email Xác Nhận</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Sử dụng cú pháp Handlebars. Các biến khả dụng:
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {TEMPLATE_VARS.map((v) => (
              <code
                key={v}
                className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                onClick={() => setTemplate((t) => t + v)}
                title="Click để thêm vào template"
              >
                {v}
              </code>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isPending ? "..." : "👁 Xem trước"}
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isPending}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            ↩ Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {isPending ? "Đang lưu..." : "Lưu template"}
          </button>
        </div>
      </div>

      {result?.success && (
        <p className="mb-3 text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">Đã lưu template thành công.</p>
      )}
      {result?.error && (
        <p className="mb-3 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">{result.error}</p>
      )}

      <textarea
        value={template}
        onChange={(e) => { setTemplate(e.target.value); setShowPreview(false) }}
        rows={18}
        spellCheck={false}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
        placeholder="Nhập HTML template..."
      />

      {showPreview && previewHtml && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">Xem trước (dữ liệu mẫu):</p>
            <button onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-gray-600">
              ✕ Đóng
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-80"
              sandbox="allow-same-origin"
              title="Email Preview"
            />
          </div>
        </div>
      )}
    </div>
  )
}
