# ROI & Business Case — Hotel Management System

> **Dành cho:** Chủ khách sạn · Giám đốc tài chính  
> **Mục đích:** Tính toán lợi ích tài chính cụ thể khi triển khai HMS

---

## Tóm Tắt Điều Hành

Triển khai HMS mang lại lợi ích tài chính từ **3 nguồn chính:**

| Nguồn lợi ích | Cơ chế | Ước tính hàng tháng* |
|---|---|---|
| Giảm phí OTA | Chuyển đặt phòng từ OTA sang portal riêng | 8–25 triệu VNĐ |
| Giảm chi phí nhân sự | Kiosk thay thế lễ tân giờ cao điểm | 5–15 triệu VNĐ |
| Tăng doanh thu | Upsell dịch vụ qua kiosk, promo code tối ưu | 2–10 triệu VNĐ |
| **Tổng lợi ích** | | **15–50 triệu VNĐ/tháng** |

*Ước tính cho khách sạn 50 phòng, công suất 70%, ADR 800.000 VNĐ*

---

## Mô Hình Tính ROI Chi Tiết

### Thông số đầu vào (điều chỉnh theo thực tế khách sạn)

| Thông số | Ví dụ 30 phòng | Ví dụ 60 phòng | Ví dụ 100 phòng |
|---|---|---|---|
| Số phòng | 30 | 60 | 100 |
| Công suất trung bình | 65% | 70% | 75% |
| ADR (giá phòng bình quân) | 600.000 VNĐ | 800.000 VNĐ | 1.200.000 VNĐ |
| Doanh thu phòng/tháng | ~351 triệu | ~1,008 triệu | ~2,700 triệu |
| Tỷ lệ OTA hiện tại | 60% | 50% | 40% |
| Hoa hồng OTA trung bình | 18% | 18% | 18% |

### Lợi ích 1: Giảm phí hoa hồng OTA

**Công thức:**
```
Tiết kiệm = Doanh thu phòng × Tỷ lệ OTA × Hoa hồng OTA × Tỷ lệ chuyển đổi sang portal
```

**Giả định:** 30% đặt phòng OTA chuyển sang portal riêng trong 6 tháng đầu

| Quy mô | Phí OTA/tháng hiện tại | Tiết kiệm/tháng (30% chuyển đổi) |
|---|---|---|
| 30 phòng | ~37,9 triệu | **~11,4 triệu** |
| 60 phòng | ~90,7 triệu | **~27,2 triệu** |
| 100 phòng | ~194,4 triệu | **~58,3 triệu** |

### Lợi ích 2: Giảm chi phí nhân sự lễ tân

Kiosk xử lý được 70–80% lượng check-in/check-out. Với khách sạn có 2 ca lễ tân mỗi ngày:

| Tình huống | Chi phí nhân sự/tháng | Tiết kiệm sau kiosk |
|---|---|---|
| Trước khi có kiosk (3 lễ tân) | 18–24 triệu | — |
| Sau khi có kiosk (2 lễ tân) | 12–16 triệu | **6–8 triệu/tháng** |

*Nhân viên không mất việc — được tái phân công vào các công việc tạo giá trị hơn (upsell, chăm sóc khách VIP)*

### Lợi ích 3: Giảm sai sót vận hành

Chi phí ẩn từ quản lý thủ công:
- Sai phòng do giao tiếp nhầm: trung bình 1–2 lần/tháng × 500.000 VNĐ/lần bồi thường
- Mất doanh thu từ phòng không được cập nhật kịp trạng thái: 1–3 phòng/tháng × 800.000 VNĐ
- Thời gian làm báo cáo thủ công: 8–16 giờ/tháng × lương nhân viên

**Ước tính tiết kiệm:** 2–5 triệu VNĐ/tháng

---

## Bảng Hoàn Vốn (Payback Period)

### Khách sạn 30 phòng — Gói Starter (35 triệu đầu tư)

| Tháng | Tiết kiệm tích lũy | Chi phí tích lũy | Lợi nhuận tích lũy |
|---|---|---|---|
| 1 | 13,4 triệu | 37 triệu | -23,6 triệu |
| 2 | 26,8 triệu | 39 triệu | -12,2 triệu |
| **3** | **40,2 triệu** | **41 triệu** | **-0,8 triệu** |
| 4 | 53,6 triệu | 43 triệu | +10,6 triệu |
| 6 | 80,4 triệu | 47 triệu | **+33,4 triệu** |
| 12 | 160,8 triệu | 59 triệu | **+101,8 triệu** |

*Tiết kiệm/tháng ước tính: 13,4 triệu (OTA 11,4 + nhân sự 2)*  
**→ Hoàn vốn trong ~3 tháng**

### Khách sạn 60 phòng — Gói Professional (65 triệu đầu tư)

| Tháng | Tiết kiệm tích lũy | Chi phí tích lũy | Lợi nhuận tích lũy |
|---|---|---|---|
| 1 | 34,2 triệu | 68,5 triệu | -34,3 triệu |
| 2 | 68,4 triệu | 72 triệu | -3,6 triệu |
| **3** | **102,6 triệu** | **75,5 triệu** | **+27,1 triệu** |
| 6 | 205,2 triệu | 86 triệu | **+119,2 triệu** |
| 12 | 410,4 triệu | 107 triệu | **+303,4 triệu** |

*Tiết kiệm/tháng ước tính: 34,2 triệu (OTA 27,2 + nhân sự 7)*  
**→ Hoàn vốn trong ~2 tháng**

---

## Lợi Ích Phi Tài Chính

| Lợi ích | Tác động |
|---|---|
| Trải nghiệm khách hàng tốt hơn | Check-in < 90 giây, không xếp hàng → review tốt trên Booking/Google |
| Nhân viên hài lòng hơn | Bớt việc thủ công nhàm chán → giảm turnover |
| Ra quyết định dựa trên dữ liệu | Báo cáo real-time thay vì cảm tính |
| Hình ảnh thương hiệu | Công nghệ kiosk tạo ấn tượng chuyên nghiệp với khách |
| Sẵn sàng mở rộng | Thêm cơ sở mới chỉ cần cấu hình, không cần mua thêm phần mềm |

---

## Case Study Tham Khảo

### Mô phỏng: Boutique Hotel 45 phòng tại Hội An

**Tình trạng trước:** Dùng Excel + Zalo, 70% booking qua Booking.com, 3 lễ tân làm ca

**Sau 6 tháng triển khai HMS:**
- Tỷ lệ OTA giảm từ 70% → 45% (portal riêng chiếm 25%)
- Check-in qua kiosk đạt 65% tổng lượng check-in
- Giảm từ 3 → 2 nhân viên lễ tân ca tối
- Doanh thu tăng 8% từ upsell dịch vụ qua portal và kiosk

**ROI thực tế:**
- Phí OTA tiết kiệm: ~18 triệu/tháng
- Nhân sự tiết kiệm: ~6 triệu/tháng
- **Hoàn vốn: tháng thứ 2**

---

## Tính ROI Cho Khách Sạn Của Bạn

Điền vào form dưới để nhận bảng tính ROI cá nhân hóa:

| Thông tin | Điền vào |
|---|---|
| Số phòng | ___ |
| Công suất trung bình (%) | ___ |
| Giá phòng bình quân/đêm (VNĐ) | ___ |
| Tỷ lệ đặt qua OTA hiện tại (%) | ___ |
| Số nhân viên lễ tân hiện tại | ___ |
| Lương bình quân nhân viên lễ tân (VNĐ) | ___ |

> Gửi thông tin về **hien.nguyen2@globee.hk** — nhận bảng ROI chi tiết trong 24 giờ.
