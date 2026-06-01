# Danh Sách Tính Năng Chi Tiết — Hotel Management System

> **Dành cho:** Giám đốc vận hành · Trưởng bộ phận IT · Người ra quyết định kỹ thuật  
> **Cập nhật:** 2026-06

---

## Module 1 — Kiosk Tự Phục Vụ

### Check-in tự động
- Tra cứu đặt phòng bằng mã xác nhận hoặc quét QR code
- Xác thực tên khách (chống nhận nhầm phòng)
- Tự động phân phòng theo loại phòng, ưu tiên phòng sạch sẵn sàng
- Hiển thị số phòng, tầng, mật khẩu WiFi ngay trên màn hình
- Gửi email xác nhận check-in tự động

### Check-out tự động
- Tra cứu bằng số phòng hoặc mã đặt phòng
- Hiển thị bảng tổng hợp phí (folio): phí phòng + phí dịch vụ
- Thanh toán demo (tích hợp gateway thực tế theo yêu cầu)
- Ghi nhận thanh toán, cập nhật trạng thái phòng sang "Cần dọn"

### Đặt phòng tại chỗ (Walk-in)
- Chọn ngày, loại phòng, số khách trực tiếp tại kiosk
- Nhập thông tin khách, xem giá tổng
- Thanh toán → tự động check-in luôn

### Tiện ích kiosk
- Giao diện song ngữ Việt / Anh (chuyển đổi tức thì)
- Màn hình chờ tự động sau 5 phút không tương tác
- Nút "Gọi nhân viên" → cảnh báo âm thanh + popup trên dashboard nhân viên
- Chạy fullscreen PWA — không cần cài app, tương thích Android & Windows

---

## Module 2 — Staff Management Web

### Dashboard Lễ tân
- Tổng quan ngày: arrivals / departures / occupancy / phòng trống
- Cảnh báo real-time: kiosk gọi nhân viên, phòng cần ưu tiên
- Danh sách check-in hôm nay với nút xử lý nhanh
- Cập nhật trạng thái phòng tức thì qua WebSocket

### Quản lý Đặt phòng (Booking)
- Danh sách booking: lọc theo trạng thái, ngày, loại phòng, kênh đặt
- Tạo booking mới (walk-in, phone-in, OTA)
- Xem chi tiết: thông tin khách, phòng, folio, lịch sử chỉnh sửa
- Chỉnh sửa: ngày, loại phòng, ghi chú, yêu cầu đặc biệt
- Hủy booking với ghi lý do
- Check-in / Check-out thay (nhân viên hỗ trợ khách)

### Quản lý Phòng
- Grid phòng theo tầng: màu trạng thái (Sạch / Bẩn / Có khách / Bảo trì)
- Click vào phòng: xem booking hiện tại, khách, lịch sử dọn
- Chuyển trạng thái phòng thủ công
- Phân công phòng cho booking cụ thể

### Housekeeping (Buồng phòng)
- Kanban board: cột Cần dọn / Đang dọn / Đã sạch / Kiểm tra / Bảo trì
- Kéo thả phòng giữa các trạng thái
- Phân công nhân viên buồng phòng cho từng phòng
- Xem lịch sử dọn phòng

### Quản lý Khách hàng (Guest Profiles)
- Tìm kiếm khách theo tên, email, điện thoại
- Hồ sơ khách: lịch sử đặt phòng, ghi chú, tag phân loại
- Thêm ghi chú nội bộ (ẩn với khách)
- Dữ liệu CMND/hộ chiếu mã hóa AES-256

### Folio & Thanh toán
- Xem tổng hợp phí theo từng booking
- Thêm phí dịch vụ (minibar, giặt ủi, phòng gym...)
- Ghi nhận thanh toán: tiền mặt, thẻ, chuyển khoản
- Tạo hóa đơn PDF
- Void phí khi có sai sót

### Báo cáo
- **Arrivals/Departures:** Danh sách khách đến/đi theo ngày, xuất CSV
- **Occupancy Report:** Tỷ lệ lấp đầy theo ngày/tháng
- **Revenue Report:** Doanh thu phòng, dịch vụ, theo rate plan
- **RevPAR / ADR:** Chỉ số kinh doanh chuẩn ngành
- **Booking Channels:** Phân tích đặt phòng theo kênh (OTA, Online, Walk-in, Kiosk)

### Cấu hình Admin
- Quản lý tài khoản nhân viên (vai trò: Lễ tân / Buồng phòng / Quản lý / Admin / Kế toán)
- Cài đặt thông tin khách sạn, logo, WiFi password, email template
- Quản lý loại phòng: tên, giá cơ bản, tiện nghi, hình ảnh
- Rate plan: giá ngày thường / cuối tuần, discount, non-refundable
- Promo code: % hoặc số tiền, giới hạn sử dụng, thời hạn hiệu lực
- Cài đặt giờ check-in sớm nhất, chính sách hủy phòng

---

## Module 3 — Booking Portal (Trang Đặt Phòng Trực Tuyến)

### Tìm & Đặt phòng
- Widget tìm kiếm: ngày nhận/trả, số người lớn/trẻ em
- Danh sách phòng: slideshow ảnh, giá real-time, tình trạng còn phòng
- Trang chi tiết phòng: lightbox ảnh, danh sách tiện nghi, mô tả đầy đủ
- Quy trình đặt 4 bước: Chọn phòng → Thông tin khách → Xem lại → Xác nhận

### Promo & Giá
- Nhập mã giảm giá (promo code) tại bước thanh toán
- Hiển thị giá sau giảm minh bạch
- Giá tự động thay đổi theo ngày thường / cuối tuần

### Xác nhận đặt phòng
- Trang xác nhận với QR code (để quét tại kiosk check-in)
- Thêm vào Google Calendar / tải file ICS
- In trang xác nhận
- Gửi email xác nhận tự động (kèm QR)

### Tài khoản khách hàng
- Đăng ký / Đăng nhập bằng email
- Quên mật khẩu → reset qua email
- Trang "Đặt phòng của tôi": 3 tab Sắp tới / Đã lưu trú / Đã hủy
- Hủy đặt phòng online (trong thời hạn cho phép)
- Tra cứu đặt phòng không cần tài khoản (bằng mã + email)

### SEO & Kỹ thuật
- Song ngữ Việt / Anh với URL prefix (`/vi/...`, `/en/...`)
- Sitemap.xml, robots.txt tự động
- Schema.org structured data cho phòng, khách sạn
- `generateMetadata` cho từng trang (OG tags, title)
- ISR (Incremental Static Regeneration) cho trang chi tiết phòng

---

## Tính năng nền tảng (Cross-cutting)

| Tính năng | Chi tiết |
|---|---|
| Real-time | WebSocket (Socket.io) — cập nhật dashboard không cần F5 |
| Bảo mật | JWT authentication, mã hóa PII (AES-256-GCM), soft delete |
| Audit log | Toàn bộ thao tác nhân viên được ghi log với người thực hiện |
| Multi-property | Hỗ trợ nhiều cơ sở khách sạn trên cùng hệ thống |
| Đa ngôn ngữ | Tiếng Việt + tiếng Anh (dễ mở rộng thêm ngôn ngữ) |
| Responsive | Hoạt động trên desktop, tablet, mobile |
| Cloud-ready | Triển khai trên bất kỳ cloud nào (VPS, AWS, GCP, Railway) |
| API mở | tRPC API — sẵn sàng tích hợp với hệ thống bên thứ 3 |
| Payment | Demo adapter — plug-in gateway thực tế (VNPay, MoMo, Stripe, ZaloPay) |
