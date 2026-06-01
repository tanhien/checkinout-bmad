import { PrismaClient, StaffRole, PropertyType, BedType, ServiceCategory, TaxAppliesTo, DiscountType } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Property ───────────────────────────────────────────────────────────────
  const property = await db.property.upsert({
    where: { kioskApiKey: "demo-kiosk-api-key-seed" },
    update: {
      name: "Lạc Hồng Boutique Hotel & Spa",
      type: PropertyType.BOUTIQUE,
      address: "48 Trần Hưng Đạo, Phường Minh An, Hội An, Quảng Nam, Việt Nam",
      phone: "+84 235 391 8888",
      email: "info@lachonghotel.vn",
      tagline: "Nơi truyền thống gặp gỡ sang trọng hiện đại",
      description:
        "Tọa lạc tại trung tâm phố cổ Hội An — Di sản Thế giới UNESCO — Lạc Hồng Boutique Hotel & Spa là sự hòa quyện tinh tế giữa kiến trúc nhà cổ Hội An truyền thống và tiện nghi hiện đại đẳng cấp. Khách sạn được thành lập năm 2012, trải qua hơn 10 năm phát triển, chúng tôi tự hào là điểm đến tin yêu của hàng nghìn du khách trong và ngoài nước mỗi năm.\n\nMỗi phòng ngủ tại Lạc Hồng đều được thiết kế riêng biệt, kết hợp gỗ quý Hội An, tranh sơn mài thủ công và vải lụa thêu tay — tạo nên không gian nghỉ dưỡng vừa ấm cúng vừa sang trọng. Khu vực hồ bơi ngoài trời và spa ngay trong khuôn viên khách sạn mang đến trải nghiệm thư giãn trọn vẹn.",
      checkInHour: 14,
      checkOutHour: 12,
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      walkinMaxDays: 0,
      maxAdvanceDays: 365,
      minStayNights: 1,
      freeCancelHours: 48,
      childMaxAge: 12,
      wifiPassword: "LacHong@2025",
      breakfastHours: "06:30–10:00",
      logoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    },
    create: {
      name: "Lạc Hồng Boutique Hotel & Spa",
      type: PropertyType.BOUTIQUE,
      address: "48 Trần Hưng Đạo, Phường Minh An, Hội An, Quảng Nam, Việt Nam",
      phone: "+84 235 391 8888",
      email: "info@lachonghotel.vn",
      tagline: "Nơi truyền thống gặp gỡ sang trọng hiện đại",
      description:
        "Tọa lạc tại trung tâm phố cổ Hội An — Di sản Thế giới UNESCO — Lạc Hồng Boutique Hotel & Spa là sự hòa quyện tinh tế giữa kiến trúc nhà cổ Hội An truyền thống và tiện nghi hiện đại đẳng cấp. Khách sạn được thành lập năm 2012, trải qua hơn 10 năm phát triển, chúng tôi tự hào là điểm đến tin yêu của hàng nghìn du khách trong và ngoài nước mỗi năm.\n\nMỗi phòng ngủ tại Lạc Hồng đều được thiết kế riêng biệt, kết hợp gỗ quý Hội An, tranh sơn mài thủ công và vải lụa thêu tay — tạo nên không gian nghỉ dưỡng vừa ấm cúng vừa sang trọng. Khu vực hồ bơi ngoài trời và spa ngay trong khuôn viên khách sạn mang đến trải nghiệm thư giãn trọn vẹn.",
      checkInHour: 14,
      checkOutHour: 12,
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      walkinMaxDays: 0,
      maxAdvanceDays: 365,
      minStayNights: 1,
      freeCancelHours: 48,
      childMaxAge: 12,
      wifiPassword: "LacHong@2025",
      breakfastHours: "06:30–10:00",
      logoUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      kioskApiKey: "demo-kiosk-api-key-seed",
    },
  })
  console.log(`✅ Property: ${property.name}`)

  // ─── Amenities ──────────────────────────────────────────────────────────────
  const amenityData = [
    // Connectivity
    { key: "wifi", name: "WiFi miễn phí", icon: "📶", category: "Kết nối" },
    // Comfort
    { key: "ac", name: "Điều hòa nhiệt độ", icon: "❄️", category: "Tiện nghi" },
    { key: "safe", name: "Két sắt an toàn", icon: "🔒", category: "Tiện nghi" },
    // Entertainment
    { key: "tv", name: "Smart TV 55\"", icon: "📺", category: "Giải trí" },
    // Bathroom
    { key: "bath", name: "Phòng tắm riêng cao cấp", icon: "🚿", category: "Phòng tắm" },
    { key: "bathtub", name: "Bồn tắm nằm", icon: "🛁", category: "Phòng tắm" },
    // Dining
    { key: "minibar", name: "Minibar & Tủ lạnh", icon: "🍷", category: "Ẩm thực" },
    { key: "coffee", name: "Máy pha cà phê Nespresso", icon: "☕", category: "Ẩm thực" },
    // Wellness
    { key: "pool", name: "Hồ bơi ngoài trời", icon: "🏊", category: "Sức khỏe & Spa" },
    { key: "spa", name: "Spa & Massage", icon: "💆", category: "Sức khỏe & Spa" },
    { key: "gym", name: "Phòng gym", icon: "💪", category: "Sức khỏe & Spa" },
    // Services
    { key: "restaurant", name: "Nhà hàng & Bar", icon: "🍽️", category: "Dịch vụ" },
    { key: "room_service", name: "Dịch vụ phòng 24/7", icon: "🛎️", category: "Dịch vụ" },
    { key: "parking", name: "Bãi đỗ xe miễn phí", icon: "🅿️", category: "Dịch vụ" },
    { key: "airport", name: "Đưa đón sân bay", icon: "✈️", category: "Dịch vụ" },
    { key: "laundry", name: "Dịch vụ giặt ủi", icon: "👔", category: "Dịch vụ" },
    { key: "concierge", name: "Lễ tân 24/7", icon: "🏨", category: "Dịch vụ" },
  ]

  const amenities = await Promise.all(
    amenityData.map((a) =>
      db.amenity.upsert({
        where: { id: `amenity-${a.key}-${property.id}` },
        update: { name: a.name, icon: a.icon, category: a.category },
        create: {
          id: `amenity-${a.key}-${property.id}`,
          propertyId: property.id,
          name: a.name,
          icon: a.icon,
          category: a.category,
        },
      })
    )
  )
  console.log(`✅ Amenities: ${amenities.length} created`)

  const amenityMap = Object.fromEntries(amenityData.map((a, i) => [a.key, amenities[i]!]))

  // ─── Room Types ─────────────────────────────────────────────────────────────
  const standardRoom = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "standard-room" } },
    update: {
      name: "Phòng Standard",
      description:
        "Phòng Standard tại Lạc Hồng được thiết kế ấm cúng với gỗ quý Hội An và vải lụa thêu tay truyền thống. Phòng có diện tích 25m², giường đôi Queen size thoải mái, ban công nhỏ nhìn ra khu vườn xanh mát bên trong khách sạn. Hoàn hảo cho cặp đôi và khách du lịch solo muốn khám phá phố cổ Hội An.",
      areaM2: 25,
      maxAdults: 2,
      maxChildren: 1,
      bedType: BedType.DOUBLE,
      photoUrls: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
        "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=900&q=80",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80",
      ],
      basePrice: 750000,
      isActive: true,
      isFeatured: false,
    },
    create: {
      propertyId: property.id,
      name: "Phòng Standard",
      slug: "standard-room",
      description:
        "Phòng Standard tại Lạc Hồng được thiết kế ấm cúng với gỗ quý Hội An và vải lụa thêu tay truyền thống. Phòng có diện tích 25m², giường đôi Queen size thoải mái, ban công nhỏ nhìn ra khu vườn xanh mát bên trong khách sạn. Hoàn hảo cho cặp đôi và khách du lịch solo muốn khám phá phố cổ Hội An.",
      areaM2: 25,
      maxAdults: 2,
      maxChildren: 1,
      bedType: BedType.DOUBLE,
      photoUrls: [
        "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80",
        "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=900&q=80",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80",
      ],
      basePrice: 750000,
      isActive: true,
      isFeatured: false,
    },
  })

  const deluxeRoom = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "deluxe-room" } },
    update: {
      name: "Phòng Deluxe Vườn",
      description:
        "Phòng Deluxe Vườn rộng 35m² với giường King size sang trọng và cửa sổ lớn nhìn ra khu vườn nhiệt đới tươi tốt. Phòng được trang bị minibar, máy pha cà phê Nespresso và bồn tắm đứng riêng biệt. Nội thất kết hợp hài hòa giữa gỗ teak và đá marble tạo cảm giác thư thái, sang trọng.",
      areaM2: 35,
      maxAdults: 2,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
        "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=900&q=80",
      ],
      basePrice: 1200000,
      isActive: true,
      isFeatured: true,
    },
    create: {
      propertyId: property.id,
      name: "Phòng Deluxe Vườn",
      slug: "deluxe-room",
      description:
        "Phòng Deluxe Vườn rộng 35m² với giường King size sang trọng và cửa sổ lớn nhìn ra khu vườn nhiệt đới tươi tốt. Phòng được trang bị minibar, máy pha cà phê Nespresso và bồn tắm đứng riêng biệt. Nội thất kết hợp hài hòa giữa gỗ teak và đá marble tạo cảm giác thư thái, sang trọng.",
      areaM2: 35,
      maxAdults: 2,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
        "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=900&q=80",
      ],
      basePrice: 1200000,
      isActive: true,
      isFeatured: true,
    },
  })

  const suite = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "suite" } },
    update: {
      name: "Suite Hồ Bơi",
      description:
        "Suite Hồ Bơi là điểm đến của những du khách tìm kiếm trải nghiệm đỉnh cao. Rộng 55m² với phòng khách riêng biệt, ban công rộng nhìn thẳng ra hồ bơi ngoài trời. Phòng ngủ có giường King size cao cấp, bồn tắm nằm cạnh cửa sổ kính, phòng tắm mưa riêng biệt. Dịch vụ butler cá nhân và turndown service hàng ngày.",
      areaM2: 55,
      maxAdults: 3,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&q=80",
      ],
      basePrice: 2500000,
      isActive: true,
      isFeatured: true,
    },
    create: {
      propertyId: property.id,
      name: "Suite Hồ Bơi",
      slug: "suite",
      description:
        "Suite Hồ Bơi là điểm đến của những du khách tìm kiếm trải nghiệm đỉnh cao. Rộng 55m² với phòng khách riêng biệt, ban công rộng nhìn thẳng ra hồ bơi ngoài trời. Phòng ngủ có giường King size cao cấp, bồn tắm nằm cạnh cửa sổ kính, phòng tắm mưa riêng biệt. Dịch vụ butler cá nhân và turndown service hàng ngày.",
      areaM2: 55,
      maxAdults: 3,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80",
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=900&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
        "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=900&q=80",
      ],
      basePrice: 2500000,
      isActive: true,
      isFeatured: true,
    },
  })
  console.log(`✅ Room types: Standard, Deluxe Vườn, Suite Hồ Bơi`)

  // Assign amenities to room types
  const roomTypeAmenities = [
    // Standard: wifi, ac, tv, coffee, bath, safe
    { roomTypeId: standardRoom.id, amenityId: amenityMap.wifi!.id },
    { roomTypeId: standardRoom.id, amenityId: amenityMap.ac!.id },
    { roomTypeId: standardRoom.id, amenityId: amenityMap.tv!.id },
    { roomTypeId: standardRoom.id, amenityId: amenityMap.coffee!.id },
    { roomTypeId: standardRoom.id, amenityId: amenityMap.bath!.id },
    { roomTypeId: standardRoom.id, amenityId: amenityMap.safe!.id },
    // Deluxe: + minibar, room_service
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.wifi!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.ac!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.tv!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.coffee!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.bath!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.safe!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.minibar!.id },
    { roomTypeId: deluxeRoom.id, amenityId: amenityMap.room_service!.id },
    // Suite: everything
    { roomTypeId: suite.id, amenityId: amenityMap.wifi!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.ac!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.tv!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.coffee!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.bath!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.bathtub!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.safe!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.minibar!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.room_service!.id },
    { roomTypeId: suite.id, amenityId: amenityMap.pool!.id },
  ]

  await db.roomTypeAmenity.createMany({
    data: roomTypeAmenities,
    skipDuplicates: true,
  })

  // ─── Rooms (10 total) ────────────────────────────────────────────────────────
  const roomData = [
    // Standard rooms (4)
    { number: "101", floor: 1, roomTypeId: standardRoom.id },
    { number: "102", floor: 1, roomTypeId: standardRoom.id },
    { number: "201", floor: 2, roomTypeId: standardRoom.id },
    { number: "202", floor: 2, roomTypeId: standardRoom.id },
    // Deluxe rooms (4)
    { number: "103", floor: 1, roomTypeId: deluxeRoom.id },
    { number: "104", floor: 1, roomTypeId: deluxeRoom.id },
    { number: "203", floor: 2, roomTypeId: deluxeRoom.id },
    { number: "204", floor: 2, roomTypeId: deluxeRoom.id },
    // Suites (2)
    { number: "301", floor: 3, roomTypeId: suite.id },
    { number: "302", floor: 3, roomTypeId: suite.id },
  ]

  await db.room.createMany({
    data: roomData.map((r) => ({
      propertyId: property.id,
      roomTypeId: r.roomTypeId,
      number: r.number,
      floor: r.floor,
      status: "CLEAN",
      isActive: true,
    })),
    skipDuplicates: true,
  })
  console.log(`✅ Rooms: 10 rooms (4 Standard, 4 Deluxe, 2 Suite)`)

  // ─── Rate Plans ──────────────────────────────────────────────────────────────
  const standardRate = await db.ratePlan.upsert({
    where: { id: `rateplan-standard-${property.id}` },
    update: {},
    create: {
      id: `rateplan-standard-${property.id}`,
      propertyId: property.id,
      name: "Giá linh hoạt",
      description: "Hủy miễn phí trước 48 giờ check-in. Thanh toán tại khách sạn.",
      isNonRefundable: false,
      isActive: true,
    },
  })

  const nonRefundableRate = await db.ratePlan.upsert({
    where: { id: `rateplan-nonrefund-${property.id}` },
    update: {},
    create: {
      id: `rateplan-nonrefund-${property.id}`,
      propertyId: property.id,
      name: "Giá không hoàn tiền",
      description: "Tiết kiệm 15% — không hoàn tiền khi hủy. Thanh toán trước.",
      isNonRefundable: true,
      discountPercent: 15.0,
      isActive: true,
    },
  })

  const ratePlanRoomTypes = [standardRate, nonRefundableRate].flatMap((rp) =>
    [standardRoom, deluxeRoom, suite].map((rt) => ({
      ratePlanId: rp.id,
      roomTypeId: rt.id,
    }))
  )
  await db.ratePlanRoomType.createMany({
    data: ratePlanRoomTypes,
    skipDuplicates: true,
  })
  console.log(`✅ Rate plans: Giá linh hoạt, Giá không hoàn tiền`)

  // ─── Admin Staff ─────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin123!", 12)
  await db.staff.upsert({
    where: { email: "admin@demo.hotel" },
    update: {},
    create: {
      propertyId: property.id,
      email: "admin@demo.hotel",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: StaffRole.ADMIN,
      isActive: true,
      language: "vi",
    },
  })
  console.log(`✅ Admin staff: admin@demo.hotel / Admin123!`)

  // ─── Services ────────────────────────────────────────────────────────────────
  const serviceData = [
    { name: "Bữa sáng buffet", category: ServiceCategory.FOOD_BEVERAGE, unit: "người/ngày", price: 180000 },
    { name: "Đưa đón sân bay Đà Nẵng", category: ServiceCategory.TRANSPORT, unit: "lượt", price: 450000 },
    { name: "Giặt ủi", category: ServiceCategory.LAUNDRY, unit: "bộ", price: 80000 },
    { name: "Gói spa 60 phút", category: ServiceCategory.SPA, unit: "buổi", price: 650000 },
    { name: "Gói spa 90 phút - Đá nóng", category: ServiceCategory.SPA, unit: "buổi", price: 950000 },
    { name: "Minibar", category: ServiceCategory.MINIBAR, unit: "set", price: 150000 },
    { name: "Thuê xe đạp", category: ServiceCategory.OTHER, unit: "ngày", price: 60000 },
    { name: "Tour phố cổ đêm", category: ServiceCategory.OTHER, unit: "người", price: 250000 },
  ]

  await db.service.createMany({
    data: serviceData.map((s) => ({
      propertyId: property.id,
      name: s.name,
      category: s.category,
      unit: s.unit,
      price: s.price,
      isActive: true,
    })),
    skipDuplicates: true,
  })
  console.log(`✅ Services: ${serviceData.length} dịch vụ`)

  // ─── Tax Rate ─────────────────────────────────────────────────────────────────
  await db.taxRate.upsert({
    where: { id: `taxrate-vat-${property.id}` },
    update: {},
    create: {
      id: `taxrate-vat-${property.id}`,
      propertyId: property.id,
      name: "VAT",
      rate: 10.0,
      appliesTo: TaxAppliesTo.ALL,
      isActive: true,
    },
  })
  console.log(`✅ Tax rate: VAT 10%`)

  // ─── Promo Codes ──────────────────────────────────────────────────────────────
  // Standard demo code
  await db.promoCode.upsert({
    where: { code: "DEMO2025" },
    update: { validUntil: new Date("2026-12-31") },
    create: {
      propertyId: property.id,
      code: "DEMO2025",
      description: "Mã demo — Giảm 10% mọi loại phòng",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxUses: 1000,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2026-12-31"),
      roomTypeIds: [],
      isActive: true,
    },
  })

  // Flash deal 30% off
  await db.promoCode.upsert({
    where: { code: "HOIAN30" },
    update: {},
    create: {
      propertyId: property.id,
      code: "HOIAN30",
      description: "Flash Deal Hội An — Giảm 30% cho đặt phòng trước 7 ngày",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 30,
      maxUses: 200,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      roomTypeIds: [],
      isActive: true,
    },
  })

  // Summer flash deal 20% off
  await db.promoCode.upsert({
    where: { code: "SUMMER20" },
    update: {},
    create: {
      propertyId: property.id,
      code: "SUMMER20",
      description: "Ưu đãi hè — Giảm 20% kỳ nghỉ hè",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      maxUses: 500,
      validFrom: new Date("2026-05-01"),
      validUntil: new Date("2026-08-31"),
      roomTypeIds: [],
      isActive: true,
    },
  })

  // Fixed amount off for Suite
  await db.promoCode.upsert({
    where: { code: "SUITE500K" },
    update: {},
    create: {
      propertyId: property.id,
      code: "SUITE500K",
      description: "Giảm 500.000đ khi đặt Suite Hồ Bơi",
      discountType: DiscountType.FIXED_AMOUNT,
      discountValue: 500000,
      maxUses: 100,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      roomTypeIds: [suite.id],
      isActive: true,
    },
  })

  console.log(`✅ Promo codes: DEMO2025, HOIAN30, SUMMER20, SUITE500K`)

  console.log("\n✨ Seed hoàn tất!")
  console.log(`   Property ID: ${property.id}`)
  console.log(`   Kiosk API Key: ${property.kioskApiKey}`)
  console.log(`   Admin login: admin@demo.hotel / Admin123!`)
  console.log(`   Mã khuyến mãi: DEMO2025 (10%), HOIAN30 (30%), SUMMER20 (20%), SUITE500K (500k fixed)`)
}

main()
  .catch((e) => {
    console.error("❌ Seed thất bại:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
