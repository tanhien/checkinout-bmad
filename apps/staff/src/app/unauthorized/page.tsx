import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-6" role="img" aria-label="Khóa">
        🔒
      </span>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bạn không có quyền truy cập</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Trang này yêu cầu quyền cao hơn. Liên hệ quản lý nếu bạn cần truy cập.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Về Dashboard
      </Link>
    </div>
  )
}
