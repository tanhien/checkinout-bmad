# Kịch Bản Demo — Hotel Management System

> **Dành cho:** Đội ngũ Sales  
> **Thời lượng demo:** 30–45 phút  
> **Chuẩn bị:** Mở sẵn 3 tab: Staff web (localhost:3001), Booking portal (localhost:3000), Kiosk (localhost:5173)

---

## Trước khi demo

### Checklist chuẩn bị
- [ ] Chạy `docker compose up -d` để khởi động PostgreSQL
- [ ] Chạy `pnpm dev` để khởi động cả 3 app
- [ ] Đăng nhập Staff web với tài khoản Manager
- [ ] Có sẵn ít nhất 1 phòng trạng thái "Sạch" (CLEAN)
- [ ] Có sẵn 1 booking mẫu ở trạng thái CONFIRMED
- [ ] Tắt thông báo điện thoại, đặt màn hình ở chế độ "Không làm phiền"

### Thứ tự demo khuyến nghị
1. Booking Portal → Đặt phòng trực tuyến (5 phút)
2. Staff Web → Dashboard lễ tân (5 phút)
3. Kiosk → Check-in tự phục vụ (5 phút)
4. Staff Web → Housekeeping + Báo cáo (5 phút)
5. Q&A + chốt (10–15 phút)

---

## Phần 1 — Booking Portal (5 phút)

**Câu mở đầu:**
> "Hãy bắt đầu từ góc độ của khách hàng. Đây là trang đặt phòng trực tuyến riêng của khách sạn — không qua Booking.com, không mất phí hoa hồng 15–25%."

**Thao tác:**
1. Mở `localhost:3000/vi` — Chỉ vào trang chủ
   - *"Logo, tên khách sạn, và giao diện này đều tùy chỉnh theo thương hiệu của anh/chị."*

2. Nhập ngày check-in / check-out vào search widget → Click "Tìm phòng"
   - *"Hệ thống tự tính toán số đêm, hiển thị giá real-time, và chỉ hiện những phòng còn trống."*

3. Click vào 1 loại phòng → Xem trang chi tiết
   - *"Ảnh slideshow, tiện nghi đầy đủ, giá rõ ràng."*

4. Click "Đặt ngay" → Đi qua 4 bước
   - Bước 1: Nhập promo code nếu có
   - Bước 2: Thông tin khách
   - Bước 3: Xem lại → *"Khách xem lại đầy đủ trước khi xác nhận"*
   - Bước 4: Xác nhận → Chỉ QR code → *"QR này dùng để quét tại kiosk check-in, sẽ demo ngay sau"*

**Điểm nhấn:**
> "Khách đặt trực tiếp trên website của khách sạn — anh/chị nhận 100% doanh thu, không chia phần trăm cho ai."

---

## Phần 2 — Staff Web: Dashboard Lễ tân (5 phút)

**Câu chuyển tiếp:**
> "Ngay khi khách vừa đặt, nhân viên lễ tân thấy thông tin này ngay lập tức — không cần F5, không cần báo cáo buổi sáng."

**Thao tác:**
1. Mở `localhost:3001` — Đăng nhập
2. Chỉ Dashboard
   - Số khách đến hôm nay, đang ở, sắp trả
   - Ô cảnh báo / thông báo
   - *"Đây là màn hình lễ tân nhìn cả ngày. Real-time — không cần reload."*

3. Mở tab "Đặt phòng" → Tìm booking vừa tạo
   - Click vào → Xem chi tiết
   - *"Toàn bộ thông tin: khách, phòng, giá, ghi chú đặc biệt, lịch sử thay đổi."*

4. Click "Check-in thay" (nếu khách không dùng kiosk)
   - *"Nhân viên vẫn có thể check-in thủ công khi khách cần hỗ trợ."*

5. Mở tab "Phòng" → Grid phòng theo tầng
   - *"Màu xanh = sạch sẵn sàng. Xanh dương = có khách. Vàng = đang dọn. Đỏ = bảo trì."*
   - *"Click vào phòng bất kỳ để xem chi tiết và lịch sử."*

**Điểm nhấn:**
> "Một màn hình, một cái nhìn — nhân viên biết ngay toàn bộ tình hình khách sạn."

---

## Phần 3 — Kiosk: Check-in Tự Phục Vụ (5 phút)

**Câu chuyển tiếp:**
> "Bây giờ tôi sẽ đóng vai khách. Khách cầm điện thoại có QR code đến kiosk — và tự làm thủ tục trong vòng 90 giây."

**Thao tác:**
1. Mở `localhost:5173` — Chỉ giao diện kiosk
   - *"Giao diện fullscreen, chữ lớn, thiết kế cho tablet. Chạy được cả trên Android lẫn Windows."*

2. Click "Check-in"

3. **Tab QR:** Hướng camera vào QR code từ trang xác nhận
   - *"Hoặc khách có thể nhập mã thủ công"*

4. Màn hình xác nhận booking hiện ra
   - *"Khách xem thông tin đặt phòng, xác nhận đúng."*

5. Nhập tên → Click xác nhận
   - *"Bước xác thực tên để đảm bảo đúng người nhận phòng."*

6. Màn hình thành công: số phòng, WiFi password
   - *"Trong vòng 90 giây — không xếp hàng, không cần nhân viên."*

7. **Demo gọi nhân viên:** Quay về màn hình chờ → Click "Gọi nhân viên"
   - Chuyển sang tab Staff web → Chỉ popup cảnh báo + âm thanh
   - *"Nhân viên biết ngay có khách cần hỗ trợ, kèm tên kiosk."*

**Điểm nhấn:**
> "Giờ cao điểm 10 phòng check-in cùng lúc — 9 người dùng kiosk, 1 người cần hỗ trợ nhân viên. Thay vì cần 3 lễ tân, giờ chỉ cần 1."

---

## Phần 4 — Housekeeping & Báo cáo (5 phút)

**Housekeeping:**
1. Mở tab "Buồng phòng" → Kanban board
   - *"Sau khi khách check-out, phòng tự động chuyển sang cột 'Cần dọn'."*
   - Kéo thả 1 phòng từ "Cần dọn" → "Đang dọn"
   - *"Nhân viên buồng phòng dùng điện thoại/tablet, cập nhật tức thì — quản lý thấy ngay."*

2. Phân công nhân viên cho phòng
   - *"Biết ai đang dọn phòng nào, quản lý không cần đi kiểm tra thủ công."*

**Báo cáo:**
1. Mở tab "Báo cáo"
   - Chỉ Occupancy chart
   - Chỉ Revenue report
   - *"Báo cáo theo ngày, tuần, tháng. Xuất CSV để gửi cho kế toán."*
   - *"RevPAR, ADR — các chỉ số chuẩn ngành khách sạn quốc tế."*

**Điểm nhấn:**
> "Quản lý ngồi ở nhà cũng biết khách sạn đang hoạt động thế nào, real-time."

---

## Phần 5 — Q&A & Chốt (10–15 phút)

### Các câu hỏi thường gặp và cách trả lời

**"Chi phí bao nhiêu?"**
> "Chi phí triển khai một lần, không có phí license hàng tháng. Tùy quy mô khách sạn và gói dịch vụ, tôi sẽ gửi báo giá cụ thể sau buổi này. Thông thường hoàn vốn trong 3–6 tháng chỉ tính riêng phần tiết kiệm từ hoa hồng OTA."

**"Tích hợp với Booking.com / Agoda được không?"**
> "Hệ thống có API mở, sẵn sàng tích hợp channel manager. Roadmap Q3 2026 có tích hợp SiteMinder. Trước mắt, hệ thống giúp anh/chị giảm phụ thuộc vào OTA bằng kênh trực tiếp."

**"Payment gateway nào?"**
> "Tích hợp theo yêu cầu: VNPay, MoMo, ZaloPay, Stripe, hay bất kỳ gateway nào anh/chị đang dùng. Hiện tại demo mode — chuyển sang thực tế trong 1–2 ngày."

**"Kiosk cần mua phần cứng gì?"**
> "Android tablet 10 inch trở lên (khoảng 3–5 triệu) hoặc Windows PC kiosk. Chúng tôi hỗ trợ lắp đặt và cấu hình. Không cần phần cứng chuyên dụng đắt tiền."

**"Dữ liệu lưu ở đâu?"**
> "Server của anh/chị — hoàn toàn sở hữu dữ liệu. Có thể triển khai trên cloud Việt Nam (VNG, VNPT), AWS, hoặc server riêng."

---

## Kịch bản chốt deal

**Nếu khách quan tâm nhưng chưa quyết:**
> "Tôi đề xuất chúng ta làm một pilot 1 tháng — triển khai thực tế tại khách sạn anh/chị với dữ liệu thật, team anh/chị dùng thử. Chi phí pilot [thảo luận]. Nếu không hài lòng, chúng tôi hoàn lại."

**Nếu khách lo về chi phí:**
> "Hãy tính thử: nếu khách sạn có 30 phòng, trung bình 70% công suất, ADR 800k, và hiện đang dùng 40% OTA — mỗi tháng trả khoảng 17 triệu phí OTA. Giảm xuống 25% OTA nhờ portal riêng tiết kiệm 8–9 triệu/tháng. Phí triển khai hoàn vốn trong 2 tháng."

**Nếu khách lo về kỹ thuật:**
> "Chúng tôi lo toàn bộ phần kỹ thuật. Team anh/chị chỉ cần 2 giờ training là dùng được. Chúng tôi hỗ trợ 24/7 trong 3 tháng đầu."
