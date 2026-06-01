import { redirect } from "next/navigation"
import { getStaffSession } from "@/lib/auth"
import { ChangePasswordForm } from "./_ChangePasswordForm"

export default async function AccountPage() {
  const session = await getStaffSession()
  if (!session) redirect("/login")

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Tài khoản của tôi</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Đổi mật khẩu</h2>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
