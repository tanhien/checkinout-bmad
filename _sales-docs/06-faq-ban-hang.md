# FAQ Bán Hàng — Hotel Management System

> **Dành cho:** Đội ngũ Sales — xử lý phản đối và câu hỏi thường gặp  
> **Cách dùng:** Ghi nhớ các câu trả lời cốt lõi, không cần đọc verbatim

---

## Nhóm 1 — Chi Phí & Giá Cả

**Q: Chi phí bao nhiêu? Có phí hàng tháng không?**

> Phí triển khai một lần từ 35–65 triệu tùy quy mô, cộng phí hỗ trợ 2–3,5 triệu/tháng (không phải license). Không có phí ẩn, không phụ thuộc vendor. So với Cloudbeds hay Opera tốn $200–$500/tháng (tương đương 5–12 triệu) vô thời hạn, HMS tiết kiệm đáng kể về dài hạn. Thông thường hoàn vốn trong 2–4 tháng.

**Q: Sao không dùng miễn phí luôn?**

> Phí hỗ trợ hàng tháng đảm bảo chúng tôi luôn sẵn sàng khi anh/chị cần: cập nhật bảo mật, hỗ trợ sự cố, tư vấn vận hành. Nhiều khách sạn đã biết chi phí "miễn phí" thực ra là họ tự xử lý khi gặp lỗi — rất tốn kém theo cách khác.

**Q: Có gói dùng thử không?**

> Có. Chúng tôi cung cấp demo trực tiếp miễn phí với dữ liệu thực của khách sạn anh/chị. Với khách hàng nghiêm túc, có thể thảo luận về gói pilot 1 tháng.

---

## Nhóm 2 — Tính Năng & Khả Năng

**Q: Có tích hợp Booking.com / Agoda / Airbnb không?**

> Hệ thống có API mở, sẵn sàng kết nối channel manager (như SiteMinder, Cloudbeds CM). Tính năng này trong roadmap Q3 2026. Trước mắt, hệ thống giúp anh/chị xây dựng kênh đặt phòng trực tiếp để giảm dần phụ thuộc OTA — mỗi % chuyển đổi sang portal riêng tiết kiệm 18% hoa hồng.

**Q: Payment gateway nào được hỗ trợ?**

> Hệ thống được thiết kế theo kiến trúc "payment adapter" — có thể tích hợp bất kỳ gateway nào trong 1–2 ngày: VNPay, MoMo, ZaloPay, Stripe, PayOS. Hiện tại trong môi trường demo là mode mô phỏng. Chi phí tích hợp gateway mới: 5 triệu VNĐ.

**Q: Có quản lý nhiều cơ sở khách sạn cùng lúc không?**

> Có — multi-property được hỗ trợ trong kiến trúc cơ bản. Mỗi property có dữ liệu, nhân viên, cấu hình riêng. Một tài khoản admin có thể quản lý tất cả. Phù hợp cho chuỗi khách sạn.

**Q: Có module quản lý nhà hàng / spa không?**

> Hiện tại HMS tập trung vào core PMS (phòng, booking, folio, housekeeping). Phí dịch vụ phụ (minibar, spa, giặt ủi) có thể thêm thủ công vào folio. Tích hợp hệ thống F&B riêng là tính năng có thể phát triển theo yêu cầu.

**Q: Kiosk có đọc được CMND / hộ chiếu không?**

> Hiện tại kiosk xác thực bằng tên — đơn giản và đủ an toàn cho đa số khách sạn. Tính năng scan CMND/OCR là tính năng có thể phát triển theo yêu cầu, phù hợp với resort cao cấp cần kiểm tra danh tính nghiêm ngặt.

**Q: Có app mobile cho nhân viên không?**

> Staff web được tối ưu hoàn toàn cho mobile — nhân viên buồng phòng dùng điện thoại trực tiếp không cần cài app. Tất cả tính năng hoạt động trên trình duyệt Chrome/Safari của điện thoại.

---

## Nhóm 3 — Kỹ Thuật & Triển Khai

**Q: Dữ liệu lưu ở đâu? Có an toàn không?**

> Dữ liệu lưu trên server của chính khách sạn — hoàn toàn sở hữu, không phụ thuộc bên thứ ba. Có thể đặt trên cloud Việt Nam (VNG, VNPT), AWS region Singapore, hoặc server riêng tại chỗ. Dữ liệu nhạy cảm (CMND) được mã hóa AES-256.

**Q: Nếu mất điện / mất mạng thì sao?**

> Staff web và booking portal cần kết nối internet. Kiosk có thể cấu hình để hoạt động với kết nối nội bộ (LAN). Chúng tôi tư vấn về UPS và backup internet cho môi trường kiosk quan trọng.

**Q: Triển khai mất bao lâu? Có phức tạp không?**

> Thông thường 2–4 tuần:
> - Tuần 1: Cấu hình hệ thống, nhập dữ liệu phòng, rate plan
> - Tuần 2: Training nhân viên, test với dữ liệu thật
> - Tuần 3–4: Go-live có hỗ trợ kỹ thuật song song
> 
> Team khách sạn không cần biết kỹ thuật — chúng tôi lo toàn bộ phần server và cấu hình.

**Q: Có thể import dữ liệu từ hệ thống cũ không?**

> Có — chúng tôi hỗ trợ migration dữ liệu từ Excel (CSV), Cloudbeds, hoặc bất kỳ hệ thống nào xuất được file. Chi phí migration phụ thuộc vào khối lượng dữ liệu. Lịch sử booking, profile khách, thông tin phòng đều migrate được.

**Q: Kiosk cần phần cứng gì? Mua ở đâu?**

> - Android tablet 10–13 inch (Samsung, Lenovo) — giá 3–7 triệu
> - Hoặc Windows PC mini + màn hình cảm ứng — giá 5–12 triệu
> - Giá đỡ kiosk: 1–3 triệu (mua tại các shop thiết bị POS)
> 
> Chúng tôi hỗ trợ tư vấn mua phần cứng phù hợp ngân sách và không gian thực tế.

**Q: Có thể tự cập nhật nâng cấp không?**

> Với gói hỗ trợ hàng tháng, chúng tôi triển khai các bản cập nhật tự động. Khách hàng Enterprise có môi trường staging để test trước khi deploy production.

---

## Nhóm 4 — Rủi Ro & Cam Kết

**Q: Nếu công ty các bạn đóng cửa thì sao?**

> Đây là câu hỏi hợp lý. Khác với SaaS thông thường, anh/chị sở hữu toàn bộ source code và dữ liệu sau khi triển khai. Hệ thống vẫn chạy độc lập ngay cả khi chúng tôi không còn hỗ trợ. Anh/chị có thể thuê developer bất kỳ để duy trì vì đây là công nghệ phổ biến (Next.js, PostgreSQL).

**Q: Hỗ trợ như thế nào khi gặp sự cố?**

> - **Gói Starter:** Email + Zalo, phản hồi trong ngày làm việc
> - **Gói Professional:** Hotline + Zalo, phản hồi trong 4 giờ trong giờ hành chính
> - **Gói Enterprise:** 24/7, cam kết SLA 1 giờ phản hồi
> 
> 3 tháng đầu sau go-live: hỗ trợ ưu tiên miễn phí cho tất cả gói.

**Q: Đã có khách sạn nào dùng chưa?**

> Hệ thống đang trong giai đoạn triển khai tại một số khách sạn đầu tiên (early adopters). Đây là cơ hội để anh/chị vừa được giá tốt nhất, vừa được tham gia định hình tính năng theo nhu cầu thực tế. Các early adopters được hỗ trợ ưu tiên và ảnh hưởng trực tiếp đến lộ trình phát triển sản phẩm.

**Q: Chúng tôi đang dùng hệ thống X rồi, tại sao phải đổi?**

> Không cần đổi ngay — chúng tôi có thể tích hợp song song. Cụ thể:
> - Booking portal: chạy độc lập, không ảnh hưởng hệ thống cũ
> - Kiosk: có thể tích hợp với PMS hiện tại qua API
> - Chuyển đổi toàn bộ: lên kế hoạch 3–6 tháng để đảm bảo không gián đoạn vận hành

---

## Nhóm 5 — Cạnh Tranh

**Q: So với Cloudbeds / Opera thì thế nào?**

> Cloudbeds và Opera là sản phẩm tốt nhưng:
> - Chi phí cao ($200–$800/tháng, vô thời hạn)
> - Kiosk tự phục vụ là addon riêng, đắt tiền
> - Hỗ trợ tiếng Việt và thực tế địa phương hạn chế
> - Không có portal đặt phòng tích hợp sẵn
> - Tùy biến theo yêu cầu rất khó
> 
> HMS được xây dựng đặc biệt cho khách sạn Việt Nam — giá hợp lý, tích hợp sẵn kiosk + portal, hỗ trợ địa phương.

**Q: So với phần mềm PMS Việt Nam (CiHMS, eZCloud...)?**

> Phần mềm PMS nội địa có giá tốt hơn phần mềm ngoại nhưng thường:
> - Không có kiosk tự phục vụ
> - Không có booking portal tích hợp
> - Giao diện lỗi thời, khó dùng trên mobile
> - Real-time hạn chế
> 
> HMS cung cấp bộ ba: kiosk + staff web + booking portal trong một hệ thống, với công nghệ hiện đại nhất.
