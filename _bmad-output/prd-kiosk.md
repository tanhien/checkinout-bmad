# PRD — Kiosk App (Guest Self-Service)

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 2 — Planning  
**Status:** DRAFT — awaiting user confirmation  
**Thuộc về:** Hotel Management System

---

## 1. Overview

Kiosk App là giao diện màn hình cảm ứng tự phục vụ đặt tại sảnh khách sạn, cho phép khách **tự hoàn toàn thủ tục check-in, check-out, và đặt phòng ngay tại chỗ** mà không cần đến quầy lễ tân. Hệ thống chạy trên **Android tablet** và **Windows PC** thông qua Electron app hoặc PWA ở chế độ kiosk (fullscreen, không truy cập được hệ điều hành).

**Mục tiêu chính:**
- Giảm tải quầy lễ tân giờ cao điểm
- Phục vụ khách walk-in (chưa đặt trước) có thể tự book và check-in
- Tạo trải nghiệm hiện đại, nhanh chóng cho khách

---

## 2. Users & Roles

### Khách có booking trước (Pre-booked Guest)
Khách đã đặt phòng qua online portal, phone, hoặc OTA. Đến kiosk với mã xác nhận hoặc QR code.  
**Mục tiêu:** Hoàn thành check-in trong < 3 phút, không cần tương tác với nhân viên.

### Khách walk-in (Walk-in Guest)
Khách đến trực tiếp khách sạn mà không đặt trước. Muốn tìm phòng và đặt ngay tại kiosk.  
**Mục tiêu:** Tìm phòng trống, đặt phòng, và check-in trong một luồng liền mạch.

### Khách đang ở (In-stay Guest)
Khách đang lưu trú, đến kiosk để trả phòng hoặc yêu cầu dịch vụ.  
**Mục tiêu:** Check-out nhanh, không cần xếp hàng; thanh toán và nhận receipt.

> **Lưu ý:** Kiosk không có user accounts hay đăng nhập. Mỗi session là độc lập, dữ liệu session xóa khi kết thúc.

---

## 3. Functional Requirements

### 3.1 Màn hình Chờ & Khởi đầu (Idle & Home)

**FR-K-01** Hệ thống hiển thị màn hình chờ (idle screen) với logo/ảnh khách sạn khi không có tương tác trong 5 phút.

**FR-K-02** Màn hình home sau khi chạm vào hiển thị 3 lựa chọn rõ ràng:
- "Tôi đã đặt phòng — Check-in" 
- "Đặt phòng ngay — Walk-in"
- "Trả phòng — Check-out"

**FR-K-03** Nút chọn ngôn ngữ (Tiếng Việt / English) luôn hiển thị ở góc màn hình, có thể thay đổi bất kỳ lúc nào trong session.

**FR-K-04** Nút "Gọi nhân viên hỗ trợ" luôn hiển thị ở góc màn hình trong suốt mọi bước (có thể là nút vật lý hoặc phím tắt trên màn hình).

**FR-K-05** Hệ thống tự động reset về màn hình Home nếu không có tương tác trong 3 phút (trong khi đang ở giữa luồng), với countdown warning 30 giây trước khi reset.

---

### 3.2 Luồng A — Check-in (Khách có booking trước)

**FR-K-10** Khách nhập mã xác nhận booking (confirmation number) bằng bàn phím số/chữ trên màn hình.

**FR-K-11** Hệ thống hiển thị màn hình quét QR code như một lựa chọn thay thế cho nhập mã thủ công (yêu cầu camera/QR reader).

**FR-K-12** Sau khi nhập mã, hệ thống tìm booking và hiển thị thông tin để khách xác nhận:
- Tên khách chính
- Ngày check-in / check-out
- Loại phòng đã đặt
- Số người lớn / trẻ em

**FR-K-13** Khách xác minh danh tính bằng cách xác nhận họ tên đầy đủ (match với tên trong booking). Nếu không khớp, hiển thị hướng dẫn liên hệ lễ tân.

**FR-K-14** Nếu booking hợp lệ và trong cửa sổ check-in được phép:
- Hệ thống assign phòng đã sẵn sàng (trạng thái "clean") theo đúng loại phòng đã đặt
- Nếu không có phòng clean ngay, thông báo và hướng dẫn khách đến quầy lễ tân

**FR-K-15** Màn hình xác nhận check-in hiển thị:
- Số phòng được assign
- Tầng
- Hướng dẫn lấy key card (đến quầy lễ tân / khu vực key card)
- WiFi password của khách sạn
- Giờ ăn sáng / checkout thông tin

**FR-K-16** Hệ thống gửi email xác nhận check-in đến địa chỉ email trong hồ sơ khách (nếu có).

**FR-K-17** Hệ thống cập nhật trạng thái booking thành `checked_in` và ghi nhận thời gian check-in thực tế.

**FR-K-18** Check-in chỉ được phép thực hiện:
- Từ 00:00 ngày check-in (hoặc theo cấu hình `checkin_earliest_hour` của property)
- Đến 23:59 ngày check-in (nếu check-in muộn, cần nhân viên xử lý)

---

### 3.3 Luồng B — Walk-in Booking & Check-in

**FR-K-20** Màn hình tìm kiếm walk-in hiển thị:
- Date picker ngày check-in (mặc định: hôm nay) và check-out (mặc định: ngày mai)
- Số lượng khách (người lớn, trẻ em)
- Nút "Tìm phòng trống"

**FR-K-21** Hệ thống hiển thị danh sách loại phòng còn trống cho khoảng ngày đã chọn, mỗi loại gồm:
- Ảnh đại diện phòng
- Tên loại phòng và mô tả ngắn
- Tiện nghi chính (icon)
- Giá mỗi đêm và tổng giá cho số đêm đã chọn

**FR-K-22** Khách chọn loại phòng và tiếp tục nhập thông tin cá nhân:
- Họ và tên đầy đủ (bắt buộc)
- Số CCCD/Passport (bắt buộc)
- Số điện thoại (bắt buộc)
- Email (tùy chọn, để nhận xác nhận)

**FR-K-23** Màn hình tóm tắt booking hiển thị toàn bộ thông tin trước khi thanh toán:
- Loại phòng, ngày, số đêm
- Thông tin khách
- Tổng tiền phải trả
- Nút "Xác nhận và Thanh toán"

**FR-K-24** Màn hình demo payment hiển thị:
- Số tiền cần thanh toán
- Nút giả lập thành công: "Thanh toán thành công"
- Nút giả lập thất bại: "Thử lại" (để test)

**FR-K-25** Sau khi "thanh toán" thành công:
- Hệ thống tạo booking mới với trạng thái `confirmed`
- Tự động chuyển sang luồng Check-in (FR-K-14 → FR-K-17)
- Gửi email xác nhận booking + check-in đến email khách (nếu có)

**FR-K-26** Walk-in booking chỉ cho phép check-in date là **hôm nay** hoặc **tối đa 7 ngày tới** (configurable per property). Booking xa hơn phải dùng Online Booking Portal.

---

### 3.4 Luồng C — Check-out

**FR-K-30** Khách xác định danh tính bằng một trong hai cách:
- Nhập số phòng + họ tên
- Nhập mã xác nhận booking

**FR-K-31** Hệ thống hiển thị folio (bảng kê tất cả phí) bao gồm:
- Phí phòng (theo số đêm × giá/đêm)
- Phí dịch vụ phát sinh (minibar, laundry, spa... do staff nhập vào)
- Thuế và phí dịch vụ
- Tổng cộng

**FR-K-32** Khách có thể cuộn xem toàn bộ danh sách phí. Nếu có phí bất thường, hiển thị nút "Liên hệ lễ tân để làm rõ".

**FR-K-33** Khách xác nhận folio và tiến hành thanh toán qua màn hình demo payment (tương tự FR-K-24).

**FR-K-34** Sau thanh toán thành công:
- Hệ thống cập nhật booking thành `checked_out`
- Cập nhật trạng thái phòng thành `dirty` (trigger housekeeping task)
- Ghi nhận thời gian check-out thực tế và số tiền đã thu

**FR-K-35** Màn hình xác nhận check-out hiển thị lời cảm ơn và:
- Nút "In biên lai" (chỉ khi thiết bị có kết nối printer)
- Nút "Gửi biên lai qua email" (nhập email nếu chưa có)
- Hẹn gặp lại

**FR-K-36** In biên lai: kết nối với máy in nhiệt (thermal printer) qua USB/Bluetooth. Chỉ hỗ trợ in trên Windows PC. Android tablet chỉ hỗ trợ gửi email.

---

### 3.5 Trạng thái Lỗi & Edge Cases

**FR-K-40** Nếu không tìm thấy booking theo mã đã nhập: hiển thị thông báo rõ ràng và gợi ý kiểm tra lại mã hoặc liên hệ lễ tân.

**FR-K-41** Nếu booking đã được check-in trước đó (duplicate attempt): hiển thị thông tin phòng đã được assign và hướng dẫn liên hệ lễ tân nếu cần thêm key card.

**FR-K-42** Nếu booking chưa đến ngày check-in: hiển thị ngày check-in dự kiến và không cho phép check-in sớm (hoặc hướng dẫn liên hệ lễ tân nếu property cho phép early check-in).

**FR-K-43** Nếu booking đã qua ngày check-in mà chưa check-in (no-show window): hiển thị hướng dẫn liên hệ lễ tân.

**FR-K-44** Nếu mất kết nối internet trong quá trình thực hiện: hiển thị thông báo lỗi thân thiện, không crash app. Giữ nguyên màn hình hiện tại để khách không mất tiến trình.

**FR-K-45** Nếu không có phòng clean nào available cho loại phòng đã đặt: thông báo và hướng dẫn đến quầy lễ tân. Không assign phòng đang dirty hoặc occupied.

---

## 4. User Stories

| ID | Role | Story | Acceptance Criteria tóm tắt |
|---|---|---|---|
| US-K-01 | Khách có booking | Tôi muốn nhập mã đặt phòng để xem thông tin và check-in nhanh | Nhập mã → hiển thị đúng thông tin booking → xác nhận tên → nhận số phòng |
| US-K-02 | Khách có booking | Tôi muốn quét QR code thay vì gõ mã dài | Camera/QR reader nhận QR → tự động fill mã → tiếp tục luồng check-in |
| US-K-03 | Khách walk-in | Tôi muốn xem phòng trống hôm nay và đặt ngay trên kiosk | Chọn ngày → xem danh sách phòng → điền thông tin → thanh toán → nhận phòng |
| US-K-04 | Khách đang ở | Tôi muốn trả phòng và xem tất cả các khoản phí trước khi thanh toán | Nhập phòng/mã → xem folio → xác nhận → thanh toán demo → nhận biên lai |
| US-K-05 | Khách đang ở | Tôi muốn nhận biên lai qua email để lưu cho mục đích công tác | Sau checkout → nhập email → hệ thống gửi PDF/text bill |
| US-K-06 | Bất kỳ khách | Tôi muốn dùng tiếng Anh nếu không đọc được tiếng Việt | Nút EN/VI luôn visible → switch ngôn ngữ ngay lập tức toàn bộ UI |
| US-K-07 | Bất kỳ khách | Tôi muốn gọi nhân viên nếu gặp khó khăn | Nút "Gọi hỗ trợ" luôn visible → trigger cảnh báo tại quầy lễ tân |
| US-K-08 | Bất kỳ khách | Tôi muốn bỏ giữa chừng mà không làm ảnh hưởng booking | Cancel bất kỳ lúc nào → confirm dialog → reset về Home, không lưu dữ liệu session |

---

## 5. Business Rules

**BR-K-01 Cửa sổ check-in:** Check-in chỉ cho phép từ `checkin_earliest_hour` (mặc định 14:00) đến 23:59 ngày check-in. Ngoài cửa sổ này, kiosk hiển thị hướng dẫn liên hệ lễ tân.

**BR-K-02 Xác minh danh tính tối thiểu:** Khách phải gõ đúng họ tên (case-insensitive, bỏ dấu chấp nhận) khớp với tên trong booking. Không yêu cầu CCCD/Passport cho khách có booking trước.

**BR-K-03 Phòng assign:** Kiosk chỉ assign phòng có trạng thái `clean`. Nếu không có phòng clean của đúng loại, không assign và chuyển sang lễ tân. Không assign phòng đang `occupied`, `dirty`, hoặc `maintenance`.

**BR-K-04 Walk-in payment:** Thanh toán toàn bộ tiền phòng tại thời điểm booking (prepay). Không hỗ trợ pay-at-checkout cho walk-in qua kiosk.

**BR-K-05 Check-out folio:** Khách chỉ có thể xem folio, không thể tự thêm/xóa/sửa bất kỳ khoản phí nào trên kiosk. Mọi tranh chấp phí phải giải quyết tại quầy lễ tân.

**BR-K-06 Một session một booking:** Mỗi session kiosk chỉ xử lý một booking. Không hỗ trợ check-in nhiều booking cùng lúc (gia đình đặt nhiều phòng phải làm từng cái hoặc đến lễ tân).

**BR-K-07 Session isolation:** Khi session kết thúc (hoàn thành, cancel, hoặc timeout), toàn bộ thông tin nhập của khách bị xóa khỏi memory và màn hình. Không lưu cache cục bộ.

**BR-K-08 Duplicate check-in:** Nếu booking đã ở trạng thái `checked_in`, kiosk chỉ hiển thị thông tin phòng (read-only), không cho phép check-in lại hay thay đổi.

**BR-K-09 Walk-in ngày tối đa:** Walk-in booking tối đa `walkin_max_advance_days` ngày trước (mặc định 7 ngày, configurable).

---

## 6. Non-Functional Requirements

### Hiệu năng
- **NFR-K-01** Mỗi màn hình load < 2 giây sau tương tác (trên kết nối WiFi ổn định trong khách sạn).
- **NFR-K-02** API lookup booking phản hồi < 1 giây trong điều kiện bình thường.
- **NFR-K-03** Luồng check-in hoàn chỉnh (từ nhập mã đến màn hình xác nhận) < 3 phút.

### Giao diện & Trải nghiệm
- **NFR-K-04** Font size tối thiểu 18px cho text nội dung, 24px cho tiêu đề — đọc được ở khoảng cách 60cm.
- **NFR-K-05** Tất cả button/touch target tối thiểu 44×44px.
- **NFR-K-06** Contrast ratio tối thiểu 4.5:1 (WCAG AA) cho mọi text trên nền.
- **NFR-K-07** Không dùng gesture phức tạp (pinch, multi-touch). Mọi thao tác chỉ cần tap đơn giản.
- **NFR-K-08** Hiển thị đúng trên màn hình từ 10 inch (tablet) đến 27 inch (PC kiosk) theo chiều dọc (portrait) là chính, hỗ trợ landscape khi cần.

### Kiosk Mode & Bảo mật
- **NFR-K-09** App chạy fullscreen, không có thanh địa chỉ, không có cách thoát ra browser/OS từ giao diện người dùng.
- **NFR-K-10** Không lưu bất kỳ thông tin cá nhân khách nào trong localStorage/cookies của thiết bị.
- **NFR-K-11** Tất cả API calls phải dùng HTTPS.
- **NFR-K-12** Kiosk app chỉ gọi đến backend API của hệ thống, không có API calls third-party trực tiếp từ client.

### Đa ngôn ngữ
- **NFR-K-13** Hỗ trợ Tiếng Việt và Tiếng Anh. Tất cả text trong UI phải có bản dịch cho cả hai ngôn ngữ.
- **NFR-K-14** Switch ngôn ngữ tức thời không cần reload trang.

### Khả năng dùng offline
- **NFR-K-15** Kiosk **không** hỗ trợ offline mode. Khi mất kết nối, hiển thị thông báo lỗi rõ ràng bằng cả hai ngôn ngữ và hướng dẫn đến quầy lễ tân.

---

## 7. Out of Scope (Kiosk v1)

- **Tích hợp key card encoder vật lý** — kiosk chỉ hiển thị số phòng và hướng dẫn lấy thẻ tại lễ tân hoặc khu vực key card tự phục vụ riêng.
- **Scan CCCD/Passport tự động** — nhập thủ công; scanner phần cứng là phase sau.
- **Thanh toán bằng tiền mặt** — kiosk chỉ hỗ trợ demo payment; tiền mặt xử lý tại quầy.
- **Yêu cầu dịch vụ trong kỳ lưu trú** (room service, spa booking...) — v2.
- **Gia hạn lưu trú qua kiosk** — v2.
- **Đặt phòng nhiều phòng cùng lúc** — mỗi kiosk session xử lý 1 booking.
- **Loyalty program / điểm thưởng** — v2.
- **In biên lai trên Android tablet** — chỉ hỗ trợ gửi email; in chỉ trên Windows PC.
- **Hỗ trợ phím tắt / keyboard navigation** — touch-only interface.

---

## 8. Open Questions

> Các câu hỏi dưới đây cần được giải đáp trước khi bắt đầu Phase 3 (Solutioning). Các câu hỏi ảnh hưởng đến architecture được đánh dấu ⚠️.

| ID | Câu hỏi | Ảnh hưởng đến |
|---|---|---|
| OQ-K-01 | Kiosk có trang bị **QR code scanner/camera** không? Nếu không, luồng QR (FR-K-11) có thể bỏ qua. | FR-K-11, Epic 3 story scope |
| OQ-K-02 | **Cửa sổ check-in** mặc định là mấy giờ? (14:00 hay sớm hơn?) Có property nào muốn cho check-in từ sáng sớm? | BR-K-01, config schema |
| OQ-K-03 | **Walk-in booking** có cho phép đặt **ngày trong tương lai** (> hôm nay) không, hay chỉ same-day? Nếu có, tối đa bao nhiêu ngày? | FR-K-26, BR-K-09 |
| OQ-K-04 ⚠️ | **Nhiều kiosk đồng thời**: nếu khách sạn có 2-3 kiosk và 2 khách check-in cùng booking lúc cùng thời điểm (edge case), hệ thống xử lý thế nào? (Optimistic locking? Queue?) | Architecture — DB locking strategy |
| OQ-K-05 ⚠️ | **Android deployment**: App chạy theo cơ chế nào trên Android? Option A: Android Kiosk Mode (Device Owner). Option B: Custom Kiosk Browser APK (e.g., Fully Kiosk). Ảnh hưởng đến build process. | Epic 1 — kiosk app setup |
| OQ-K-06 | **Máy in receipt**: Khách sạn dùng loại máy in gì? (Brand, kết nối USB hay Bluetooth?) Để tích hợp đúng driver. | FR-K-36, Epic 4 |
| OQ-K-07 | **"Gọi nhân viên hỗ trợ"**: Trigger thông báo thế nào? Âm thanh tại quầy lễ tân? Push notification trên điện thoại nhân viên? Hiển thị trên dashboard staff? | FR-K-04, Staff web integration |
| OQ-K-08 | **Xác minh danh tính walk-in**: Yêu cầu nhập số CCCD/Passport (FR-K-22) có bắt buộc hay optional? Có validate format không (9/12 số cho CCCD VN)? | FR-K-22, data validation |
| OQ-K-09 | **Idle screen**: Có cần hiển thị slideshow ảnh khách sạn / promotional content khi idle không? Hay chỉ logo đơn giản? | FR-K-01, UI scope |

---

## 9. Review Checklist

Trước khi sang Phase 3, confirm các điểm sau:

- [x] Luồng A (Check-in có booking) đầy đủ và đúng
- [x] Luồng B (Walk-in booking) đầy đủ và đúng
- [x] Luồng C (Check-out) đầy đủ và đúng
- [x] Business Rules hợp lý với vận hành thực tế khách sạn
- [x] Out of Scope chấp nhận được cho v1
- [x] Các Open Questions được giải đáp (ít nhất OQ-K-04, OQ-K-05 bắt buộc trước Phase 3)
- ** OQ-K-01 : hổ trợ cả 2 trường hợp có và không **
- ** OQ-K-02 : mặc định 14h và cho phép cấu hình **
- ** OQ-K-03 : không **
- ** OQ-K-04 : Queue **
- ** OQ-K-05 : Chạy trên web để không cần cài đặt **
- ** OQ-K-06 : Kết nối USB hoặc IP **
- ** OQ-K-07 : Âm thanh tại quầy lễ tân và Hiển thị trên dashboard staff **
- ** OQ-K-08 : optional **
- ** OQ-K-09 : optional **

**Sau khi confirm, gọi `/bmad-prd staff` để tạo PRD cho Staff Management.**
