# Tổng Quan Sản Phẩm — Hotel Management System

> **Dành cho:** Chủ khách sạn · Giám đốc vận hành · Nhà đầu tư  
> **Cập nhật:** 2026-06

---

## Một nền tảng — Ba giao diện — Toàn bộ vận hành

**Hotel Management System (HMS)** là phần mềm quản lý khách sạn toàn diện, được xây dựng đặc biệt cho thị trường Việt Nam. Thay vì dùng phần mềm nước ngoài đắt tiền hoặc bảng tính thủ công, HMS mang lại hệ thống hiện đại với ba thành phần hoạt động liền mạch:

```
┌─────────────────┐  ┌─────────────────────┐  ┌──────────────────┐
│   KIOSK APP     │  │  STAFF MANAGEMENT   │  │  BOOKING PORTAL  │
│                 │  │                     │  │                  │
│ Khách tự phục   │  │  Lễ tân · Buồng     │  │  Khách đặt phòng │
│ vụ check-in /   │  │  phòng · Quản lý ·  │  │  trực tuyến      │
│ check-out       │  │  Kế toán            │  │  (VI / EN)       │
│                 │  │                     │  │                  │
│ Tablet / Kiosk  │  │  Trình duyệt web    │  │  Mọi thiết bị    │
└─────────────────┘  └─────────────────────┘  └──────────────────┘
           │                    │                      │
           └────────────────────┴──────────────────────┘
                         Cơ sở dữ liệu tập trung
                         Real-time · Bảo mật · Cloud-ready
```

---

## Vấn đề thị trường

| Tình trạng hiện tại | Hậu quả |
|---|---|
| Phần mềm PMS ngoại (Opera, Cloudbeds) giá $300–$800/tháng | Chi phí không phù hợp với khách sạn nhỏ và vừa |
| Quản lý bằng Excel, Zalo, sổ tay | Sai sót, mất dữ liệu, không có báo cáo |
| Không có kiosk tự phục vụ | Hàng đợi giờ cao điểm, tăng nhân sự |
| Không có portal đặt phòng riêng | Phụ thuộc 100% vào OTA (Booking.com, Agoda), mất phí 15–25% |

---

## Giải pháp HMS

### Kiosk tự phục vụ
Khách quét QR hoặc nhập mã đặt phòng → xác nhận tên → nhận số phòng trong **dưới 90 giây**. Không cần nhân viên.

- Check-in / Check-out tự động
- Hỗ trợ đặt phòng trực tiếp (walk-in) tại kiosk
- Nút gọi nhân viên khẩn cấp với cảnh báo real-time
- Chạy trên Android tablet hoặc Windows PC

### Staff Management Web
Dashboard real-time toàn bộ hoạt động khách sạn.

- **Lễ tân:** Booking, phân phòng, check-in/out thay, folio
- **Buồng phòng:** Kanban quản lý trạng thái phòng, phân công nhiệm vụ
- **Quản lý:** Báo cáo occupancy, doanh thu, RevPAR, ADR
- **Admin:** Cấu hình tài khoản, loại phòng, rate plan, promo code

### Booking Portal
Trang đặt phòng trực tuyến chuyên nghiệp, tích hợp sẵn vào website khách sạn.

- Giao diện song ngữ Việt / Anh
- Tìm phòng theo ngày, hiển thị giá real-time
- Quy trình đặt phòng 4 bước trực quan
- Quản lý booking sau đặt (hủy, xem lịch sử)

---

## Lợi thế cạnh tranh

| | HMS | Opera / Cloudbeds | Phần mềm Việt nội địa |
|---|---|---|---|
| Chi phí license hàng tháng | **Không có** | $300–$800 | $50–$200 |
| Kiosk tự phục vụ | **Có (sẵn)** | Addon riêng | Không |
| Portal đặt phòng riêng | **Có (sẵn)** | Tích hợp cơ bản | Không |
| Real-time toàn hệ thống | **Có (Socket.io)** | Có | Hạn chế |
| Tùy biến theo yêu cầu | **Toàn quyền** | Không | Hạn chế |
| Hỗ trợ tiếng Việt | **Đầy đủ** | Hạn chế | Có |
| Triển khai nhanh | **2–4 tuần** | 2–6 tháng | 1–3 tháng |

---

## Phù hợp với loại hình nào?

- Khách sạn 10–200 phòng
- Boutique hotel, resort, serviced apartment, hostel
- Chuỗi khách sạn nhỏ (multi-property)
- Khách sạn đang chuyển đổi số từ Excel/thủ công

---

## Con số ấn tượng

| Chỉ số | Giá trị |
|---|---|
| Thời gian check-in trung bình qua kiosk | < 90 giây |
| Giảm chi phí OTA commission khi dùng portal riêng | 15–25% trên mỗi đặt phòng online |
| Thời gian triển khai | 2–4 tuần |
| Hỗ trợ đồng thời | Không giới hạn phòng / nhân viên |

---

## Liên hệ tư vấn

> **Email:** hien.nguyen2@globee.hk  
> Chúng tôi cung cấp **demo trực tiếp miễn phí** — xem hệ thống chạy với dữ liệu thực của khách sạn bạn.
