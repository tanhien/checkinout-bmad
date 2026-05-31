# PRD — Online Booking Portal

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 2 — Planning  
**Status:** DRAFT — awaiting user confirmation  
**Thuộc về:** Hotel Management System

---

## 1. Overview

Online Booking Portal là website công khai (public-facing) cho phép khách tự tìm kiếm phòng trống, xem thông tin chi tiết, và đặt phòng trực tuyến mà không cần liên hệ khách sạn. Đây là kênh đặt phòng direct của khách sạn — thay thế gọi điện, giúp giảm chi phí OTA commission, và tạo trải nghiệm đặt phòng chuyên nghiệp 24/7.

**Người dùng:** Khách đại chúng (chưa đăng nhập) · Khách có tài khoản (đã đăng nhập)  
**Truy cập:** Public internet, mọi thiết bị (desktop, mobile, tablet)  
**SEO:** Public pages được index bởi Google — bắt buộc Server-Side Rendering

---

## 2. Users & Roles

### 2.1 Khách vô danh (Guest / Anonymous)
Người dùng chưa đăng ký hoặc chưa đăng nhập. Có thể tìm kiếm và đặt phòng hoàn toàn mà không cần tài khoản (guest checkout).  
**Mục tiêu:** Tìm phòng → đặt ngay → nhận confirmation email — dưới 5 phút.

### 2.2 Khách đã đăng ký (Registered Guest)
Khách tạo tài khoản để theo dõi booking lịch sử, thông tin cá nhân tự điền sẵn khi đặt lần sau.  
**Mục tiêu:** Xem lịch sử booking, hủy/quản lý booking, đặt nhanh hơn nhờ thông tin đã lưu.

> Khách sạn không có admin access vào Booking Portal — mọi quản lý booking phía sau dùng Staff Web.

---

## 3. Functional Requirements

### 3.1 Trang Chủ & Tìm kiếm

**FR-B-01** Trang chủ hiển thị:
- Hero section với ảnh/video khách sạn, tên property, tagline
- Search widget nổi bật gồm: ngày check-in, ngày check-out (date picker), số người lớn, số trẻ em
- Nút "Tìm phòng" dẫn đến trang kết quả
- Section giới thiệu ngắn về khách sạn (từ property config)
- Section highlight các loại phòng nổi bật (tối đa 3 loại)
- Thông tin liên hệ và địa chỉ

**FR-B-02** Date picker:
- Không cho chọn ngày trong quá khứ (từ hôm nay trở đi)
- Check-out phải sau check-in tối thiểu 1 đêm
- Tối đa `max_advance_booking_days` ngày trước (mặc định 365 ngày, configurable)
- Khi chọn check-in, check-out tự nhảy sang ngày tiếp theo

**FR-B-03** Sau khi submit search, hệ thống kiểm tra availability và điều hướng đến trang kết quả (Rooms Listing).

---

### 3.2 Trang Danh sách Phòng (Rooms Listing)

**FR-B-10** Hiển thị danh sách các loại phòng còn trống cho khoảng ngày đã chọn.

Mỗi room type card hiển thị:
- Ảnh đại diện (slideshow mini 3-5 ảnh)
- Tên loại phòng
- Diện tích (m²), sức chứa (người lớn / trẻ em)
- Tiện nghi nổi bật (icon: WiFi, AC, TV, Minibar, Bathtub...)
- Giá/đêm và tổng giá cho số đêm đã chọn
- Cancellation policy tóm tắt (Free cancellation / Non-refundable)
- Nút "Chọn phòng" / "Xem chi tiết"

**FR-B-11** Nếu loại phòng hết phòng cho ngày đã chọn: hiển thị card mờ với badge "Hết phòng" — không ẩn đi hoàn toàn (để khách biết sản phẩm tồn tại).

**FR-B-12** Filter sidebar/panel:
- Lọc theo giá (slider min-max)
- Lọc theo sức chứa (số người)
- Lọc theo tiện nghi (checkbox: có bồn tắm, có ban công, có view biển...)
- Lọc theo loại giường (double, twin, king...)

**FR-B-13** Sắp xếp: theo Giá tăng dần / Giá giảm dần / Diện tích.

**FR-B-14** Summary bar phía trên kết quả: "X loại phòng còn trống cho [ngày check-in] - [ngày check-out] · [N đêm] · [N khách]". Có nút sửa ngay tại chỗ.

---

### 3.3 Trang Chi tiết Phòng (Room Detail)

**FR-B-20** URL thân thiện SEO: `/rooms/[slug]` (e.g., `/rooms/deluxe-ocean-view`).

**FR-B-21** Photo gallery: tối đa 20 ảnh, xem ở chế độ fullscreen lightbox. Ảnh phải load lazy.

**FR-B-22** Thông tin đầy đủ:
- Tên, diện tích, sức chứa, loại giường
- Mô tả dài (rich text, từ admin config)
- Danh sách tiện nghi đầy đủ (icon + tên)
- Chính sách phòng (hút thuốc, thú cưng, trẻ em...)
- Cancellation policy đầy đủ

**FR-B-23** Availability mini calendar: highlight ngày available (xanh) và ngày blocked (đỏ/xám) trong 3 tháng tới.

**FR-B-24** Booking widget sticky (desktop) hoặc bottom bar (mobile):
- Ngày check-in/check-out và số khách (prefilled từ search)
- Giá/đêm và tổng
- Nút "Đặt ngay"
- Khi click, chuyển sang Booking Funnel với phòng này đã chọn

---

### 3.4 Booking Funnel (Luồng Đặt phòng)

Funnel gồm 4 bước, hiển thị progress bar ở đầu trang.

**FR-B-30 Bước 1 — Xác nhận lựa chọn:**
- Tóm tắt: loại phòng, ảnh nhỏ, ngày check-in/out, số đêm, số khách
- Rate options (nếu có nhiều rate plan): e.g., "Hoàn tiền đầy đủ" vs "Không hoàn tiền (rẻ hơn 15%)"
- Nhập promo code: text field + nút "Áp dụng" → hiển thị discount hoặc thông báo lỗi
- Tổng tiền sau discount
- Nút "Tiếp tục"

**FR-B-31 Bước 2 — Thông tin khách:**
Fields:
- Họ và tên (bắt buộc)
- Email (bắt buộc) — dùng gửi confirmation
- Số điện thoại (bắt buộc)
- Quốc tịch (dropdown, bắt buộc)
- Số CCCD/Passport (bắt buộc)
- Ngày đến dự kiến (giờ check-in dự kiến — optional, để khách sạn chuẩn bị)
- Special requests (textarea, không bắt buộc): yêu cầu đặc biệt, dị ứng, sở thích phòng...
- Option "Lưu thông tin cho lần sau" (nếu đang đăng nhập)

**FR-B-32 Bước 3 — Xem lại & Xác nhận:**
- Tóm tắt đầy đủ booking (phòng, ngày, khách, tổng tiền)
- Chính sách hủy phòng (rõ ràng, có dấu ngày deadline)
- Điều khoản sử dụng và chính sách bảo mật (checkbox đồng ý)
- Nút "Xác nhận & Thanh toán"

**FR-B-33 Bước 4 — Thanh toán (Demo):**
- Hiển thị tổng tiền cần thanh toán
- Mô phỏng giao diện thanh toán (card form placeholder, không kết nối thật)
- Nút "Thanh toán thành công" (giả lập) — tạo booking ngay
- Nút "Giả lập thất bại" (để test UI lỗi)
- Loader animation trong 2 giây trước khi chuyển sang trang xác nhận

**FR-B-34 Trang Xác nhận (Confirmation):**
- Mã xác nhận booking (confirmation number) nổi bật
- Tóm tắt booking (phòng, ngày, khách)
- Hướng dẫn check-in (giờ, địa chỉ, cách dùng kiosk)
- Nút "Thêm vào Google Calendar"
- Nút "In trang này" / "Tải PDF"
- Link "Quản lý booking" (dẫn đến My Bookings nếu đã đăng nhập, hoặc lookup form nếu chưa)

**FR-B-35** Email xác nhận gửi ngay sau khi booking thành công, bao gồm:
- Confirmation number (nổi bật, dễ dùng khi check-in kiosk)
- QR code chứa confirmation number (để quét tại kiosk)
- Thông tin phòng, ngày, khách
- Chính sách hủy
- Địa chỉ và thông tin liên hệ khách sạn
- Link xem/hủy booking

---

### 3.5 Tài khoản Khách (Guest Account)

**FR-B-40** Đăng ký tài khoản: email + password + tên đầy đủ. Xác nhận email sau khi đăng ký (gửi link verify).

**FR-B-41** Đăng nhập bằng email + password. "Quên mật khẩu" flow qua email.

**FR-B-42** Khách có thể đặt phòng mà **không cần tài khoản** (guest checkout). Sau khi đặt thành công, gợi ý tạo tài khoản để quản lý booking dễ hơn.

**FR-B-43** Trang "Booking của tôi" (My Bookings):
- Tabs: Sắp tới / Đã ở / Đã hủy
- Mỗi booking: confirmation number, phòng, ngày, trạng thái, nút "Xem chi tiết" / "Hủy"

**FR-B-44** Trang chi tiết booking (My Booking Detail):
- Toàn bộ thông tin booking
- Trạng thái hiện tại (Confirmed / Checked-in / Checked-out / Cancelled)
- Chính sách hủy và deadline
- Nút "Hủy booking" (nếu còn trong window hủy miễn phí)
- QR code và confirmation number để dùng tại kiosk

**FR-B-45** Hủy booking qua portal:
- Hiển thị chính sách hủy áp dụng và số tiền hoàn lại (demo: luôn hiển thị "Hoàn tiền đầy đủ" hoặc "Không hoàn tiền" theo policy)
- Confirm dialog với lý do hủy (optional)
- Sau khi hủy, gửi email xác nhận hủy

**FR-B-46** Trang hồ sơ tài khoản: cập nhật tên, điện thoại, quốc tịch, ngày sinh. Đổi password.

**FR-B-47** Tra cứu booking không cần đăng nhập: nhập confirmation number + email → xem thông tin booking (dành cho khách đặt guest checkout).

---

### 3.6 Promo Codes

**FR-B-50** Promo code được nhập ở Bước 1 funnel và áp dụng ngay.

**FR-B-51** Validate promo code:
- Mã tồn tại và còn hiệu lực (chưa hết hạn)
- Áp dụng cho loại phòng đang đặt (nếu code giới hạn loại phòng)
- Chưa đạt giới hạn số lần sử dụng (nếu có giới hạn)
- Hiển thị thông báo lỗi cụ thể nếu không hợp lệ

**FR-B-52** Discount types:
- Phần trăm (e.g., giảm 15%)
- Số tiền cố định (e.g., giảm 200,000 VND)

**FR-B-53** Hiển thị sau khi áp code:
- Giá gốc gạch ngang
- Số tiền được giảm
- Giá sau khi giảm
- Tên/mô tả promo (e.g., "Ưu đãi mùa hè 2025")

---

### 3.7 Nội dung & SEO

**FR-B-60** Trang Giới thiệu (/about): mô tả khách sạn, lịch sử, tầm nhìn, hình ảnh.

**FR-B-61** Trang Tiện nghi (/amenities): danh sách facilities (hồ bơi, spa, nhà hàng, gym...) với ảnh và mô tả.

**FR-B-62** Trang Liên hệ (/contact): địa chỉ, số điện thoại, email, bản đồ Google Maps embed, form liên hệ (gửi email).

**FR-B-63** Meta tags SEO cho mọi trang: `<title>`, `<meta description>`, Open Graph (Facebook/Twitter sharing preview).

**FR-B-64** Sitemap.xml tự động generate bao gồm tất cả room type pages và static pages.

**FR-B-65** Structured data (Schema.org) cho trang chủ (Hotel schema) và trang phòng (HotelRoom schema).

---

## 4. User Stories

| ID | Role | Story | Acceptance Criteria tóm tắt |
|---|---|---|---|
| US-B-01 | Guest | Tôi muốn tìm phòng trống cho dịp cuối tuần | Chọn ngày trên search widget → xem danh sách phòng còn trống theo ngày |
| US-B-02 | Guest | Tôi muốn xem ảnh phòng trước khi đặt | Click room card → gallery lightbox → xem full-size ảnh |
| US-B-03 | Guest | Tôi muốn đặt phòng mà không cần tạo tài khoản | Funnel 4 bước → nhập email → đặt xong → nhận email confirmation |
| US-B-04 | Guest | Tôi muốn dùng mã giảm giá mà công ty cấp | Bước 1 funnel → nhập promo code → giảm giá hiển thị ngay |
| US-B-05 | Guest | Tôi muốn nhận email xác nhận có QR code để check-in kiosk | Sau đặt phòng → email có QR code → quét tại kiosk |
| US-B-06 | Registered Guest | Tôi muốn xem danh sách booking sắp tới của mình | Đăng nhập → My Bookings → tab "Sắp tới" → danh sách booking |
| US-B-07 | Registered Guest | Tôi muốn hủy booking và biết sẽ được hoàn bao nhiêu tiền | My Booking → Hủy → xem cancellation policy + số tiền hoàn → confirm |
| US-B-08 | Guest (guest checkout) | Tôi muốn tra cứu booking mà không cần đăng nhập | /my-booking → nhập confirmation + email → xem thông tin booking |
| US-B-09 | Guest | Tôi muốn biết chính sách hủy phòng trước khi đặt | Room detail page → mô tả rõ cancellation policy → hiển thị lại ở Bước 3 funnel |
| US-B-10 | Guest | Tôi muốn thêm yêu cầu đặc biệt (phòng tầng cao, gối cứng) | Bước 2 funnel → textarea special requests → lưu vào booking |

---

## 5. Business Rules

**BR-B-01 Availability real-time:** Hệ thống kiểm tra availability tại thời điểm khách submit Bước 3 (confirm), không chỉ khi search. Nếu phòng vừa hết giữa chừng, hiển thị thông báo và quay lại chọn phòng khác.

**BR-B-02 Guest checkout (không tài khoản):** Khách đặt được mà không cần tài khoản. Email là định danh duy nhất để tra cứu booking sau.

**BR-B-03 Tổng đêm tối thiểu:** Tối thiểu 1 đêm (check-out phải khác ngày check-in). Một số property có thể cấu hình `min_stay_nights`.

**BR-B-04 Advance booking limit:** Không thể đặt phòng quá `max_advance_booking_days` ngày trước (mặc định 365 ngày, configurable per property).

**BR-B-05 Promo code áp dụng:** Một booking chỉ áp dụng được một promo code. Promo code được validate server-side — không tin client.

**BR-B-06 Cancellation policy enforcement:**
- **Free cancellation window:** hủy trước `free_cancel_hours` giờ trước check-in (configurable, mặc định 48 giờ) → hoàn tiền đầy đủ (demo)
- **Non-refundable rate:** không hoàn tiền dù hủy bất kỳ lúc nào
- **Sau deadline:** giữ nguyên phí hoặc theo chính sách property

**BR-B-07 Booking lock sau payment:** Khi khách click "Thanh toán", booking được tạm "lock" trong hệ thống trong 5 phút để tránh race condition. Nếu payment demo fail, lock released.

**BR-B-08 Email bắt buộc:** Email là trường bắt buộc — cần để gửi confirmation và dùng làm QR payload cho kiosk check-in.

**BR-B-09 Rate plan conflict:** Nếu khách đang ở giữa funnel mà rate plan thay đổi (admin cập nhật giá), giá hiển thị trong funnel được giữ nguyên cho đến khi session kết thúc (hoặc 30 phút timeout).

**BR-B-10 CCCD/Passport required:** Số CCCD/Passport là trường bắt buộc ở Bước 2 (yêu cầu pháp lý lưu trú). Validate format: 9 hoặc 12 chữ số cho CCCD Việt Nam; passport các định dạng tự do.

---

## 6. Non-Functional Requirements

### Hiệu năng & Core Web Vitals
- **NFR-B-01** Largest Contentful Paint (LCP) < 2.5 giây trên mobile 4G.
- **NFR-B-02** Tổng JavaScript bundle < 200KB gzipped cho initial load.
- **NFR-B-03** Ảnh phòng lazy load; dùng Next.js `<Image>` với optimization tự động (WebP, resize).
- **NFR-B-04** API availability check trả kết quả < 1 giây.

### SEO
- **NFR-B-05** Tất cả public pages (trang chủ, room listing, room detail, about, contact) được Server-Side Rendered (SSR) hoặc Static Generated (ISR) — không client-side only.
- **NFR-B-06** Canonical URLs, hreflang (VI/EN), structured data Schema.org.
- **NFR-B-07** Không có content đặt sau login (trừ My Bookings) — tất cả phòng và giá phải crawlable.

### Responsive & Mobile-first
- **NFR-B-08** Thiết kế mobile-first: layout tối ưu cho màn hình 375px+.
- **NFR-B-09** Funnel thanh toán dùng được hoàn toàn trên mobile (không cần pinch/zoom).
- **NFR-B-10** Date picker mobile-friendly (native input hoặc custom optimized).

### Accessibility
- **NFR-B-11** WCAG 2.1 AA compliance: contrast ratios, keyboard navigation, screen reader compatible.
- **NFR-B-12** Form labels và error messages rõ ràng, không chỉ dùng placeholder.

### Đa ngôn ngữ
- **NFR-B-13** Hỗ trợ Tiếng Việt (`/vi/`) và Tiếng Anh (`/en/`). URL locale prefix để SEO đúng.
- **NFR-B-14** Ngày tháng và số tiền format theo locale (DD/MM/YYYY cho VI, MM/DD/YYYY cho EN; dấu phân cách hàng nghìn).
- **NFR-B-15** Language preference lưu trong cookie, tự detect từ browser language khi lần đầu truy cập.

### Bảo mật
- **NFR-B-16** Guest account passwords hashed (bcrypt, min 10 rounds).
- **NFR-B-17** CSRF protection cho mọi form POST.
- **NFR-B-18** Rate limiting: tối đa 10 booking attempts/IP/giờ để chống spam.
- **NFR-B-19** Promo code validate server-side; không expose danh sách codes qua API.
- **NFR-B-20** Email khách không hiển thị công khai trong bất kỳ trang nào.

---

## 7. Out of Scope (Booking Portal v1)

- **Real payment gateway** (VNPay, Stripe, MoMo...) — demo payment chỉ
- **Đặt nhiều phòng cùng lúc** trong một booking — mỗi booking 1 phòng
- **Gói dịch vụ (packages)** tích hợp sẵn: breakfast, airport transfer, spa — v2
- **Loyalty program / điểm tích lũy** — v2
- **Reviews và ratings** của khách — v2
- **So sánh phòng** side-by-side
- **Live chat / chatbot** hỗ trợ đặt phòng
- **Corporate booking portal** (B2B, company account, invoice splitting)
- **Channel manager sync** (giá/availability từ Booking.com...) — phase sau
- **Gift cards / vouchers** dạng tiền mặt
- **Upsell tại thời điểm booking** (upgrade phòng, sản phẩm thêm)
- **Apple Pay / Google Pay** — v2 khi có real payment

---

## 8. Open Questions

| ID | Câu hỏi | Ảnh hưởng đến |
|---|---|---|
| OQ-B-01 ⚠️ | **URL structure**: Portal chạy ở domain riêng (e.g., `booking.hotel.com`) hay subdirectory của website khách sạn (`hotel.com/booking`)? Ảnh hưởng đến SEO strategy và deployment. | Architecture — routing, deployment |
| OQ-B-02 | **Cancellation policy mặc định**: Free cancellation trong bao nhiêu giờ trước check-in? (e.g., 48h)? Hay theo từng loại phòng / rate plan? | BR-B-06, FR-B-45 |
| OQ-B-03 | **Số tầng / kiến trúc**: Portal có cần trang "About" và "Amenities" đầy đủ cho SEO, hay chỉ cần trang search/booking? | FR-B-60-65 scope |
| OQ-B-04 | **Google Maps**: Có cần nhúng Google Maps (yêu cầu API key + billing) vào trang Contact không? Hay chỉ link ra Google Maps? | FR-B-62 |
| OQ-B-05 | **Phòng trẻ em**: Tuổi bao nhiêu thì tính là trẻ em? Trẻ em dưới X tuổi có miễn phí không? Ảnh hưởng đến pricing và capacity check. | FR-B-02, FR-B-30 |
| OQ-B-06 | **Email confirmation template**: Có logo, màu sắc brand riêng cho từng property không? Hay một mẫu chung? | FR-B-35 |
| OQ-B-07 ⚠️ | **Session timeout funnel**: Nếu khách để yên 30 phút giữa chừng funnel, booking lock có được release không? Cơ chế xử lý thế nào để tránh phantom booking? | BR-B-07, Architecture |
| OQ-B-08 | **Chia sẻ MXH**: Có cần Open Graph image cho mỗi loại phòng (hiển thị đẹp khi share Facebook/Zalo)? | NFR-B-06 |

---

## 9. Review Checklist

Trước khi sang Phase 3, confirm các điểm sau:

- [x] Booking funnel 4 bước đúng với quy trình mong muốn
- ** FR-B-33 Thanh toán khi check out **
- [x] Guest account (đăng ký / đăng nhập / không cần tài khoản) đúng
- [x] Promo code scope hợp lý cho v1
- [x] Out of Scope chấp nhận được (đặc biệt: không hỗ trợ nhiều phòng/booking, không có packages)
- [x] Cancellation policy mechanism rõ ràng
- [x] Các Open Questions được giải đáp (ít nhất OQ-B-01 và OQ-B-07 trước Phase 3)
- ** OQ-B-01 subdirectory **
- ** OQ-B-02 không **
- ** OQ-B-03 optional **
- ** OQ-B-04 link **
- ** OQ-B-05 config **
- ** OQ-B-06 từng property **
- ** OQ-B-07 release **
- ** OQ-B-08 có **

**Sau khi 3 PRDs đều confirm, gọi `/bmad-architecture` để bắt đầu Phase 3 — Solutioning.**
