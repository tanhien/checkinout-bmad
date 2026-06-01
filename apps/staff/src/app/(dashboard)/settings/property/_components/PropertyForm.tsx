"use client"

import { useState, useTransition } from "react"
import { updatePropertyAction } from "../actions"

type Property = {
  name: string
  type: string
  address: string
  phone: string
  email: string
  tagline: string | null
  description: string | null
  checkInHour: number
  checkOutHour: number
  timezone: string
  currency: string
  wifiPassword: string | null
  breakfastHours: string | null
  freeCancelHours: number | null
  childMaxAge: number
  walkinMaxDays: number
  maxAdvanceDays: number
  minStayNights: number
  taxCode: string | null
  bankAccount: string | null
  emailTemplate: string | null
}

export function PropertyForm({ property }: { property: Property }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updatePropertyAction(fd)
      setResult(res)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {result?.success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Đã lưu thành công</div>
      )}
      {result?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{result.error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tên khách sạn" name="name" defaultValue={property.name} required />
        <Field label="Múi giờ" name="timezone" defaultValue={property.timezone} />
      </div>

      <Field label="Địa chỉ" name="address" defaultValue={property.address} required />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Điện thoại" name="phone" defaultValue={property.phone} />
        <Field label="Email" name="email" type="email" defaultValue={property.email} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tagline" name="tagline" defaultValue={property.tagline ?? ""} />
        <Field label="Đơn vị tiền tệ (3 ký tự)" name="currency" defaultValue={property.currency} maxLength={3} />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">Mô tả</label>
        <textarea
          name="description"
          defaultValue={property.description ?? ""}
          rows={4}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Giờ check-in" name="checkInHour" defaultValue={property.checkInHour} min={0} max={23} />
        <NumberField label="Giờ check-out" name="checkOutHour" defaultValue={property.checkOutHour} min={0} max={23} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mật khẩu WiFi" name="wifiPassword" defaultValue={property.wifiPassword ?? ""} />
        <Field label="Giờ phục vụ bữa sáng" name="breakfastHours" defaultValue={property.breakfastHours ?? ""} placeholder="VD: 06:30-10:00" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumberField label="Miễn phí hủy trước (giờ)" name="freeCancelHours" defaultValue={property.freeCancelHours ?? 0} min={0} />
        <NumberField label="Tuổi trẻ em tối đa" name="childMaxAge" defaultValue={property.childMaxAge} min={0} max={17} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <NumberField label="Walk-in tối đa (ngày)" name="walkinMaxDays" defaultValue={property.walkinMaxDays} min={0} />
        <NumberField label="Đặt trước tối đa (ngày)" name="maxAdvanceDays" defaultValue={property.maxAdvanceDays} min={1} />
        <NumberField label="Ở tối thiểu (đêm)" name="minStayNights" defaultValue={property.minStayNights} min={1} />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">Thông tin hóa đơn</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Mã số thuế (VAT)" name="taxCode" defaultValue={property.taxCode ?? ""} placeholder="VD: 0123456789" />
          <Field label="Số tài khoản ngân hàng" name="bankAccount" defaultValue={property.bankAccount ?? ""} placeholder="VD: Vietcombank - 1234567890" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  maxLength,
  placeholder,
}: {
  label: string
  name: string
  defaultValue?: string
  type?: string
  required?: boolean
  maxLength?: number
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function NumberField({
  label,
  name,
  defaultValue,
  min,
  max,
}: {
  label: string
  name: string
  defaultValue?: number
  min?: number
  max?: number
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}
