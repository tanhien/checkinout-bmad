# Product Brief — Hotel Management System

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 1 — Analysis  
**Status:** DRAFT — awaiting user confirmation

---

## Vision

Khách sạn Việt Nam ở mọi quy mô — từ guesthouse nhỏ đến resort lớn — đang vận hành bằng phần mềm nước ngoài đắt tiền (Opera, Cloudbeds) hoặc bảng tính Excel thủ công, không có lựa chọn trung gian phù hợp với thực tế địa phương. Hệ thống này được xây dựng như một nền tảng quản lý khách sạn toàn diện, mã nguồn mở theo phương pháp, dễ triển khai, và có thể thích nghi với mọi loại hình lưu trú — từ hostel đến serviced apartment — thông qua cấu hình chứ không phải viết lại code. Mục tiêu là trao cho chủ khách sạn một công cụ hiện đại: khách tự phục vụ qua kiosk, nhân viên quản lý vận hành trên web, khách đặt phòng trực tuyến — tất cả kết nối trên một nền tảng duy nhất.

---

## Target Users

### 1. Khách lưu trú (Guest — Kiosk & Booking Portal)
**Pain point:** Phải xếp hàng chờ làm thủ tục check-in/check-out tại quầy lễ tân, đặc biệt giờ cao điểm. Đặt phòng trực tuyến phức tạp, phải gọi điện xác nhận.  
**Nhu cầu:** Tự làm thủ tục nhanh trên kiosk trong vài phút; đặt phòng và quản lý booking từ điện thoại/máy tính.

### 2. Nhân viên Lễ tân (Front Desk Staff — Staff Web)
**Pain point:** Phải tra cứu thông tin khách trên nhiều hệ thống rời rạc, cập nhật trạng thái phòng thủ công, dễ sai sót khi nhiều khách check-in cùng lúc.  
**Nhu cầu:** Dashboard real-time toàn bộ hoạt động trong ngày; thao tác assign phòng, check-in thay nhanh khi khách cần hỗ trợ.

### 3. Nhân viên Buồng phòng (Housekeeping — Staff Web)
**Pain point:** Nhận nhiệm vụ qua giấy hoặc lời miệng, không biết phòng nào ưu tiên, không cập nhật được trạng thái phòng ngay tại chỗ.  
**Nhu cầu:** Danh sách nhiệm vụ theo phòng trên điện thoại/tablet, cập nhật trạng thái (đang dọn / đã sạch / cần kiểm tra) tức thời.

### 4. Quản lý Khách sạn (Manager — Staff Web)
**Pain point:** Không có báo cáo tập trung; phải tổng hợp dữ liệu từ nhiều nguồn để biết công suất, doanh thu, tình hình đặt phòng.  
**Nhu cầu:** Báo cáo occupancy, ADR, RevPAR theo ngày/tháng; cảnh báo phòng bỏ trống, booking sắp hết hạn.

### 5. Chủ khách sạn / Nhà triển khai (Property Owner / Deployer)
**Pain point:** Phần mềm PMS thương mại chi phí cao, khó tùy biến theo loại hình riêng (hostel, resort, serviced apt).  
**Nhu cầu:** Hệ thống cấu hình được theo `property_type`; triển khai độc lập không phụ thuộc vendor; tích hợp payment gateway theo yêu cầu từng khách hàng.

---

## Value Proposition

| So sánh | Hệ thống này | PMS thương mại (Opera, Cloudbeds) | Excel / thủ công |
|---|---|---|---|
| Chi phí | Không phí license | $200–$500+/tháng | Miễn phí nhưng tốn nhân lực |
| Kiosk tự phục vụ | Có (Android + Windows) | Addon tốn kém | Không có |
| Đa loại hình khách sạn | Có (config-based) | Giới hạn theo gói | Không |
| Đặt phòng trực tuyến | Tích hợp sẵn | Cần tích hợp thêm | Không |
| Tùy biến | Toàn quyền | Hạn chế | N/A |
| Demo/Prototype | Có (payment demo) | Không | Không |

**Lợi thế cốt lõi:** Một codebase duy nhất phục vụ được tất cả các bên (khách, nhân viên, quản lý) trên ba giao diện riêng biệt (kiosk, staff web, booking portal), với khả năng bật/tắt module theo từng loại hình khách sạn.

---

## Scope

### Trong phạm vi (In Scope)

**Kiosk App:**
- Check-in tự phục vụ: tra cứu booking, xác minh danh tính, xem thông tin phòng, nhận xác nhận
- Check-out tự phục vụ: xem folio, thanh toán demo, nhận receipt (email + in)
- Hỗ trợ: Android tablet và Windows PC (Electron)

**Staff Management Web:**
- Dashboard hoạt động trong ngày (arrivals, departures, occupancy)
- Quản lý đặt phòng: tạo, xem, sửa, hủy
- Quản lý phòng: assign, trạng thái, maintenance flag
- Housekeeping board: task theo phòng, cập nhật trạng thái realtime
- Hồ sơ khách: lịch sử, ghi chú
- Quản lý folio: phí dịch vụ, điều chỉnh, xuất hóa đơn
- Báo cáo cơ bản: occupancy, doanh thu, channel mix

**Online Booking Portal:**
- Tìm kiếm phòng theo ngày, số khách
- Hiển thị phòng với ảnh, tiện nghi, giá
- Luồng đặt phòng: chọn → thông tin khách → thanh toán demo → xác nhận
- Quản lý booking của khách (xem, hủy)
- Email xác nhận đặt phòng

**Đa loại hình:**
- Boutique, Business Hotel, Resort, Budget/Hostel, Serviced Apartment, Motel
- Mỗi loại kích hoạt module riêng qua `property_type` config

### Ngoài phạm vi (Out of Scope — v1)

- Tích hợp payment gateway thực tế (VNPay, Stripe, MoMo) — demo only trong v1
- Channel manager (Booking.com, Agoda OTA sync) — phase sau
- POS (Point of Sale) cho F&B/nhà hàng
- Tích hợp key card vật lý (encoder phần cứng) — màn hình hướng dẫn thủ công
- Mobile app native (iOS/Android) cho khách — booking portal responsive đủ dùng
- Revenue management / dynamic pricing tự động
- Đa ngôn ngữ UI (v1 hỗ trợ Tiếng Việt + Tiếng Anh)
- Accounting/ERP integration

---

## Key Assumptions

1. **Kiosk không cần offline hoàn toàn** — kết nối internet ổn định tại khách sạn; mất kết nối ngắn hạn chỉ cần thông báo lỗi rõ ràng.
2. **Khách có booking trước khi đến kiosk** — luồng walk-in qua kiosk là use case phụ; lễ tân vẫn xử lý walk-in phức tạp.
3. **Key card vật lý** — giai đoạn đầu in/phát thẻ thủ công; kiosk chỉ hiển thị hướng dẫn và số phòng. Tích hợp encoder hardware là phase sau.
4. **Một property mỗi deployment ban đầu** — multi-property là Epic 7, không phải yêu cầu v1.
5. **Staff có máy tính/tablet** — staff web không cần offline mode; housekeeping dùng điện thoại truy cập web app.
6. **Payment demo đủ để demo/bán hàng** — khách hàng thực tế sẽ yêu cầu gateway cụ thể khi ký hợp đồng.
7. **PostgreSQL là đủ cho quy mô mục tiêu** — dưới 300 phòng, không cần sharding hay NoSQL cho v1.

---

## Success Metrics

### Metrics kỹ thuật (sau Phase 4 hoàn thành)
| Metric | Target |
|---|---|
| Thời gian check-in qua kiosk | < 3 phút cho 90% trường hợp |
| Thời gian tải dashboard staff | < 2 giây |
| Uptime hệ thống | > 99.5% |
| Thời gian hoàn tất booking online | < 5 phút từ search đến confirm |

### Metrics sản phẩm (sau deployment thực tế)
| Metric | Target |
|---|---|
| Tỷ lệ khách tự check-in qua kiosk | > 60% tổng check-in |
| Tỷ lệ đặt phòng qua booking portal | > 30% tổng booking |
| Giảm thời gian xử lý check-out | > 40% so với thủ công |
| Staff adoption rate | > 80% nhân viên dùng hàng ngày sau 2 tuần |

### Milestone delivery
| Milestone | Điều kiện hoàn thành |
|---|---|
| Phase 1 ✅ | Product Brief được confirm |
| Phase 2 | 3 PRDs + UX flows được confirm |
| Phase 3 | Architecture + epics-stories được confirm |
| MVP | Kiosk check-in/out + Staff dashboard hoạt động end-to-end |
| v1.0 | Cả 3 hệ thống hoạt động, demo được với khách hàng thực |

---

## Review Checklist

Trước khi sang Phase 2 (PRD), hãy confirm các điểm sau:

- [x] Vision phản ánh đúng mục tiêu của bạn
- [x] Target users đủ và đúng ưu tiên
- [x] Scope IN đủ cho v1 demo/bán hàng được
*Ghi chú: Kiosk App, Guest khi check in thêm trường hợp chưa có booking có thể tìm kiếm và booking trên kiosk.*
- [x] Scope OUT chấp nhận được (không thiếu gì bắt buộc phải có)
- [x] Assumptions hợp lý với thực tế triển khai
- [x] Success metrics đo được và thực tế

**Sau khi confirm, gọi `/bmad-prd kiosk` để bắt đầu Phase 2.**
