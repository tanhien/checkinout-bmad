# PRD — Staff Management Web

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 2 — Planning  
**Status:** DRAFT — awaiting user confirmation  
**Thuộc về:** Hotel Management System

---

## 1. Overview

Staff Management Web là ứng dụng web dành cho **toàn bộ nhân viên và quản lý khách sạn**, cung cấp công cụ để vận hành mọi hoạt động hàng ngày: quản lý đặt phòng, phân công phòng, theo dõi housekeeping, quản lý folio/thanh toán, và xem báo cáo. Đây là "trung tâm điều hành" kết nối dữ liệu từ cả Kiosk và Online Booking Portal.

**Người dùng:** Front Desk Staff · Housekeeping Staff · Manager · Accountant · Admin  
**Truy cập:** Trình duyệt web (Chrome/Safari/Firefox/Edge) · Mobile browser cho housekeeping  
**Môi trường:** Internal network hoặc VPN; không phải public-facing

---

## 2. Users & Roles

### 2.1 Role Matrix

| Chức năng | Front Desk | Housekeeping | Accountant | Manager | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ (limited) | ✅ | ✅ | ✅ |
| Quản lý Booking | ✅ | ❌ | 👁️ view | ✅ | ✅ |
| Check-in/out thủ công | ✅ | ❌ | ❌ | ✅ | ✅ |
| Quản lý Phòng | ✅ | ✅ | ❌ | ✅ | ✅ |
| Housekeeping Board | 👁️ view | ✅ | ❌ | ✅ | ✅ |
| Hồ sơ Khách | ✅ | ❌ | 👁️ view | ✅ | ✅ |
| Quản lý Folio | ✅ | ❌ | ✅ | ✅ | ✅ |
| Báo cáo | ❌ | ❌ | ✅ | ✅ | ✅ |
| Quản lý Nhân viên | ❌ | ❌ | ❌ | 👁️ view | ✅ |
| Cấu hình Hệ thống | ❌ | ❌ | ❌ | 🔧 limited | ✅ |

### 2.2 Mô tả từng Role

**Front Desk Staff** — Nhân viên lễ tân  
Tuyến đầu giao tiếp với khách. Cần dashboard nhanh, tìm booking tức thì, hỗ trợ check-in/out khi khách không dùng kiosk.

**Housekeeping Staff** — Nhân viên buồng phòng  
Dùng chủ yếu trên điện thoại. Xem danh sách phòng cần dọn, cập nhật trạng thái sau khi hoàn thành. Không cần truy cập booking hay thanh toán.

**Accountant — Kế toán**  
Xem folio, ghi nhận thanh toán, xuất hóa đơn, chạy báo cáo doanh thu. Không tạo/sửa booking.

**Manager — Quản lý**  
Giám sát toàn bộ vận hành. Truy cập đầy đủ trừ cấu hình hệ thống cấp độ thấp. Xem báo cáo, override quyết định của staff.

**Admin — Quản trị viên**  
Toàn quyền hệ thống: cấu hình property, quản lý nhân viên, thiết lập loại phòng và giá.

---

## 3. Functional Requirements

### 3.1 Authentication & Access Control

**FR-S-01** Đăng nhập bằng email + password. Hiển thị thông báo lỗi cụ thể khi sai thông tin (không tiết lộ email có tồn tại hay không).

**FR-S-02** Phân quyền theo role (RBAC): mỗi trang/chức năng chỉ hiển thị với role có quyền. Truy cập URL không có quyền trả về trang "Không có quyền truy cập" thay vì 404.

**FR-S-03** Session tồn tại 8 giờ; cảnh báo hết session 15 phút trước khi expire. Có checkbox "Ghi nhớ đăng nhập" (30 ngày) dành cho thiết bị cố định tại lễ tân.

**FR-S-04** Luồng reset password qua email với link hết hạn sau 24 giờ.

**FR-S-05** Audit log: ghi nhận mọi thao tác thay đổi dữ liệu (ai, lúc nào, thay đổi gì). Log chỉ có Admin đọc được.

---

### 3.2 Dashboard (Trang chủ)

**FR-S-10** Dashboard hiển thị ngay sau khi đăng nhập với các widget:

**Widget 1 — Hoạt động hôm nay:**
- Số check-in dự kiến hôm nay (và đã hoàn thành / còn lại)
- Số check-out dự kiến hôm nay (và đã hoàn thành / còn lại)
- Số khách đang ở (occupied rooms)

**Widget 2 — Tình trạng phòng (tổng hợp):**
- Phòng Đang có khách (Occupied)
- Phòng Sẵn sàng - sạch (Clean & Available)
- Phòng Cần dọn (Dirty)
- Phòng Bảo trì (Maintenance)

**Widget 3 — Cảnh báo (Alerts):**
- Check-out quá giờ (overdue checkout)
- Phòng dirty nhưng khách sắp check-in < 2 tiếng nữa
- Booking hôm nay chưa assign phòng

**Widget 4 — Lịch minimap:**
- Occupancy forecast 7 ngày tới (bar chart đơn giản)

**FR-S-11** Housekeeping staff: dashboard chỉ hiển thị danh sách phòng được assign hôm nay (không có widget booking).

**FR-S-12** Dashboard tự động refresh dữ liệu mỗi 60 giây. Real-time update cho alerts qua WebSocket.

---

### 3.3 Quản lý Đặt phòng (Booking Management)

**FR-S-20** Trang danh sách booking có:
- Filter: ngày check-in, ngày check-out, trạng thái (confirmed/checked_in/checked_out/cancelled), loại phòng
- Search: tên khách, số điện thoại, confirmation number, số phòng
- Sắp xếp theo: ngày check-in, ngày tạo, tên khách
- Phân trang (20 booking/trang)

**FR-S-21** Tạo booking mới (front desk/manager): form điền thông tin:
- Thông tin khách: tên, điện thoại, email, CCCD/Passport, quốc tịch
- Ngày check-in, check-out (date picker với availability check realtime)
- Loại phòng (hiển thị số phòng còn trống theo loại)
- Số người lớn, trẻ em
- Ghi chú đặc biệt (special requests)
- Kênh đặt (direct/phone/walk-in/OTA-manual)
- Rate plan áp dụng

**FR-S-22** Trang chi tiết booking hiển thị:
- Toàn bộ thông tin booking
- Thông tin khách (link sang hồ sơ khách)
- Phòng đã assign (nếu có)
- Folio overview (tổng phí)
- Lịch sử thay đổi booking
- Actions: Sửa / Assign phòng / Check-in / Check-out / Hủy

**FR-S-23** Chỉnh sửa booking: có thể thay đổi ngày (validate availability), loại phòng, thông tin khách, ghi chú. Phải ghi lý do khi thay đổi ngày hoặc loại phòng.

**FR-S-24** Hủy booking: chọn lý do hủy (no-show / khách yêu cầu / overbooking / khác). Không xóa vật lý, chuyển status thành `cancelled`. Chỉ Front Desk trở lên mới hủy được.

**FR-S-25** Assign phòng: dropdown chỉ hiển thị phòng đúng loại đã đặt và đang ở trạng thái `clean` hoặc `inspected`. Khi assign, phòng chuyển sang trạng thái `reserved`.

**FR-S-26** Check-in thủ công (staff-assisted): thực hiện khi khách không dùng kiosk. Cập nhật booking thành `checked_in`, ghi nhận giờ check-in thực tế. Yêu cầu phòng đã được assign trước.

**FR-S-27** Check-out thủ công: xem folio → xác nhận thanh toán → cập nhật `checked_out` → phòng thành `dirty`.

**FR-S-28** Early check-in / Late check-out: flag booking và ghi chú giờ thực tế. Không tự động tính phí thêm (phí do accountant add vào folio thủ công).

---

### 3.4 Quản lý Phòng (Room Management)

**FR-S-30** Trang danh sách phòng hiển thị grid/table tất cả phòng với:
- Số phòng, tầng, loại phòng
- Trạng thái hiện tại (màu sắc: xanh=clean, đỏ=dirty, xám=occupied, vàng=maintenance)
- Khách đang ở (nếu occupied): tên + ngày checkout
- Nhân viên housekeeping đang phụ trách (nếu đang dọn)

**FR-S-31** View theo tầng: switch giữa "All floors" và từng tầng cụ thể.

**FR-S-32** Thay đổi trạng thái phòng thủ công (Front Desk / Manager):
- `dirty` → `clean` (khi không dùng housekeeping workflow)
- Bất kỳ → `maintenance` (kèm ghi chú lý do và ngày dự kiến xong)
- `maintenance` → `dirty` (khi bảo trì xong)

**FR-S-33** Chế độ maintenance: phòng trong maintenance không thể assign cho booking, không hiển thị trong dropdown assign phòng.

**FR-S-34** Lịch sử phòng: xem danh sách booking đã và đang ở phòng đó (30 ngày gần nhất).

---

### 3.5 Housekeeping Board

**FR-S-40** Board Kanban hiển thị tất cả phòng chia thành 4 cột:
- **Dirty** — cần dọn
- **Cleaning** — đang được dọn
- **Clean** — đã sạch, chờ kiểm tra
- **Inspected** — đã kiểm tra, sẵn sàng nhận khách

Mỗi card phòng hiển thị: số phòng, tầng, loại phòng, khách sắp check-in (nếu có, kèm giờ check-in), nhân viên được assign.

**FR-S-41** Manager/Front Desk assign phòng cho housekeeping staff bằng cách drag card hoặc click assign. Một phòng chỉ assign được cho một nhân viên tại một thời điểm.

**FR-S-42** Housekeeping staff xem board trên điện thoại, chỉ thấy phòng được assign cho mình. Giao diện mobile tối ưu: card lớn, dễ bấm.

**FR-S-43** Housekeeping staff cập nhật trạng thái phòng:
- Bắt đầu dọn: `dirty` → `cleaning` (ghi nhận giờ bắt đầu)
- Dọn xong: `cleaning` → `clean` (ghi nhận giờ hoàn thành)
- Manager inspect xong: `clean` → `inspected`

**FR-S-44** Real-time: khi housekeeping cập nhật trạng thái, tất cả màn hình đang mở board đều thấy ngay không cần refresh.

**FR-S-45** Ưu tiên visual: card phòng có khách check-in trong < 2 giờ được highlight màu cam (urgent).

**FR-S-46** Manager view: thấy toàn bộ board + thời gian từ khi phòng chuyển sang `cleaning` (để monitor housekeeping productivity).

---

### 3.6 Hồ sơ Khách (Guest Profile)

**FR-S-50** Tìm kiếm khách theo: tên, email, số điện thoại, số CCCD/Passport. Hiển thị kết quả phù hợp nhất.

**FR-S-51** Trang hồ sơ khách hiển thị:
- Thông tin cá nhân (tên, liên hệ, quốc tịch, ngày sinh)
- Số lần ở (total stays) và lần ở gần nhất
- Lịch sử booking (10 booking gần nhất)
- Ghi chú nội bộ (internal notes — chỉ staff thấy)
- Tags (VIP / Blacklist / Regular / Corporate)

**FR-S-52** Chỉnh sửa hồ sơ: cập nhật thông tin liên hệ, thêm/sửa/xóa ghi chú nội bộ.

**FR-S-53** Ghi chú nội bộ có timestamp và tên người tạo. Không xóa ghi chú (chỉ manager mới xóa được).

**FR-S-54** Tag VIP/Blacklist: khi booking của khách VIP đến, dashboard hiển thị indicator. Khách Blacklist cần xác nhận thêm từ Manager khi tạo booking.

---

### 3.7 Quản lý Folio & Thanh toán

**FR-S-60** Trang folio của booking hiển thị:
- Phí phòng: số đêm × giá/đêm theo rate plan
- Phí dịch vụ: danh sách từng khoản (minibar, laundry, spa, F&B, khác)
- Thuế và phí dịch vụ (tính tự động theo % cấu hình)
- Tổng chưa thuế / Tổng có thuế
- Đã thanh toán / Còn lại

**FR-S-61** Thêm phí dịch vụ (Front Desk / Accountant):
- Chọn loại dịch vụ từ danh mục hoặc nhập tự do
- Số lượng, đơn giá
- Ghi chú (mô tả phí)
- Ngày phát sinh (mặc định: hôm nay)

**FR-S-62** Điều chỉnh phí: sửa hoặc xóa một khoản phí kèm lý do. Lịch sử điều chỉnh được lưu (không xóa vật lý).

**FR-S-63** Ghi nhận thanh toán (demo mode):
- Chọn phương thức: Tiền mặt / Thẻ ngân hàng / Chuyển khoản / Khác
- Số tiền
- Ghi chú (số hóa đơn, reference...)
- Tự động tính còn lại

**FR-S-64** Giảm giá: thêm khoản giảm giá với lý do (phần trăm hoặc số tiền cố định). Chỉ Manager trở lên mới được áp dụng discount > 10%.

**FR-S-65** Tách folio (split bill): chia folio thành 2 phần (room charge vs extras) để thanh toán bởi hai bên khác nhau (công ty và cá nhân). Chỉ Manager thực hiện.

**FR-S-66** Xuất hóa đơn PDF: in hoặc tải xuống hóa đơn chuẩn với thông tin khách sạn, booking, chi tiết phí, tổng cộng.

**FR-S-67** Đánh dấu folio đã thanh toán: khi tổng đã trả ≥ tổng phí. Không cho phép thêm phí vào folio đã settled (chỉ Manager override).

---

### 3.8 Báo cáo (Reports)

**FR-S-70** Báo cáo Công suất phòng (Occupancy Report):
- Theo ngày hoặc khoảng ngày
- Tỷ lệ % occupied, số phòng occupied/total
- So sánh với kỳ trước (tuần/tháng trước)

**FR-S-71** Báo cáo Doanh thu:
- Tổng doanh thu phòng, doanh thu dịch vụ, tổng doanh thu
- ADR (Average Daily Rate), RevPAR
- Theo ngày/tuần/tháng
- Biểu đồ đường

**FR-S-72** Báo cáo Nguồn đặt phòng (Channel Mix):
- Số booking và doanh thu theo kênh (direct/walk-in/phone/OTA-manual/kiosk)
- Biểu đồ tròn

**FR-S-73** Báo cáo Arrivals/Departures:
- Danh sách khách check-in hôm nay/tuần này
- Danh sách khách check-out hôm nay/tuần này
- Exportable

**FR-S-74** Xuất dữ liệu: mọi báo cáo có nút export CSV. Revenue report có thêm Excel (.xlsx).

---

### 3.9 Quản lý Nhân viên (Admin only)

**FR-S-80** Tạo tài khoản nhân viên: email, tên đầy đủ, role, trạng thái (active/inactive).

**FR-S-81** Vô hiệu hóa tài khoản (không xóa): nhân viên nghỉ việc không thể đăng nhập nhưng lịch sử thao tác vẫn giữ nguyên.

**FR-S-82** Đổi role nhân viên. Audit log ghi nhận ai thay đổi role của ai.

---

### 3.10 Cấu hình Hệ thống (Admin only)

**FR-S-90** Thông tin Property: tên khách sạn, địa chỉ, điện thoại, email, logo, số phòng mô tả, giờ check-in/out mặc định, múi giờ, tiền tệ.

**FR-S-91** Quản lý Loại phòng (Room Types): tên, mô tả, sức chứa (người lớn/trẻ em), tiện nghi, ảnh (tối đa 10 ảnh/loại), giá cơ bản.

**FR-S-92** Quản lý Phòng: tạo phòng với số phòng, tầng, loại phòng. Deactivate phòng (phòng deactivated không hiện trong availability).

**FR-S-93** Danh mục dịch vụ: tên dịch vụ, giá mặc định, đơn vị tính (cái/ngày/lần), danh mục (F&B/Laundry/Spa/Minibar/Khác).

**FR-S-94** Cấu hình thuế: tên thuế, tỷ lệ %, áp dụng cho (phòng/dịch vụ/tất cả).

**FR-S-95** Rate Plans: tên plan, giá áp dụng theo loại phòng, điều kiện (cancellation policy, minimum stay).

---

## 4. User Stories

| ID | Role | Story | Acceptance Criteria tóm tắt |
|---|---|---|---|
| US-S-01 | Front Desk | Tôi muốn xem danh sách check-in hôm nay để chuẩn bị chào đón khách | Dashboard widget arrivals hôm nay → click xem danh sách đầy đủ với tên, phòng, giờ dự kiến |
| US-S-02 | Front Desk | Tôi muốn tìm booking nhanh khi khách đứng chờ trước mặt | Search box → gõ tên/số điện thoại → kết quả trong < 1 giây → click vào chi tiết |
| US-S-03 | Front Desk | Tôi muốn assign phòng cho khách khi họ đến sớm | Mở booking → assign phòng → chỉ thấy phòng clean/inspected → confirm |
| US-S-04 | Front Desk | Tôi muốn check-in thủ công cho khách không dùng kiosk | Mở booking → Click Check-in → confirm → booking chuyển checked_in |
| US-S-05 | Housekeeping | Tôi muốn xem phòng nào cần dọn hôm nay trên điện thoại | Đăng nhập → board chỉ hiện phòng assign cho tôi → ưu tiên phòng có khách check-in sớm |
| US-S-06 | Housekeeping | Tôi muốn cập nhật trạng thái phòng ngay khi dọn xong | Card phòng → Swipe/tap "Dọn xong" → phòng chuyển Clean → lễ tân thấy realtime |
| US-S-07 | Manager | Tôi muốn thấy cảnh báo ngay khi có phòng checkout quá giờ | Dashboard hiện badge đỏ → click xem danh sách phòng overdue |
| US-S-08 | Manager | Tôi muốn xem báo cáo doanh thu tháng này so với tháng trước | Reports → Revenue → chọn tháng → hiển thị bảng + biểu đồ so sánh |
| US-S-09 | Accountant | Tôi muốn xuất hóa đơn PDF cho khách doanh nghiệp | Mở folio → Export Invoice PDF → tải về file với thông tin đầy đủ |
| US-S-10 | Accountant | Tôi muốn ghi nhận thanh toán tiền mặt khi khách trả trực tiếp | Folio → Add Payment → chọn Tiền mặt → nhập số tiền → Còn lại cập nhật |
| US-S-11 | Admin | Tôi muốn thêm phòng mới khi khách sạn mở rộng | Settings → Rooms → Add Room → nhập số phòng, tầng, loại → Save |
| US-S-12 | Admin | Tôi muốn vô hiệu hóa tài khoản nhân viên nghỉ việc | Settings → Staff → chọn nhân viên → Deactivate → tài khoản không đăng nhập được |

---

## 5. Business Rules

**BR-S-01 Check-in yêu cầu phòng assigned:** Không thể check-in booking nếu chưa assign phòng cụ thể. Hệ thống ngăn action và hiển thị hướng dẫn assign trước.

**BR-S-02 Phòng chỉ assign khi clean/inspected:** Dropdown assign phòng chỉ hiển thị phòng có trạng thái `clean` hoặc `inspected`. Phòng `dirty`, `cleaning`, `occupied`, `maintenance` không xuất hiện.

**BR-S-03 Không xóa vật lý dữ liệu:** Mọi entity (booking, folio item, ghi chú, nhân viên) chỉ được soft-delete hoặc deactivate. Dữ liệu lịch sử luôn được giữ nguyên.

**BR-S-04 Audit trail bắt buộc:** Mọi thay đổi dữ liệu quan trọng (booking, folio, role) phải ghi log với: user_id, timestamp, field thay đổi, giá trị cũ → mới.

**BR-S-05 Discount giới hạn theo role:** Discount ≤ 10% → Front Desk và Accountant được tạo. Discount > 10% → chỉ Manager và Admin.

**BR-S-06 Folio settled:** Folio đã settled không cho phép thêm phí mới hoặc thay đổi. Manager override bằng cách "Reopen folio" (ghi log lý do).

**BR-S-07 Housekeeping assignment:** Một phòng chỉ assign cho một housekeeping staff tại một thời điểm. Nếu cần reassign, phải unassign trước.

**BR-S-08 Booking cancellation:** Hủy booking không xóa folio. Mọi phí đã phát sinh vẫn lưu, payment refund ghi nhận thủ công bởi Accountant.

**BR-S-09 Room maintenance block:** Phòng trong `maintenance` không thể assign cho bất kỳ booking nào. Khi mở `maintenance`, phải có ngày dự kiến xong.

**BR-S-10 Concurrent booking protection:** Hai front desk không thể assign cùng một phòng cho hai booking khác nhau cùng lúc. Hệ thống dùng optimistic locking (hiển thị lỗi "Phòng vừa được assign cho booking khác").

---

## 6. Non-Functional Requirements

### Hiệu năng
- **NFR-S-01** Dashboard load < 2 giây (sau đăng nhập lần đầu).
- **NFR-S-02** Search booking trả kết quả < 1 giây.
- **NFR-S-03** Housekeeping board update realtime < 500ms từ khi staff cập nhật đến khi màn hình khác refresh.
- **NFR-S-04** Hỗ trợ tối đa 50 concurrent users mà không degradation performance (phù hợp khách sạn ≤ 300 phòng).

### Giao diện
- **NFR-S-05** Desktop-first UI với sidebar navigation. Responsive cho mobile (housekeeping staff).
- **NFR-S-06** Housekeeping board có dedicated mobile layout (card lớn 44px touch target, swipe gesture cho cập nhật trạng thái).
- **NFR-S-07** Bảng màu trực quan cho trạng thái phòng: xanh lá (clean/inspected), đỏ (dirty), xám (occupied), cam (maintenance), tím (cleaning).

### Bảo mật
- **NFR-S-08** Mọi API endpoint yêu cầu xác thực JWT hợp lệ.
- **NFR-S-09** Rate limiting: tối đa 100 requests/phút/user để chống brute force.
- **NFR-S-10** Dữ liệu CCCD/Passport khách được mã hóa trong database (AES-256 at rest).
- **NFR-S-11** Session invalidate ngay khi admin deactivate tài khoản nhân viên.

### Khả năng sử dụng
- **NFR-S-12** Hỗ trợ Tiếng Việt và Tiếng Anh; language preference lưu theo user account.
- **NFR-S-13** Không yêu cầu offline mode. Khi mất kết nối, hiển thị banner "Mất kết nối — dữ liệu có thể chưa cập nhật".

---

## 7. Out of Scope (Staff Web v1)

- **Quản lý ca làm việc / shift** — phân ca, chấm công nhân viên
- **Tích hợp channel manager tự động** — booking từ Booking.com/Agoda phải nhập tay (hoặc import CSV)
- **POS (Point of Sale) nhà hàng/quầy bar** — chỉ thêm F&B charges thủ công vào folio
- **Quản lý inventory** (minibar, amenities stock tracking)
- **Push notification trên mobile** cho manager — alerts chỉ trên dashboard web
- **Chat nội bộ** giữa nhân viên
- **Revenue management tự động** (yield management, dynamic pricing)
- **Loyalty program** quản lý điểm thưởng
- **Multi-property dashboard** (xem nhiều khách sạn cùng lúc) — Epic 7
- **API tích hợp** với hệ thống kế toán (SAP, MISA...)

---

## 8. Open Questions

| ID | Câu hỏi | Ảnh hưởng đến |
|---|---|---|
| OQ-S-01 | **Housekeeping mobile UX**: Có cần tạo trang riêng tối ưu cho mobile (route `/housekeeping`) hay responsive layout là đủ? | FR-S-42, sprint planning |
| OQ-S-02 ⚠️ | **Realtime mechanism**: Dùng WebSocket (Socket.io) hay Server-Sent Events cho housekeeping board realtime? Ảnh hưởng đến hosting (cần sticky sessions hoặc Redis adapter). | Architecture — realtime layer |
| OQ-S-03 | **Audit log visibility**: Chỉ Admin đọc được audit log, hay Manager cũng cần thấy log của team mình? | FR-S-05, RBAC design |
| OQ-S-04 | **Import OTA booking**: Có cần tính năng import booking từ file CSV/Excel (từ Booking.com extranet) không, hay nhập tay từng cái? | FR-S-21 scope |
| OQ-S-05 | **Báo cáo email tự động**: Manager có muốn nhận báo cáo daily/weekly tự động qua email không? | Reports scope v1 vs v2 |
| OQ-S-06 ⚠️ | **Múi giờ**: Hệ thống lưu timestamps theo UTC rồi convert, hay lưu theo local timezone? Ảnh hưởng toàn bộ date/time logic trong DB. | Architecture — timezone strategy |
| OQ-S-07 | **Rate plan phức tạp**: Rate plan có cần hỗ trợ giá theo ngày trong tuần (weekend vs weekday pricing) trong v1 không? | FR-S-95, availability engine |
| OQ-S-08 | **Blacklist handling**: Khi khách Blacklist cố đặt phòng online, hệ thống chặn hay chỉ cảnh báo nhân viên? | FR-S-54, online booking integration |
| OQ-S-09 | **Invoice template**: Có cần customize mẫu hóa đơn PDF theo từng khách sạn (logo, địa chỉ, format)? Hay một mẫu chung? | FR-S-66, Admin config scope |

---

## 9. Review Checklist

Trước khi sang Phase 3, confirm các điểm sau:

- [x] Danh sách roles và quyền trong Role Matrix đúng
- [x] Dashboard widgets đủ thông tin cần thiết cho ca trực
- [x] Housekeeping workflow (Dirty → Cleaning → Clean → Inspected) đúng với quy trình thực tế
- [x] Folio / thanh toán demo đủ cho mục đích demo sản phẩm
- [x] Out of Scope chấp nhận được cho v1
- [x] Các Open Questions được giải đáp (ít nhất OQ-S-02 và OQ-S-06 trước Phase 3)
- ** OQ-S-01 responsive **
- ** OQ-S-02 WebSocket **
- ** OQ-S-03 Admin **
- ** OQ-S-04 không **
- ** OQ-S-05 không **
- ** OQ-S-06 UTC **
- ** OQ-S-07 có **
- ** OQ-S-08 cảnh báo **
- ** OQ-S-09 theo từng khách sạn **

**Sau khi confirm, gọi `/bmad-prd booking` để tạo PRD cho Online Booking Portal.**
