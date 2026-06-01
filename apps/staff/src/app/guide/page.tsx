import Link from "next/link"

// ─── Section heading ────────────────────────────────────────────────────────

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-10 mb-4 text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 scroll-mt-20"
    >
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 mb-3 text-base font-semibold text-gray-800">{children}</h3>
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {children}
    </span>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
      💡 {children}
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
      ⚠️ {children}
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        {children && <p className="text-sm text-gray-600 mt-0.5">{children}</p>}
      </div>
    </div>
  )
}

function FlowArrow() {
  return <span className="mx-2 text-gray-400">→</span>
}

// ─── Table of Contents ───────────────────────────────────────────────────────

const TOC = [
  { id: "overview", label: "1. Tổng quan hệ thống" },
  { id: "accounts", label: "2. Loại tài khoản & phân quyền" },
  { id: "login", label: "3. Đăng nhập" },
  { id: "setup", label: "4. Khai báo dữ liệu ban đầu" },
  { id: "dashboard", label: "5. Dashboard" },
  { id: "bookings", label: "6. Quản lý Booking" },
  { id: "checkin", label: "7. Flow Check-in" },
  { id: "checkout", label: "8. Flow Check-out" },
  { id: "rooms", label: "9. Quản lý Phòng" },
  { id: "housekeeping", label: "10. Housekeeping" },
  { id: "guests", label: "11. Khách hàng" },
  { id: "folio", label: "12. Folio & Thanh toán" },
  { id: "reports", label: "13. Báo cáo" },
  { id: "settings", label: "14. Cấu hình hệ thống" },
  { id: "recommendations", label: "15. Khuyến nghị vận hành" },
]

// ─── Page ───────────────────────────────────────────────────────────────────

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top banner */}
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏨</span>
          <div>
            <p className="font-bold text-lg leading-none">Hotel Staff — Hướng dẫn sử dụng</p>
            <p className="text-blue-200 text-sm mt-0.5">Lạc Hồng Boutique Hotel & Spa · Phiên bản 1.0</p>
          </div>
        </div>
        <Link href="/login" className="rounded-lg bg-white/20 hover:bg-white/30 px-4 py-2 text-sm font-medium transition-colors">
          Đăng nhập →
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar TOC — sticky */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-6 rounded-xl bg-white shadow-sm ring-1 ring-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mục lục</p>
            <nav className="space-y-1">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 px-8 py-8">

            {/* ── 1. Tổng quan ── */}
            <H2 id="overview">1. Tổng quan hệ thống</H2>
            <p className="text-gray-700 mb-4">
              Hệ thống quản lý khách sạn bao gồm <strong>3 ứng dụng</strong> hoạt động liên thông:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: "🖥️",
                  name: "Staff Management Web",
                  url: "localhost:3001",
                  desc: "Quản lý toàn bộ vận hành: đặt phòng, phòng, thanh toán, báo cáo",
                  color: "border-blue-300 bg-blue-50",
                },
                {
                  icon: "📟",
                  name: "Kiosk App",
                  url: "localhost:3002",
                  desc: "Kiosk tự phục vụ cho khách: check-in, check-out, đặt phòng walk-in",
                  color: "border-purple-300 bg-purple-50",
                },
                {
                  icon: "🌐",
                  name: "Booking Portal",
                  url: "localhost:3000",
                  desc: "Cổng đặt phòng online cho khách: tìm phòng, đặt phòng, quản lý đặt chỗ",
                  color: "border-green-300 bg-green-50",
                },
              ].map((app) => (
                <div key={app.url} className={`rounded-xl border-2 ${app.color} p-4`}>
                  <p className="text-2xl mb-2">{app.icon}</p>
                  <p className="font-semibold text-gray-900 text-sm">{app.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{app.url}</p>
                  <p className="text-xs text-gray-600 mt-2">{app.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Tài liệu này hướng dẫn sử dụng <strong>Staff Management Web</strong> (trang bạn đang xem — localhost:3001).
              Dữ liệu đặt phòng từ Kiosk và Booking Portal đều hiển thị đồng bộ real-time tại đây.
            </p>

            {/* ── 2. Tài khoản & phân quyền ── */}
            <H2 id="accounts">2. Loại tài khoản & phân quyền</H2>

            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 rounded-tl-lg">Vai trò</th>
                    <th className="text-left px-4 py-2.5">Dashboard</th>
                    <th className="text-left px-4 py-2.5">Booking</th>
                    <th className="text-left px-4 py-2.5">Phòng</th>
                    <th className="text-left px-4 py-2.5">Housekeeping</th>
                    <th className="text-left px-4 py-2.5">Khách hàng</th>
                    <th className="text-left px-4 py-2.5">Folio</th>
                    <th className="text-left px-4 py-2.5">Báo cáo</th>
                    <th className="text-left px-4 py-2.5 rounded-tr-lg">Cấu hình</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    {
                      role: "ADMIN", label: "Quản trị viên", color: "bg-red-100 text-red-800",
                      dash: "✅", book: "✅", room: "✅", hk: "✅", guest: "✅", folio: "✅", report: "✅", config: "✅",
                    },
                    {
                      role: "MANAGER", label: "Quản lý", color: "bg-orange-100 text-orange-800",
                      dash: "✅", book: "✅", room: "✅", hk: "✅", guest: "✅", folio: "✅", report: "✅", config: "Nhân viên",
                    },
                    {
                      role: "FRONT_DESK", label: "Lễ tân", color: "bg-blue-100 text-blue-800",
                      dash: "✅", book: "✅", room: "✅", hk: "✅", guest: "✅", folio: "✅", report: "—", config: "—",
                    },
                    {
                      role: "HOUSEKEEPING", label: "Buồng phòng", color: "bg-green-100 text-green-800",
                      dash: "Phòng của mình", book: "—", room: "—", hk: "✅", guest: "—", folio: "—", report: "—", config: "—",
                    },
                    {
                      role: "ACCOUNTANT", label: "Kế toán", color: "bg-purple-100 text-purple-800",
                      dash: "✅", book: "✅ (xem)", room: "—", hk: "—", guest: "✅", folio: "✅", report: "✅", config: "—",
                    },
                  ].map((r) => (
                    <tr key={r.role} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.color}`}>{r.label}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.dash}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.book}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.room}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.hk}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.guest}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.folio}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.report}</td>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{r.config}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <H3>Ghi chú phân quyền</H3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><strong>ADMIN</strong> — toàn quyền hệ thống, bao gồm xóa mềm, cấu hình, quản lý nhân viên</li>
              <li><strong>MANAGER</strong> — quản lý vận hành hằng ngày; có thể áp dụng discount &gt;10% trên folio</li>
              <li><strong>FRONT_DESK</strong> — thao tác trực tiếp với khách: nhận phòng, trả phòng, tạo booking, ghi nhận thanh toán</li>
              <li><strong>HOUSEKEEPING</strong> — chỉ thấy phòng được phân công; cập nhật trạng thái phòng</li>
              <li><strong>ACCOUNTANT</strong> — xem booking/khách hàng/folio, xuất báo cáo, không tạo/sửa booking</li>
            </ul>

            {/* ── 3. Đăng nhập ── */}
            <H2 id="login">3. Đăng nhập</H2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <H3>Tài khoản demo mặc định</H3>
                <div className="rounded-xl bg-gray-50 border border-gray-200 divide-y divide-gray-200 text-sm">
                  {[
                    { email: "admin@demo.hotel", pass: "Admin123!", role: "ADMIN" },
                  ].map((u) => (
                    <div key={u.email} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gray-800">{u.email}</span>
                        <Badge color="bg-red-100 text-red-800">{u.role}</Badge>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">Mật khẩu: <span className="font-mono">{u.pass}</span></p>
                    </div>
                  ))}
                </div>
                <Tip>Sau khi đăng nhập admin, hãy vào <strong>Cấu hình → Nhân viên</strong> để tạo tài khoản cho các vai trò khác.</Tip>
              </div>
              <div>
                <H3>Quy trình đặt lại mật khẩu</H3>
                <Step n={1} title="Nhấn «Quên mật khẩu»" />
                <Step n={2} title="Nhập email đăng ký">Hệ thống gửi link reset qua email (có hiệu lực 24h)</Step>
                <Step n={3} title="Mở link trong email → đặt mật khẩu mới" />
                <Step n={4} title="Đăng nhập với mật khẩu mới" />
                <H3>Onboarding nhân viên mới</H3>
                <p className="text-sm text-gray-700">
                  Admin tạo tài khoản → hệ thống gửi email chứa link <strong>Set Password</strong> (hiệu lực 72h).
                  Nhân viên mới nhấn link, đặt mật khẩu lần đầu là hoàn tất.
                </p>
              </div>
            </div>

            {/* ── 4. Khai báo dữ liệu ── */}
            <H2 id="setup">4. Khai báo dữ liệu ban đầu</H2>
            <p className="text-sm text-gray-700 mb-4">
              Thực hiện theo thứ tự sau khi triển khai hệ thống lần đầu. Tất cả cấu hình nằm trong menu <strong>Cấu hình</strong> (chỉ Admin).
            </p>

            <div className="space-y-3">
              {[
                {
                  n: 1, title: "Thông tin khách sạn", path: "/settings/property",
                  desc: "Tên, địa chỉ, số điện thoại, email, MST, tài khoản ngân hàng, giờ nhận/trả phòng. Thông tin này in lên hóa đơn PDF và email xác nhận.",
                  fields: ["Tên khách sạn", "Địa chỉ", "SĐT", "Email", "Mã số thuế (MST)", "Tài khoản ngân hàng", "Giờ check-in / check-out"],
                },
                {
                  n: 2, title: "Loại phòng (Room Types)", path: "/settings/room-types",
                  desc: "Tạo các hạng phòng: Standard, Deluxe, Suite... Mỗi loại có diện tích, sức chứa, tiện nghi, ảnh (tối đa 10 ảnh, upload lên Cloudflare R2).",
                  fields: ["Tên loại phòng", "Slug URL", "Diện tích m²", "Sức chứa người lớn/trẻ em", "Loại giường", "Tiện nghi", "Ảnh phòng"],
                },
                {
                  n: 3, title: "Phòng cụ thể (Rooms)", path: "/settings/rooms",
                  desc: "Tạo từng phòng vật lý: số phòng, tầng, gán vào loại phòng. Trạng thái ban đầu là CLEAN.",
                  fields: ["Số phòng", "Tầng", "Loại phòng"],
                },
                {
                  n: 4, title: "Gói giá (Rate Plans)", path: "/settings/rate-plans",
                  desc: "Cấu hình giá theo ngày thường/cuối tuần, % giảm giá theo gói, chính sách hoàn tiền.",
                  fields: ["Tên gói", "Giá ngày thường", "Giá cuối tuần (T6/T7/CN)", "% giảm giá", "Hoàn tiền (có/không)", "Giờ hủy miễn phí"],
                },
                {
                  n: 5, title: "Dịch vụ & phụ phí", path: "/settings/services",
                  desc: "Các dịch vụ bán thêm: spa, breakfast, laundry... được chọn khi thêm phụ phí vào folio.",
                  fields: ["Tên dịch vụ", "Giá mặc định", "Đơn vị tính"],
                },
                {
                  n: 6, title: "Thuế (Tax Rates)", path: "/settings/taxes",
                  desc: "Cấu hình VAT, phí dịch vụ áp dụng cho phòng hoặc dịch vụ. Tự động tính khi thêm phụ phí vào folio.",
                  fields: ["Tên thuế", "% thuế suất", "Áp dụng cho (Room / Service / All)"],
                },
                {
                  n: 7, title: "Mã khuyến mãi", path: "/settings/promo-codes",
                  desc: "Tạo mã giảm giá cho booking portal: DEMO2025, HOIAN30...",
                  fields: ["Mã code", "Loại giảm (% hoặc số tiền cố định)", "Giá trị", "Số lần dùng tối đa", "Ngày hết hạn"],
                },
                {
                  n: 8, title: "Tài khoản nhân viên", path: "/settings/staff",
                  desc: "Tạo tài khoản cho từng nhân viên với vai trò phù hợp. Hệ thống tự gửi email onboarding.",
                  fields: ["Họ tên", "Email", "Vai trò (Role)"],
                },
                {
                  n: 9, title: "Template email", path: "/settings/property",
                  desc: "Tùy chỉnh nội dung email xác nhận booking bằng Handlebars. Có nút Preview trước khi lưu.",
                  fields: ["{{guestName}}", "{{confirmationCode}}", "{{checkIn}}", "{{checkOut}}", "{{roomType}}", "{{qrCodeImage}}"],
                },
              ].map((item) => (
                <div key={item.n} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                      {item.n}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <span className="text-xs text-gray-400 font-mono">{item.path}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.fields.map((f) => (
                          <span key={f} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── 5. Dashboard ── */}
            <H2 id="dashboard">5. Dashboard</H2>
            <p className="text-sm text-gray-700 mb-3">
              Trang chủ sau khi đăng nhập. Tự động làm mới mỗi 60 giây.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <H3>Dashboard lễ tân (FRONT_DESK / MANAGER / ADMIN)</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📊 <strong>Số liệu hôm nay:</strong> Arrivals, Departures, Đang ở, Phòng trống, Công suất %</li>
                  <li>🔔 <strong>Cảnh báo Kiosk:</strong> Hiển thị khi khách nhấn nút «Gọi nhân viên» tại kiosk. Âm thanh beep + nút Dismiss</li>
                  <li>📈 <strong>Biểu đồ dự báo:</strong> 14 ngày tới — arrivals, departures, công suất theo ngày</li>
                  <li>🏠 <strong>Widget trạng thái phòng:</strong> Tổng quan CLEAN/DIRTY/OCCUPIED</li>
                  <li>⚡ <strong>Shortcut nhanh:</strong> Arrivals hôm nay, Departures hôm nay → nhảy vào danh sách booking</li>
                </ul>
              </div>
              <div>
                <H3>Dashboard buồng phòng (HOUSEKEEPING)</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>🧹 Chỉ hiển thị <strong>phòng được phân công</strong> cho nhân viên đó hôm nay</li>
                  <li>Thẻ phòng: số phòng, loại phòng, tầng, trạng thái hiện tại</li>
                  <li>Trạng thái màu: Xanh = CLEAN/Inspected · Đỏ = DIRTY · Tím = CLEANING · Cam = MAINTENANCE</li>
                </ul>
                <Tip>Cập nhật trạng thái phòng từ trang Housekeeping (Kanban board).</Tip>
              </div>
            </div>

            {/* ── 6. Booking ── */}
            <H2 id="bookings">6. Quản lý Booking</H2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <H3>Danh sách booking (/bookings)</H3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>🔍 <strong>Tìm kiếm:</strong> Tên khách, mã xác nhận, SĐT</li>
                  <li>📅 <strong>Lọc:</strong> Theo trạng thái, ngày check-in/out, loại phòng, kênh đặt</li>
                  <li>📑 <strong>Phân trang:</strong> 25 booking/trang</li>
                  <li>🏷️ <strong>Badge kênh:</strong> Trực tiếp · Kiosk · Điện thoại · Walk-in · OTA</li>
                  <li>🏷️ <strong>Badge trạng thái:</strong> Đã đặt · Đang ở · Đã trả phòng · Đã hủy · Không đến</li>
                </ul>

                <H3>Tạo booking mới (/bookings/new)</H3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Tìm khách có sẵn hoặc nhập thông tin mới</li>
                  <li>Chọn loại phòng, ngày check-in/out, số người</li>
                  <li>Chọn rate plan và xem giá tự động tính</li>
                  <li>Ghi chú nội bộ (không hiển thị cho khách)</li>
                  <li>Hệ thống cấp mã xác nhận <code className="bg-gray-100 px-1 rounded text-xs">HTL-{"{"}YEAR{"}"}-{"{"}6KY{"}"}</code></li>
                </ul>
              </div>
              <div>
                <H3>Chi tiết booking (/bookings/[id])</H3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>📋 Thông tin đầy đủ: khách, phòng, ngày, kênh, mã xác nhận</li>
                  <li>🛏️ <strong>Xếp phòng:</strong> Gán phòng cụ thể (chọn từ danh sách phòng khả dụng)</li>
                  <li>✅ <strong>Check-in:</strong> Kích hoạt sau giờ check-in (mặc định 14:00)</li>
                  <li>🚪 <strong>Check-out:</strong> Chuyển trạng thái → phòng thành DIRTY</li>
                  <li>❌ <strong>Hủy booking:</strong> Soft-delete, ghi lý do</li>
                  <li>🚫 <strong>No-show:</strong> Đánh dấu khách không đến</li>
                  <li>📜 <strong>Audit log:</strong> Lịch sử mọi thay đổi với timestamp và nhân viên thực hiện</li>
                </ul>
              </div>
            </div>

            {/* ── 7. Check-in Flow ── */}
            <H2 id="checkin">7. Flow Check-in</H2>

            <div className="rounded-xl bg-green-50 border border-green-200 p-5 mb-4">
              <p className="font-semibold text-green-900 mb-3">Quy trình check-in chuẩn (Staff thực hiện)</p>
              <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-green-800">
                <span className="bg-white rounded px-2 py-1 border border-green-200">Tìm booking</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-green-200">Kiểm tra thông tin</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-green-200">Xếp phòng</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-green-200">Nhấn Check-in</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-green-200 font-bold">✅ CHECKED_IN</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-2">Điều kiện check-in</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>✅ Booking ở trạng thái <Badge color="bg-blue-100 text-blue-800">CONFIRMED</Badge></li>
                  <li>✅ Thời gian hiện tại ≥ giờ check-in (14:00 mặc định)</li>
                  <li>✅ Đã gán ít nhất 1 phòng</li>
                </ul>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="font-semibold text-gray-900 mb-2">Check-in qua Kiosk (tự phục vụ)</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Khách nhập mã xác nhận hoặc quét QR</li>
                  <li>Kiosk tự động xếp phòng (optimistic locking)</li>
                  <li>Thông báo realtime xuất hiện trên Dashboard staff</li>
                </ul>
              </div>
            </div>

            {/* ── 8. Check-out Flow ── */}
            <H2 id="checkout">8. Flow Check-out</H2>

            <div className="rounded-xl bg-orange-50 border border-orange-200 p-5 mb-4">
              <p className="font-semibold text-orange-900 mb-3">Quy trình check-out chuẩn</p>
              <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-orange-800">
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Tìm booking (CHECKED_IN)</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Mở Folio</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Kiểm tra phụ phí</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Ghi nhận thanh toán</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Nhấn Check-out</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200 font-bold">✅ CHECKED_OUT</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-orange-200">Settle Folio</span>
              </div>
            </div>
            <Warning>
              Phòng chuyển sang trạng thái <strong>DIRTY</strong> tự động sau khi check-out. Housekeeping sẽ nhận được thông báo.
            </Warning>

            {/* ── 9. Phòng ── */}
            <H2 id="rooms">9. Quản lý Phòng</H2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <H3>Danh sách phòng (/rooms)</H3>
                <p className="text-sm text-gray-700 mb-3">
                  Hiển thị tất cả phòng theo loại. Có thể lọc theo trạng thái và loại phòng.
                </p>
                <div className="space-y-2">
                  {[
                    { status: "CLEAN", color: "bg-green-100 text-green-800", desc: "Phòng sạch, sẵn sàng cho khách" },
                    { status: "DIRTY", color: "bg-red-100 text-red-800", desc: "Cần dọn dẹp sau check-out" },
                    { status: "CLEANING", color: "bg-purple-100 text-purple-800", desc: "Đang được dọn" },
                    { status: "INSPECTED", color: "bg-teal-100 text-teal-800", desc: "Đã kiểm tra, xác nhận sạch" },
                    { status: "OCCUPIED", color: "bg-gray-100 text-gray-800", desc: "Có khách đang lưu trú" },
                    { status: "MAINTENANCE", color: "bg-orange-100 text-orange-800", desc: "Đang bảo trì, không bán" },
                  ].map((s) => (
                    <div key={s.status} className="flex items-center gap-2 text-sm">
                      <Badge color={s.color}>{s.status}</Badge>
                      <span className="text-gray-600">{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <H3>Thao tác trên phòng</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>🔄 <strong>Đổi trạng thái:</strong> Chuyển DIRTY → CLEAN sau khi dọn dẹp</li>
                  <li>🔧 <strong>Đặt bảo trì:</strong> Chuyển sang MAINTENANCE (phòng không khả dụng để đặt)</li>
                  <li>🛏️ <strong>Xếp phòng:</strong> Gán phòng cho booking từ trang chi tiết booking</li>
                </ul>
                <Tip>
                  Phòng có trạng thái MAINTENANCE hoặc OCCUPIED sẽ không xuất hiện trong danh sách khả dụng khi đặt phòng.
                </Tip>
              </div>
            </div>

            {/* ── 10. Housekeeping ── */}
            <H2 id="housekeeping">10. Housekeeping</H2>

            <p className="text-sm text-gray-700 mb-4">
              Kanban board quản lý trạng thái dọn phòng real-time.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <H3>Tính năng</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📋 <strong>Kanban:</strong> Các cột DIRTY · CLEANING · CLEAN · INSPECTED · MAINTENANCE</li>
                  <li>👤 <strong>Phân công:</strong> Gán phòng cho nhân viên buồng phòng cụ thể</li>
                  <li>⏱️ <strong>Thời gian:</strong> Tracking thời gian bắt đầu dọn</li>
                  <li>📅 <strong>Upcoming check-in:</strong> Hiển thị phòng có khách sắp đến</li>
                  <li>🔔 <strong>Realtime:</strong> Cập nhật tức thì qua WebSocket</li>
                </ul>
              </div>
              <div>
                <H3>Workflow housekeeping</H3>
                <Step n={1} title="Manager/Lễ tân phân công phòng" />
                <Step n={2} title="HK nhân viên xem Dashboard → danh sách phòng được giao" />
                <Step n={3} title="Bắt đầu dọn → kéo thẻ phòng sang cột CLEANING" />
                <Step n={4} title="Hoàn thành → kéo sang CLEAN" />
                <Step n={5} title="Manager kiểm tra → chuyển sang INSPECTED (tùy chọn)" />
              </div>
            </div>

            {/* ── 11. Khách hàng ── */}
            <H2 id="guests">11. Khách hàng</H2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <H3>Danh sách khách (/guests)</H3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>🔍 Tìm kiếm theo tên, email, SĐT, quốc tịch</li>
                  <li>📄 Xem lịch sử booking của từng khách</li>
                  <li>⭐ Chương trình loyalty: điểm tích lũy</li>
                </ul>
              </div>
              <div>
                <H3>Thông tin khách (/guests/[id])</H3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Họ tên, email, SĐT, ngày sinh, quốc tịch</li>
                  <li>CMND/Hộ chiếu (mã hóa AES-256-GCM, chỉ giải mã khi xem)</li>
                  <li>Ghi chú nội bộ về khách</li>
                  <li>Toàn bộ lịch sử đặt phòng</li>
                </ul>
                <Tip>Thông tin CMND/Passport được mã hóa trong DB. Chỉ nhân viên có quyền xem mới thấy.</Tip>
              </div>
            </div>

            {/* ── 12. Folio & Thanh toán ── */}
            <H2 id="folio">12. Folio & Thanh toán</H2>

            <p className="text-sm text-gray-700 mb-3">
              Mỗi booking có 1 Folio tương ứng. Folio ghi nhận tất cả phụ phí và thanh toán.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-4">
              <div>
                <H3>Trang tổng quan Folio (/folio)</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📊 <strong>4 stat cards:</strong> Tổng chưa TT · Quá hạn (CHECKED_OUT) · Đang lưu trú · Xác nhận</li>
                  <li>⚠️ <strong>Section Quá hạn:</strong> Nổi bật cam — booking đã trả phòng nhưng chưa settle folio</li>
                  <li>🔗 <strong>Nhấn «Mở folio»:</strong> Nhảy thẳng vào folio của booking đó</li>
                </ul>

                <H3>Chi tiết Folio (/bookings/[id]/folio)</H3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>📋 Bảng phụ phí: mô tả, SL, đơn giá, thành tiền</li>
                  <li>💰 Tổng phí · Đã thanh toán · Còn lại</li>
                  <li>➕ Thêm phụ phí dịch vụ (spa, breakfast, laundry...)</li>
                  <li>🏷️ Thêm discount (% hoặc số tiền cố định)</li>
                  <li>❌ Void phụ phí (ghi lý do)</li>
                  <li>💳 Ghi nhận thanh toán: Tiền mặt · Thẻ · Chuyển khoản</li>
                  <li>✅ Settle folio (khi đủ thanh toán)</li>
                  <li>📄 Xuất hóa đơn PDF (tiếng Việt, font Arial)</li>
                </ul>
              </div>
              <div>
                <H3>Quy tắc folio</H3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">Trạng thái folio</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-2"><Badge color="bg-blue-100 text-blue-800">OPEN</Badge><span>Đang xử lý</span></div>
                      <div className="flex gap-2"><Badge color="bg-green-100 text-green-800">SETTLED</Badge><span>Đã quyết toán</span></div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">Quyền discount</p>
                    <ul className="mt-2 space-y-1">
                      <li>≤ 10%: FRONT_DESK trở lên</li>
                      <li>&gt; 10%: MANAGER / ADMIN</li>
                    </ul>
                  </div>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">Settle</p>
                    <ul className="mt-2 space-y-1">
                      <li>Chỉ settle được khi booking đã CHECKED_OUT</li>
                      <li>Tổng thanh toán ≥ tổng phí</li>
                      <li>Reopen: chỉ MANAGER / ADMIN</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <H3>Flow thanh toán folio</H3>
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="flex flex-wrap items-center gap-1 text-sm font-medium text-blue-800">
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Check-out xong</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Xem folio</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Thêm phụ phí còn thiếu</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Ghi nhận thanh toán</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Settle folio</span>
                <FlowArrow />
                <span className="bg-white rounded px-2 py-1 border border-blue-200">Xuất PDF</span>
              </div>
            </div>

            {/* ── 13. Báo cáo ── */}
            <H2 id="reports">13. Báo cáo</H2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: "📊",
                  title: "Công suất phòng (/reports/occupancy)",
                  items: [
                    "Biểu đồ % công suất theo ngày/tuần/tháng",
                    "So sánh kỳ trước/hiện tại",
                    "Số phòng bán được, tổng phòng",
                  ],
                },
                {
                  icon: "💰",
                  title: "Doanh thu (/reports/revenue)",
                  items: [
                    "Tổng doanh thu, RevPAR, ADR",
                    "Biểu đồ cột theo ngày/tuần/tháng",
                    "So sánh cùng kỳ",
                  ],
                },
                {
                  icon: "📅",
                  title: "Arrivals & Departures (/reports/arrivals-departures)",
                  items: [
                    "Danh sách khách đến/đi theo ngày",
                    "Lọc theo khoảng ngày",
                    "Trạng thái check-in/out",
                  ],
                },
                {
                  icon: "🔗",
                  title: "Kênh đặt phòng (/reports/channels)",
                  items: [
                    "Phân tích theo kênh: Direct, Kiosk, Phone, Walk-in, OTA",
                    "Số booking và doanh thu theo kênh",
                    "Biểu đồ tỷ lệ phần trăm",
                  ],
                },
              ].map((r) => (
                <div key={r.title} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xl mb-2">{r.icon}</p>
                  <p className="font-semibold text-gray-900 text-sm mb-2">{r.title}</p>
                  <ul className="space-y-1">
                    {r.items.map((i) => <li key={i} className="text-xs text-gray-600">• {i}</li>)}
                  </ul>
                </div>
              ))}
            </div>

            {/* ── 14. Cấu hình ── */}
            <H2 id="settings">14. Cấu hình hệ thống</H2>
            <p className="text-sm text-gray-700 mb-3">
              Chỉ <Badge color="bg-red-100 text-red-800">ADMIN</Badge> có thể truy cập menu <strong>Cấu hình</strong> (ngoại trừ Nhân viên mà MANAGER cũng thấy).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5">Mục cấu hình</th>
                    <th className="text-left px-4 py-2.5">Đường dẫn</th>
                    <th className="text-left px-4 py-2.5">Quyền</th>
                    <th className="text-left px-4 py-2.5">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { name: "Thông tin khách sạn", path: "/settings/property", role: "ADMIN", desc: "Tên, địa chỉ, MST, email template" },
                    { name: "Loại phòng", path: "/settings/room-types", role: "ADMIN", desc: "Tạo/sửa hạng phòng, upload ảnh" },
                    { name: "Phòng", path: "/settings/rooms", role: "ADMIN", desc: "Tạo phòng vật lý, gán loại phòng" },
                    { name: "Gói giá", path: "/settings/rate-plans", role: "ADMIN", desc: "Giá ngày thường/cuối tuần, % discount" },
                    { name: "Dịch vụ", path: "/settings/services", role: "ADMIN", desc: "Dịch vụ bán thêm, giá mặc định" },
                    { name: "Thuế", path: "/settings/taxes", role: "ADMIN", desc: "VAT, phí dịch vụ, % áp dụng tự động" },
                    { name: "Mã khuyến mãi", path: "/settings/promo-codes", role: "ADMIN", desc: "Mã giảm giá cho booking portal" },
                    { name: "Nhân viên", path: "/settings/staff", role: "ADMIN / MANAGER", desc: "Tạo tài khoản, onboarding email" },
                  ].map((row) => (
                    <tr key={row.path} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{row.path}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{row.role}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-600">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── 15. Khuyến nghị ── */}
            <H2 id="recommendations">15. Khuyến nghị vận hành</H2>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: "🔐",
                  title: "Bảo mật tài khoản",
                  items: [
                    "Đổi mật khẩu Admin mặc định ngay sau khi triển khai",
                    "Mỗi nhân viên dùng tài khoản riêng — không dùng chung",
                    "Tạo đúng Role phù hợp với công việc thực tế",
                    "Vô hiệu hóa (isActive: false) ngay khi nhân viên nghỉ việc",
                    "Không chia sẻ thông tin đăng nhập qua chat/email",
                  ],
                },
                {
                  icon: "🏨",
                  title: "Quy trình vận hành",
                  items: [
                    "Kiểm tra Dashboard lúc đầu ca: arrivals, departures hôm nay",
                    "Settle folio ngay sau check-out — tránh tồn đọng quá hạn",
                    "Cập nhật trạng thái phòng real-time trên Housekeeping board",
                    "Xếp phòng trước 1 ngày cho booking hôm sau nếu có thể",
                    "Khoá phòng MAINTENANCE khi cần sửa chữa để tránh overbooking",
                  ],
                },
                {
                  icon: "💡",
                  title: "Tối ưu doanh thu",
                  items: [
                    "Tạo nhiều Rate Plan (mùa cao/thấp, gói buổi sáng, không hoàn tiền...)",
                    "Đặt giá cuối tuần (T6/T7/CN) cao hơn ngày thường",
                    "Dùng Mã khuyến mãi cho flash deals theo mùa (HOIAN30, SUMMER20...)",
                    "Theo dõi báo cáo Kênh đặt phòng hằng tuần để biết kênh hiệu quả",
                    "RevPAR và ADR trong Reports/Revenue là KPI quan trọng nhất",
                  ],
                },
                {
                  icon: "📊",
                  title: "Báo cáo & kiểm toán",
                  items: [
                    "Audit Log ghi lại 100% thay đổi: ai, lúc nào, thay đổi gì",
                    "Export báo cáo doanh thu cuối tháng để đối chiếu kế toán",
                    "Folio PDF là hóa đơn hợp lệ — điền MST và tài khoản ngân hàng",
                    "Kiểm tra danh sách Folio Quá hạn hằng ngày",
                    "Arrivals/Departures report = danh sách check-in/out hằng ngày",
                  ],
                },
                {
                  icon: "📟",
                  title: "Kiosk & Booking Portal",
                  items: [
                    "Kiosk (localhost:3002) cần chạy song song với Staff app",
                    "Cảnh báo «Gọi nhân viên» từ Kiosk hiện ngay trên Dashboard",
                    "Booking từ Portal sẽ có kênh ONLINE — kiểm tra hằng ngày",
                    "Khách đặt online sẽ nhận email xác nhận kèm QR code tự động",
                    "Cấu hình RESEND_API_KEY trong .env để email thực sự gửi đi",
                  ],
                },
                {
                  icon: "🔧",
                  title: "Kỹ thuật & triển khai",
                  items: [
                    "Backup database Postgres hằng ngày (cron hoặc Supabase auto-backup)",
                    "Cấu hình CLOUDFLARE_R2 để lưu ảnh phòng trên cloud",
                    "Redis (Upstash) cần cấu hình để Socket.io realtime hoạt động",
                    "Kiosk API Key cấu hình trong KIOSK_API_KEY env var",
                    "Sử dụng HTTPS và domain thật trong production",
                  ],
                },
              ].map((section) => (
                <div key={section.title} className="rounded-xl border border-gray-200 bg-white p-5">
                  <p className="text-xl mb-2">{section.icon}</p>
                  <p className="font-semibold text-gray-900 mb-3">{section.title}</p>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-gray-400 shrink-0">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
              <span>Lạc Hồng Boutique Hotel & Spa — Hotel Management System v1.0</span>
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Đăng nhập vào hệ thống →
              </Link>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
