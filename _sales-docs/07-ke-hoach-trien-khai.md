# Kế Hoạch Triển Khai — Hotel Management System

> **Dành cho:** Chủ khách sạn · Trưởng bộ phận IT · Quản lý vận hành  
> **Thời gian tiêu chuẩn:** 2–4 tuần (tùy quy mô và độ phức tạp)

---

## Tổng Quan Quy Trình

```
Ký hợp đồng
     │
     ▼
Tuần 1: Kickoff & Cấu hình
     │  └─ Thu thập thông tin khách sạn
     │  └─ Cài đặt hạ tầng (server / cloud)
     │  └─ Cấu hình property: phòng, loại phòng, rate plan
     │
     ▼
Tuần 2: Data & Integration
     │  └─ Nhập dữ liệu phòng và khách
     │  └─ Cấu hình payment gateway
     │  └─ Cài đặt kiosk (phần cứng + phần mềm)
     │  └─ Cấu hình booking portal (domain, logo, nội dung)
     │
     ▼
Tuần 3: Training & Testing
     │  └─ Training lễ tân & quản lý
     │  └─ Training buồng phòng
     │  └─ Chạy thử toàn bộ quy trình với dữ liệu thật
     │  └─ Xử lý feedback & điều chỉnh
     │
     ▼
Tuần 4: Go-live
        └─ Chuyển sang vận hành chính thức
        └─ Hỗ trợ on-call 24/7 tuần đầu
        └─ Review sau 1 tuần
```

---

## Chi Tiết Từng Giai Đoạn

### Giai đoạn 0 — Chuẩn bị (Trước khi ký hợp đồng)

**Phía khách sạn cung cấp:**
- [ ] Danh sách phòng (số phòng, tên phòng, tầng, loại phòng)
- [ ] Danh sách loại phòng (tên, sức chứa, giá cơ bản, tiện nghi)
- [ ] Rate plan hiện tại (giá theo mùa, cuối tuần, non-refundable)
- [ ] Logo khách sạn (file PNG/SVG, nền trắng hoặc trong suốt)
- [ ] Ảnh phòng (tối thiểu 3 ảnh/loại phòng, JPEG ≥ 1200px)
- [ ] Thông tin liên hệ, địa chỉ, mô tả tiện nghi khách sạn (VI + EN)
- [ ] Tài khoản email để gửi thông báo tự động (có thể dùng Gmail)
- [ ] Gateway thanh toán đang dùng (nếu có)

**Phía HMS:**
- [ ] Ký hợp đồng, thu 50% phí
- [ ] Phân công Project Manager và Technical Lead
- [ ] Kick-off call: giới thiệu team, xác nhận timeline

---

### Giai đoạn 1 — Kickoff & Cấu hình (Tuần 1)

**Ngày 1–2: Hạ tầng**
- Cài đặt server (cloud hoặc tại chỗ theo yêu cầu khách hàng)
- Cài đặt database, cấu hình backup tự động hàng ngày
- Cấu hình domain/subdomain cho Staff web, Booking portal
- Cài đặt SSL certificate

**Ngày 3–5: Cấu hình property**
- Nhập thông tin khách sạn: tên, địa chỉ, liên hệ, WiFi password
- Tạo danh sách phòng với số phòng, tầng, trạng thái ban đầu
- Cấu hình loại phòng: tên VI/EN, sức chứa, tiện nghi, upload ảnh
- Cài đặt rate plan: giá ngày thường, cuối tuần, các loại plan
- Cài đặt chính sách: giờ check-in sớm nhất, free cancellation window

**Deliverable tuần 1:**
- [ ] Staff web chạy được, đăng nhập được
- [ ] Có thể tạo booking thủ công
- [ ] Danh sách phòng và loại phòng đầy đủ

---

### Giai đoạn 2 — Tích hợp & Kiosk (Tuần 2)

**Ngày 6–7: Booking Portal**
- Cấu hình domain riêng (ví dụ: book.kachsanxyz.vn)
- Upload logo, tùy chỉnh màu sắc theo brand
- Nhập nội dung trang Giới thiệu, Tiện nghi, Liên hệ (VI + EN)
- Cấu hình SEO: sitemap, meta tags, Schema.org
- Test toàn bộ luồng đặt phòng

**Ngày 8–9: Payment Gateway**
- Cấu hình VNPay / MoMo / gateway theo yêu cầu
- Test giao dịch sandbox
- Cấu hình email xác nhận đặt phòng, check-in, hóa đơn

**Ngày 10: Kiosk**
- Cài đặt phần mềm kiosk lên thiết bị (tablet/PC)
- Cấu hình kiosk ID, API key
- Test toàn bộ luồng: check-in, check-out, walk-in, gọi nhân viên
- Mount thiết bị tại vị trí thực tế

**Deliverable tuần 2:**
- [ ] Booking portal live với domain riêng
- [ ] Payment gateway hoạt động (transaction thật)
- [ ] Kiosk cài đặt tại chỗ, test thành công

---

### Giai đoạn 3 — Training (Tuần 3)

**Session 1 — Lễ tân & Quản lý (4 giờ)**

| Thời gian | Nội dung |
|---|---|
| 30 phút | Tổng quan hệ thống, vai trò từng bộ phận |
| 60 phút | Dashboard lễ tân: đọc thông tin, xử lý check-in/out thay |
| 45 phút | Quản lý booking: tạo mới, chỉnh sửa, hủy |
| 30 phút | Folio và thanh toán: thêm phí, ghi thanh toán, xuất hóa đơn |
| 30 phút | Báo cáo: xem và xuất báo cáo hàng ngày/tháng |
| 15 phút | Q&A |

**Session 2 — Buồng phòng (2 giờ)**

| Thời gian | Nội dung |
|---|---|
| 30 phút | Đăng nhập, tổng quan giao diện buồng phòng |
| 60 phút | Kanban board: kéo thả trạng thái, nhận nhiệm vụ |
| 30 phút | Dùng trên điện thoại |

**Session 3 — Kiosk & Troubleshooting (1 giờ)**

| Thời gian | Nội dung |
|---|---|
| 30 phút | Hướng dẫn khách dùng kiosk khi cần |
| 15 phút | Xử lý các tình huống phổ biến (kiosk treo, lỗi mạng...) |
| 15 phút | Escalation: khi nào liên hệ support |

**Session 4 — Admin Settings (1 giờ — dành cho Manager/Owner)**

| Thời gian | Nội dung |
|---|---|
| 30 phút | Quản lý tài khoản nhân viên |
| 15 phút | Tạo/chỉnh sửa promo code |
| 15 phút | Cài đặt rate plan theo mùa |

**Tài liệu training bàn giao:**
- Hướng dẫn sử dụng nhanh (1 trang A4/vai trò, có ảnh minh họa)
- Video hướng dẫn các tác vụ phổ biến
- Tài liệu troubleshooting kiosk

---

### Giai đoạn 4 — Go-Live (Tuần 4)

**Ngày 1 Go-live:**
- [ ] Chuyển toàn bộ vận hành sang HMS
- [ ] Kỹ thuật viên HMS túc trực tại chỗ (buổi sáng)
- [ ] Hotline hỗ trợ 24/7 trong tuần đầu tiên

**Checklist ngày đầu tiên:**
- [ ] Tất cả nhân viên đăng nhập được
- [ ] Kiosk hoạt động bình thường
- [ ] Đặt phòng test trên portal thành công
- [ ] Nhân viên buồng phòng cập nhật được trạng thái phòng
- [ ] Báo cáo cuối ngày chạy chính xác

**Review sau 1 tuần:**
- Cuộc họp review 1 giờ qua Zoom
- Thu thập feedback từ tất cả bộ phận
- Điều chỉnh cấu hình nếu cần
- Xác nhận bàn giao — thu 50% phí còn lại

---

## Yêu Cầu Phía Khách Hàng

### Hạ tầng (HMS hỗ trợ lựa chọn)

| Tùy chọn | Yêu cầu | Chi phí ước tính |
|---|---|---|
| Cloud VPS (khuyến nghị) | VPS 2 vCPU, 4GB RAM, 50GB SSD | 200.000–500.000 VNĐ/tháng |
| Cloud managed (Railway, Render) | Đăng ký tài khoản | 300.000–700.000 VNĐ/tháng |
| Server tại chỗ | PC/Server, UPS, internet ổn định | Chi phí phần cứng một lần |

### Kết nối internet
- Tốc độ tối thiểu: 10 Mbps download, 5 Mbps upload
- Khuyến nghị: có đường backup (4G/5G dongle)
- Kiosk cần kết nối ổn định — khuyến nghị cấp cho kiosk IP tĩnh nội bộ

### Phần cứng kiosk (HMS tư vấn, khách hàng tự mua)

| Thiết bị | Yêu cầu tối thiểu | Khuyến nghị |
|---|---|---|
| Android tablet | Android 10+, màn hình 10" | Samsung Tab A8 hoặc tương đương |
| Windows kiosk | Windows 10, 4GB RAM, màn hình cảm ứng | Mini PC + màn hình cảm ứng 15.6" |
| Giá đỡ | Phù hợp với thiết bị | Giá đỡ kiosk inox chống trộm |

---

## Liên Lạc & Hỗ Trợ Sau Triển Khai

| Kênh | Thời gian | Dành cho |
|---|---|---|
| Zalo Group (dự án) | Liên tục | Câu hỏi nhanh, cập nhật |
| Email support | Giờ hành chính | Yêu cầu có tài liệu |
| Hotline (Professional+) | Theo SLA gói | Sự cố khẩn |
| Zoom/Meet | Theo lịch hẹn | Training bổ sung, review |

**Project Manager của bạn:** Liên hệ trực tiếp trong suốt quá trình triển khai.

> **Email:** hien.nguyen2@globee.hk
