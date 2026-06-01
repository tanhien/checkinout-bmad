# TESTPLAN — Hotel Management System (HMS)

> **Version:** 1.0 · **Date:** 2026-06 · **Author:** QA Senior Engineer  
> **Scope:** Booking Portal · Staff Web · Kiosk App · tRPC API  
> **Approach:** Risk-based · Layered (UI / API / Integration) · Happy-path + Error-path

---

## Executive Summary

HMS gồm 3 subsystem kết nối qua một API tập trung:

| Subsystem | URL | Auth |
|---|---|---|
| Booking Portal | `localhost:3000` | Guest JWT (cookie `guest_token`) |
| Staff Web | `localhost:3001` | Staff JWT (cookie `staff_token`) |
| Kiosk App | `localhost:5173` | API key header `X-Kiosk-Api-Key` |
| tRPC API | `localhost:3001/api/trpc` | Theo procedure |

**Môi trường test:** Docker Postgres trên port 5433, seed data đầy đủ (`pnpm db:seed`).

---

## Risk Overview

| Khu vực | Mức độ rủi ro | Lý do |
|---|---|---|
| Kiosk check-in / check-out | 🔴 Cao | Tác động trực tiếp khách, không có nhân viên can thiệp |
| Booking funnel & thanh toán | 🔴 Cao | Doanh thu, tính toàn vẹn dữ liệu |
| Xác thực & phân quyền | 🔴 Cao | Bảo mật, leo thang đặc quyền |
| Folio & tính tiền | 🔴 Cao | Sai số liệu tài chính |
| Phân phòng tự động | 🟠 Trung bình | Race condition, hết phòng |
| Real-time (WebSocket) | 🟠 Trung bình | Dashboard mất đồng bộ |
| Housekeeping workflow | 🟡 Thấp | Ảnh hưởng nội bộ |
| Báo cáo & xuất dữ liệu | 🟡 Thấp | Dữ liệu có thể sai nhưng không block vận hành |
| i18n (VI/EN) | 🟡 Thấp | UX, không block nghiệp vụ |

---

## Thiết lập test

```bash
# 1. Khởi động hạ tầng
docker compose up -d
pnpm --filter @hotel/db db:reset   # drop + migrate + seed

# 2. Khởi động apps
pnpm dev

# 3. Credentials seed mặc định
# Staff Admin:    admin@hotel.com   / password: admin123
# Staff Manager:  manager@hotel.com / password: manager123
# Staff FrontDesk: desk@hotel.com   / password: desk123
# Staff Housekeeping: house@hotel.com / password: house123
# Guest test:     tanhien@gmail.com / password: 12345678
# Booking Portal: localhost:3000
# Staff Web:      localhost:3001
# Kiosk:          localhost:5173
```

---

## NHÓM 1 — Xác thực & Phân quyền

### TC-AUTH-01: Đăng nhập Staff thành công
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Staff web đang chạy, tài khoản `desk@hotel.com` tồn tại.

**Steps:**
1. Mở `localhost:3001/login`
2. Nhập email `desk@hotel.com`, password `desk123`
3. Click "Đăng nhập"

**Expected:** Redirect về dashboard, header hiển thị tên nhân viên, cookie `staff_token` được set (httpOnly).

**Failure indicators:** Thông báo lỗi sai, redirect loop, cookie không được set.

---

### TC-AUTH-02: Đăng nhập Staff sai mật khẩu
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Mở `localhost:3001/login`
2. Nhập email đúng, password sai `wrongpass`
3. Click "Đăng nhập"

**Expected:** Thông báo lỗi "Email hoặc mật khẩu không đúng", không redirect, không set cookie.

**Failure indicators:** Đăng nhập được với sai mật khẩu (critical security bug).

---

### TC-AUTH-03: Phân quyền role — Housekeeping không truy cập Admin Settings
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Đăng nhập bằng tài khoản `house@hotel.com` (role: HOUSEKEEPING).

**Steps:**
1. Đăng nhập thành công
2. Gõ thẳng URL `localhost:3001/settings/staff`
3. Thử gọi tRPC mutation `staff.create` từ DevTools

**Expected:** Bước 2 → redirect về dashboard hoặc 403. Bước 3 → response `FORBIDDEN`.

**Failure indicators:** Truy cập được trang Admin, mutation thành công.

---

### TC-AUTH-04: Kiosk API key không hợp lệ bị từ chối
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Gọi `POST localhost:3001/api/trpc/kiosk.lookupBooking` với header `X-Kiosk-Api-Key: invalid-key`

**Expected:** Response `UNAUTHORIZED`.

**Failure indicators:** Dữ liệu booking trả về.

---

### TC-AUTH-05: Guest JWT hết hạn bị redirect về login
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Set cookie `guest_token` với JWT đã hết hạn (exp trong quá khứ)
2. Truy cập `localhost:3000/vi/my-bookings`

**Expected:** Redirect về `/vi/login`.

---

### TC-AUTH-06: Staff token không thể dùng cho Guest endpoint và ngược lại
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Lấy `staff_token` cookie, đặt vào request gọi `portal.getMyBookings`
2. Lấy `guest_token` cookie, đặt vào request gọi `booking.list`

**Expected:** Cả hai đều trả về `UNAUTHORIZED`.

---

## NHÓM 2 — Booking Portal: Đặt phòng trực tuyến

### TC-BOOK-01: Đặt phòng thành công — Happy path
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Có ít nhất 1 loại phòng active, còn phòng trống ngày test.

**Steps:**
1. Mở `localhost:3000/vi/rooms`
2. Nhập checkin = ngày mai, checkout = ngày kia, 2 adults
3. Click "Tìm phòng" → chọn 1 loại phòng
4. Click "Đặt ngay"
5. Bước 1: Bỏ qua promo → Next
6. Bước 2: Nhập đầy đủ thông tin khách (email mới chưa có trong DB)
7. Bước 3: Tick đồng ý → Next
8. Bước 4: Click "Xác nhận đặt phòng"

**Expected:** 
- Redirect về trang xác nhận `/vi/booking/HTL-XXXX-XXXXXX`
- QR code hiển thị
- Email xác nhận gửi đi (check log nếu không có RESEND_API_KEY)
- DB: Booking CONFIRMED, Folio OPEN với 1 FolioItem ROOM_CHARGE

**Failure indicators:** Trang lỗi, không có mã xác nhận, DB không có record.

---

### TC-BOOK-02: Đặt phòng khi đã đăng nhập — thông tin tự điền
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Đã đăng nhập guest với `tanhien@gmail.com`.

**Steps:**
1. Vào `/vi/rooms` → chọn phòng → "Đặt ngay"
2. Quan sát bước 2 (Thông tin khách)

**Expected:** Email, họ tên được pre-fill từ account, các ô tô sáng màu vàng.

---

### TC-BOOK-03: Đặt phòng với promo code hợp lệ
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Tạo promo code `TEST10` (10%, còn hiệu lực) trong Admin settings.

**Steps:**
1. Vào booking funnel bước 1
2. Nhập `TEST10` → Click "Áp dụng"
3. Quan sát giá hiển thị

**Expected:** Giảm giá 10% hiển thị rõ ràng, tổng tiền = subtotal × 0.9.

---

### TC-BOOK-04: Đặt phòng với promo code hết hạn
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Nhập promo code đã hết hạn `EXPIRED`
2. Click "Áp dụng"

**Expected:** Thông báo "Mã không hợp lệ", giá không thay đổi.

---

### TC-BOOK-05: Đặt phòng khi phòng vừa hết (race condition)
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Chọn loại phòng chỉ còn 1 phòng
2. Mở 2 tab, cả 2 vào bước 4 cùng lúc
3. Click xác nhận trên cả 2 tab gần như đồng thời

**Expected:** 1 tab thành công, 1 tab báo "Phòng đã hết — vui lòng chọn ngày khác".

**Failure indicators:** Cả 2 booking CONFIRMED với cùng phòng.

---

### TC-BOOK-06: Checkout phải sau checkin
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Vào booking funnel, đặt checkout = cùng ngày checkin

**Expected:** Validation error "Ngày trả phòng phải sau ngày nhận phòng", không thể tiếp tục.

---

### TC-BOOK-07: Hủy đặt phòng trong thời hạn
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Đã đăng nhập, có booking CONFIRMED với checkin > freeCancelHours từ bây giờ.

**Steps:**
1. Vào `/vi/my-bookings` tab "Sắp tới"
2. Click "Hủy đặt phòng" → Xác nhận

**Expected:** Booking chuyển sang CANCELLED, hiển thị trong tab "Đã hủy".

---

### TC-BOOK-08: Hủy đặt phòng quá hạn bị từ chối
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Booking có checkin trong vòng freeCancelHours giờ tới.

**Steps:**
1. Click "Hủy đặt phòng"

**Expected:** Thông báo "Đã hết thời gian hủy miễn phí. Vui lòng liên hệ lễ tân."

---

### TC-BOOK-09: My-bookings hiển thị đúng tab
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Tài khoản có: 1 booking CONFIRMED tương lai, 1 CHECKED_OUT, 1 CANCELLED.

**Steps:**
1. Vào `/vi/my-bookings`
2. Kiểm tra từng tab

**Expected:**
- Tab "Sắp tới": booking CONFIRMED
- Tab "Đã lưu trú": booking CHECKED_OUT
- Tab "Đã hủy": booking CANCELLED
- Booking CONFIRMED có checkIn đã qua (nhưng chưa check-in) → vẫn hiện tab Sắp tới

---

### TC-BOOK-10: Trang xác nhận — QR code và thao tác
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Sau khi đặt phòng, vào trang `/vi/booking/HTL-XXXX-XXXXXX`
2. Kiểm tra QR code
3. Click "Thêm vào Google Calendar"
4. Click "Tải ICS"
5. Click "In"

**Expected:**
- QR code chứa mã xác nhận (scan được)
- Google Calendar link mở đúng
- File .ics download được, chứa đúng ngày
- Print dialog hiển thị

---

## NHÓM 3 — Kiosk: Check-in Tự phục vụ

### TC-KIOSK-01: Check-in bằng mã thành công — Happy path
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Có booking CONFIRMED, có phòng CLEAN sẵn sàng.

**Steps:**
1. Mở Kiosk `localhost:5173` → Click "Check-in"
2. Tab "Mã đặt phòng": Nhập `HTL-XXXX-XXXXXX`
3. Click "Tìm kiếm"
4. Màn hình booking confirm: Xác nhận thông tin → "Đúng, tiếp tục"
5. Màn hình name verify: Nhập họ tên đúng thứ tự Việt Nam (Họ Tên, VD: "Nguyen Bob")
6. Click "Xác nhận"

**Expected:**
- Màn hình thành công: số phòng, tầng, WiFi password
- DB: Booking → CHECKED_IN, Room → OCCUPIED
- Staff dashboard: event `booking:checkedIn` real-time

**Failure indicators:** NAME_MISMATCH khi nhập đúng, phòng không được gán.

---

### TC-KIOSK-02: Check-in nhập tên sai bị từ chối
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Thực hiện các bước 1–4 như TC-KIOSK-01
2. Nhập tên sai "Nguyen XXXX"

**Expected:** Thông báo "Tên không khớp. Vui lòng kiểm tra lại hoặc gọi nhân viên hỗ trợ."

---

### TC-KIOSK-03: Check-in — tên có dấu tiếng Việt vẫn khớp
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Guest đăng ký tên "Nguyễn Văn An" (có dấu).

**Steps:**
1. Vào màn hình name verify
2. Thử nhập: "Nguyen Van An" (không dấu), "NGUYEN VAN AN" (caps), "nguyễn văn an" (thường)

**Expected:** Cả 3 cách nhập đều được chấp nhận (normalizeName).

---

### TC-KIOSK-04: Check-in quá sớm bị từ chối
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Booking có checkin = ngày mai, checkInHour = 14.

**Steps:**
1. Check-in lúc 8:00 sáng ngày hôm trước

**Expected:** Thông báo "Chưa đến giờ nhận phòng. Giờ nhận phòng sớm nhất: 14:00 ngày XX/XX."

---

### TC-KIOSK-05: Check-in khi không còn phòng sạch
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Tất cả phòng của loại phòng đã OCCUPIED hoặc MAINTENANCE.

**Steps:**
1. Tiến hành check-in đúng tên đúng mã

**Expected:** Thông báo "Chưa có phòng sẵn sàng. Nhân viên sẽ hỗ trợ bạn ngay."

---

### TC-KIOSK-06: Check-in bằng QR code
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Có camera, Chrome browser.

**Steps:**
1. Click tab "QR Code"
2. Hướng camera vào QR code từ trang xác nhận booking

**Expected:** QR detected → auto-lookup → chuyển sang màn hình booking confirm.

---

### TC-KIOSK-07: Walk-in booking — đặt phòng trực tiếp tại kiosk
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Click "Đặt phòng tại quầy"
2. Chọn ngày, loại phòng, số khách
3. Nhập thông tin khách
4. Xem tổng giá → Xác nhận
5. Thanh toán demo

**Expected:** Booking CONFIRMED + CHECKED_IN ngay, phòng OCCUPIED, màn hình thành công.

---

### TC-KIOSK-08: Check-out — Happy path
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Booking đang CHECKED_IN.

**Steps:**
1. Click "Check-out"
2. Nhập số phòng
3. Xem bảng folio: phí phòng + phí dịch vụ
4. Xác nhận thanh toán
5. Click "Hoàn tất"

**Expected:** Booking → CHECKED_OUT, Room → DIRTY, folio balance = 0, màn hình cảm ơn.

---

### TC-KIOSK-09: Gọi nhân viên — cảnh báo real-time
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Staff web đang mở, nhân viên đã đăng nhập.

**Steps:**
1. Từ màn hình chờ kiosk, click "Gọi nhân viên"
2. Quan sát Staff web ngay lập tức

**Expected:** Popup cảnh báo hiện trên Staff dashboard với tên kiosk, âm thanh beep.

---

### TC-KIOSK-10: Idle timeout — tự reset sau 5 phút
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Vào giữa luồng check-in (màn hình nhập mã)
2. Không tương tác 5 phút

**Expected:** Màn hình tự động quay về màn hình chờ.

---

## NHÓM 4 — Staff Web: Vận hành lễ tân

### TC-STAFF-01: Dashboard hiển thị đúng số liệu ngày hôm nay
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Có data: 3 arrivals hôm nay, 2 departures, 10 phòng occupied.

**Steps:**
1. Đăng nhập Staff web
2. Quan sát dashboard

**Expected:** Số arrivals, departures, occupied rooms khớp với DB.

---

### TC-STAFF-02: Tạo booking thủ công
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Vào "Đặt phòng" → "Tạo mới"
2. Tìm/tạo khách: Nhập tên, email mới
3. Chọn loại phòng, ngày, số khách
4. Click "Tạo đặt phòng"

**Expected:** Booking CONFIRMED, confirmation code `HTL-YYYY-XXXXXX`, audit log có record.

---

### TC-STAFF-03: Check-in thay cho khách
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Booking CONFIRMED, có phòng CLEAN.

**Steps:**
1. Mở booking detail
2. Click "Check-in"
3. Chọn phòng (hoặc để auto-assign)
4. Xác nhận

**Expected:** Booking → CHECKED_IN, room gán đúng → OCCUPIED.

---

### TC-STAFF-04: Check-out thay — tính tiền chính xác
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Booking CHECKED_IN, có phí dịch vụ trong folio.

**Steps:**
1. Mở booking → tab Folio
2. Xem tổng phí (room charge + service charges)
3. Ghi nhận thanh toán
4. Check-out

**Expected:** Balance = 0, Booking → CHECKED_OUT, Room → DIRTY.

---

### TC-STAFF-05: Hủy booking đang CONFIRMED
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Mở booking CONFIRMED
2. Click "Hủy" → Nhập lý do "Test cancel"
3. Xác nhận

**Expected:** Booking → CANCELLED, cancelledAt được ghi, audit log có action CANCEL.

---

### TC-STAFF-06: Không thể xóa cứng bất kỳ entity nào
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Thử gọi tRPC mutation `booking.cancel` → kiểm tra DB
2. Thử gọi `room.updateStatus` với status MAINTENANCE → kiểm tra DB
3. Vào DevTools kiểm tra không có DELETE request nào

**Expected:** Tất cả đều dùng soft-delete/status flag, không có `db.entity.delete()`.

---

### TC-STAFF-07: Folio — thêm phí dịch vụ
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Vào Folio của booking CHECKED_IN
2. Thêm phí "Minibar" = 150.000 VNĐ
3. Thêm phí "Giặt ủi" = 80.000 VNĐ

**Expected:** FolioItems được tạo, tổng folio cập nhật đúng.

---

### TC-STAFF-08: Folio — void phí dịch vụ
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Void phí "Minibar" vừa thêm
2. Quan sát tổng folio

**Expected:** Item bị void (isVoided=true), tổng giảm 150.000 VNĐ, item vẫn hiển thị gạch ngang.

---

### TC-STAFF-09: Tải hóa đơn PDF
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Vào Folio
2. Click "Tải hóa đơn PDF"

**Expected:** File PDF download, chứa: tên khách, ngày, phòng, chi tiết phí, tổng tiền.

---

### TC-STAFF-10: Audit log ghi đầy đủ
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Thực hiện: tạo booking, check-in, thêm phí, check-out với cùng 1 nhân viên
2. Kiểm tra DB table `AuditLog`

**Expected:** 4 records tương ứng, đầy đủ `staffId`, `entityType`, `entityId`, `action`, `changes`.

---

## NHÓM 5 — Housekeeping

### TC-HK-01: Phòng tự động chuyển DIRTY sau check-out
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Thực hiện check-out booking
2. Quan sát Housekeeping Kanban

**Expected:** Phòng xuất hiện trong cột "Cần dọn" ngay lập tức (real-time).

---

### TC-HK-02: Kéo thả phòng giữa các cột Kanban
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Có phòng trong cột "Cần dọn".

**Steps:**
1. Kéo phòng từ "Cần dọn" → "Đang dọn"
2. Kéo tiếp → "Đã sạch"

**Expected:** Trạng thái cập nhật trong DB, room status = CLEAN sau bước 2.

---

### TC-HK-03: Phân công nhân viên buồng phòng
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Click vào phòng trong Kanban
2. Chọn nhân viên từ dropdown "Phân công"

**Expected:** Phòng hiển thị tên nhân viên được phân công.

---

### TC-HK-04: Cảnh báo gọi nhân viên từ kiosk hiển thị trên tất cả màn hình staff
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** 2 nhân viên khác nhau đang đăng nhập trên 2 trình duyệt khác nhau.

**Steps:**
1. Nhấn "Gọi nhân viên" trên kiosk

**Expected:** Popup hiện trên cả 2 trình duyệt staff.

---

### TC-HK-05: Dismiss cảnh báo gọi nhân viên broadcast đến tất cả
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Kiosk gọi nhân viên → popup hiện trên 2 màn hình
2. Nhân viên A dismiss trên màn hình của mình

**Expected:** Popup tắt trên cả 2 màn hình nhân viên A và B.

---

## NHÓM 6 — Phòng & Phân phòng

### TC-ROOM-01: Grid phòng hiển thị đúng trạng thái màu sắc
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Vào tab "Phòng"
2. Đối chiếu màu với trạng thái thực tế trong DB

**Expected:**
- CLEAN → xanh lá
- DIRTY → vàng
- OCCUPIED → xanh dương
- MAINTENANCE → đỏ

---

### TC-ROOM-02: Chuyển phòng sang MAINTENANCE
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Click vào phòng đang CLEAN
2. Chuyển trạng thái → MAINTENANCE
3. Thử tạo booking cho phòng đó trong cùng thời gian

**Expected:** Phòng MAINTENANCE không được auto-assign khi check-in.

---

### TC-ROOM-03: Auto-assign dùng optimistic locking
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Tạo tình huống: 1 phòng CLEAN, 2 kiosk check-in đồng thời cùng booking type
2. Quan sát kết quả

**Expected:** Chỉ 1 check-in thành công, phòng kia retry hoặc báo lỗi. Không có 2 booking cùng phòng.

---

## NHÓM 7 — Báo cáo

### TC-REPORT-01: Occupancy Report — tính đúng tỷ lệ lấp đầy
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Preconditions:** Biết chính xác số phòng OCCUPIED / tổng phòng ngày test.

**Steps:**
1. Vào Reports → Occupancy
2. Chọn ngày hôm nay

**Expected:** Occupancy % = (phòng occupied / tổng phòng) × 100, sai số < 0.1%.

---

### TC-REPORT-02: Revenue Report — tổng doanh thu khớp folio
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Tổng tất cả FolioItem.amount trong DB cho ngày test
2. So sánh với Revenue Report

**Expected:** Khớp.

---

### TC-REPORT-03: Xuất CSV arrivals/departures
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Vào Reports → Arrivals/Departures
2. Chọn ngày → Click "Xuất CSV"

**Expected:** File CSV download, header đúng, encoding UTF-8 (tên tiếng Việt không bị lỗi).

---

## NHÓM 8 — Bảo mật & Dữ liệu

### TC-SEC-01: PII — idNumber được mã hóa trong DB
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Tạo/cập nhật guest với `idNumber = "123456789"`
2. Query thẳng DB: `SELECT "idNumberEnc", "idNumber" FROM "Guest" WHERE ...`

**Expected:** `idNumber` NULL, `idNumberEnc` là chuỗi mã hóa (không phải "123456789"), API response trả về plain text sau decrypt.

---

### TC-SEC-02: Staff không thể đọc booking của property khác
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Có 2 property trong DB với booking riêng.

**Steps:**
1. Đăng nhập nhân viên property A
2. Gọi `booking.list` với `propertyId` của property B

**Expected:** Chỉ trả về booking của property A (server luôn dùng `ctx.propertyId` từ JWT, bỏ qua client input).

---

### TC-SEC-03: SQL Injection qua input fields
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Nhập vào ô tìm kiếm khách: `' OR '1'='1`
2. Nhập vào tên khách: `<script>alert(1)</script>`
3. Nhập vào mã đặt phòng: `HTL-2026-'; DROP TABLE "Booking"; --`

**Expected:** Không có SQL error, không có XSS, Prisma ORM xử lý safe.

---

### TC-SEC-04: CORS — Booking portal không thể gọi Staff API trực tiếp
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Từ origin `localhost:3000`, gọi fetch tới `localhost:3001/api/trpc/staff.list`

**Expected:** CORS error hoặc 403.

---

## NHÓM 9 — i18n & UX

### TC-I18N-01: Chuyển ngôn ngữ VI ↔ EN
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Mở `localhost:3000/vi` → Click chuyển EN
2. URL thay đổi sang `/en/...`
3. Quan sát toàn bộ text trên trang

**Expected:** Toàn bộ UI text chuyển sang tiếng Anh, URL prefix đúng.

---

### TC-I18N-02: SEO metadata — lang attribute đúng
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. View source `localhost:3000/vi`
2. Kiểm tra `<html lang="vi">`, `<meta property="og:locale" content="vi_VN">`

**Expected:** Đúng locale, không có hydration mismatch warning trong console.

---

### TC-I18N-03: Tên phòng hiển thị đúng ngôn ngữ
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Tạo phòng với `name = "Phòng Deluxe"` (VI)
2. Xem trang phòng ở `/en/rooms`

**Expected:** Tên phòng hiển thị version EN nếu có, fallback sang VI nếu không có.

---

## NHÓM 10 — API tRPC

### TC-API-01: publicProcedure không cần auth
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Gọi `portal.getRoomTypes` không có cookie nào

**Expected:** 200 OK, trả về danh sách phòng.

---

### TC-API-02: Confirmation code format đúng
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Tạo 10 bookings liên tiếp
2. Kiểm tra `confirmationCode` của từng booking

**Expected:** Tất cả đều format `HTL-YYYY-XXXXXX` (6 ký tự alphanumeric), không trùng nhau.

---

### TC-API-03: Pricing — weekday vs weekend đúng
**Priority:** P0 · **Risk:** 🔴 Cao

**Preconditions:** Rate plan có `weekdayPrice = 500.000`, `weekendPrice = 800.000`.

**Steps:**
1. Đặt phòng 2 đêm: thứ Sáu + thứ Bảy
2. Kiểm tra `totalAmount`

**Expected:** Total = 500.000 + 800.000 = 1.300.000 (Fri=weekend, Sat=weekend theo UTC dow 5,6).

**Note:** Weekend = Fri(5), Sat(6), Sun(0) theo UTC.

---

### TC-API-04: UTC date handling — không bị timezone shift
**Priority:** P0 · **Risk:** 🔴 Cao

**Steps:**
1. Đặt phòng checkin = "2026-08-15"
2. Kiểm tra DB `checkInDate`

**Expected:** `2026-08-15T00:00:00.000Z` (UTC midnight, không bị +7 offset).

---

### TC-API-05: Rate limit / Brute force — login attempts
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Gửi 20 request login sai password liên tiếp trong 1 phút

**Expected:** Phản hồi chậm dần hoặc rate limit sau N lần thất bại.

---

## NHÓM 11 — Real-time & Performance

### TC-RT-01: WebSocket kết nối đúng namespace
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Đăng nhập Staff web → mở DevTools → Network → WS
2. Kiểm tra kết nối Socket.io

**Expected:** Kết nối tới `/staff` namespace, token hợp lệ, join room `property:{propertyId}`.

---

### TC-RT-02: Cập nhật phòng real-time không cần F5
**Priority:** P1 · **Risk:** 🟠 Trung bình

**Steps:**
1. Mở Staff web tab 1 (đang xem grid phòng)
2. Tab 2: check-out 1 booking → phòng chuyển DIRTY

**Expected:** Tab 1 tự động cập nhật màu phòng sang DIRTY trong < 2 giây.

---

### TC-RT-03: Performance — trang load < 3 giây
**Priority:** P2 · **Risk:** 🟡 Thấp

**Steps:**
1. Mở DevTools → Network → throttle "Fast 3G"
2. Load `localhost:3000/vi/rooms`

**Expected:** LCP < 3s, không có blocking request > 1s.

---

## Checklist Go/No-Go

Trước khi deploy production, tất cả P0 tests phải PASS:

| Test ID | Description | Status |
|---|---|---|
| TC-AUTH-01 | Login Staff | ⬜ |
| TC-AUTH-02 | Login sai password bị từ chối | ⬜ |
| TC-AUTH-03 | Phân quyền role | ⬜ |
| TC-AUTH-04 | Kiosk API key invalid | ⬜ |
| TC-AUTH-06 | Cross-token không hoạt động | ⬜ |
| TC-BOOK-01 | Đặt phòng happy path | ⬜ |
| TC-BOOK-05 | Race condition | ⬜ |
| TC-KIOSK-01 | Check-in kiosk happy path | ⬜ |
| TC-KIOSK-02 | Tên sai bị từ chối | ⬜ |
| TC-KIOSK-03 | Tên có dấu normalize | ⬜ |
| TC-KIOSK-04 | Check-in quá sớm | ⬜ |
| TC-KIOSK-05 | Không còn phòng sạch | ⬜ |
| TC-KIOSK-08 | Check-out happy path | ⬜ |
| TC-STAFF-02 | Tạo booking thủ công | ⬜ |
| TC-STAFF-03 | Check-in thay | ⬜ |
| TC-STAFF-04 | Check-out thay | ⬜ |
| TC-STAFF-06 | Soft-delete only | ⬜ |
| TC-STAFF-10 | Audit log đầy đủ | ⬜ |
| TC-ROOM-03 | Optimistic locking | ⬜ |
| TC-SEC-01 | PII mã hóa | ⬜ |
| TC-SEC-02 | Property isolation | ⬜ |
| TC-SEC-03 | SQL injection / XSS | ⬜ |
| TC-API-03 | Pricing weekday/weekend | ⬜ |
| TC-API-04 | UTC date handling | ⬜ |

---

## Known Issues (từ bug fix trong session)

| ID | Mô tả | Trạng thái | File |
|---|---|---|---|
| BUG-001 | My-bookings ẩn booking CONFIRMED có checkIn đã qua | ✅ Fixed | `_MyBookingsClient.tsx` |
| BUG-002 | Hydration mismatch do locale layout render `<html><body>` | ✅ Fixed | `layout.tsx` |
| BUG-003 | Kiosk verify tên theo thứ tự Western (firstName lastName) trong khi form đăng ký dùng thứ tự Việt (họ tên) | ✅ Fixed | `kiosk.ts`, `CheckInFlow.tsx` |
