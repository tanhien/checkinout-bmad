import { PrismaClient, StaffRole, PropertyType, BedType, ServiceCategory, TaxAppliesTo, DiscountType } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ─── Property ───────────────────────────────────────────────────────────────
  const property = await db.property.upsert({
    where: { kioskApiKey: "demo-kiosk-api-key-seed" },
    update: {},
    create: {
      name: "Demo Boutique Hotel",
      type: PropertyType.BOUTIQUE,
      address: "123 Nguyen Hue, District 1, Ho Chi Minh City, Vietnam",
      phone: "+84 28 1234 5678",
      email: "info@demo.hotel",
      tagline: "Boutique comfort in the heart of the city",
      description:
        "A charming boutique hotel offering personalized service and elegant rooms in the heart of Ho Chi Minh City.",
      checkInHour: 14,
      checkOutHour: 12,
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      walkinMaxDays: 0,
      maxAdvanceDays: 365,
      minStayNights: 1,
      freeCancelHours: 48,
      childMaxAge: 12,
      wifiPassword: "DemoHotel2025",
      breakfastHours: "07:00–10:00",
      kioskApiKey: "demo-kiosk-api-key-seed",
    },
  })
  console.log(`✅ Property: ${property.name}`)

  // ─── Amenities ──────────────────────────────────────────────────────────────
  const amenityData = [
    { name: "Free WiFi", icon: "wifi", category: "connectivity" },
    { name: "Air Conditioning", icon: "wind", category: "comfort" },
    { name: "Smart TV", icon: "tv", category: "entertainment" },
    { name: "Mini Fridge", icon: "refrigerator", category: "dining" },
    { name: "En Suite Bathroom", icon: "bath", category: "bathroom" },
  ]

  const amenities = await Promise.all(
    amenityData.map((a) =>
      db.amenity.upsert({
        where: { id: `amenity-${a.icon}-${property.id}` },
        update: {},
        create: {
          id: `amenity-${a.icon}-${property.id}`,
          propertyId: property.id,
          name: a.name,
          icon: a.icon,
          category: a.category,
        },
      })
    )
  )
  console.log(`✅ Amenities: ${amenities.length} created`)

  const [wifi, ac, tv, fridge, bath] = amenities as typeof amenities

  // ─── Room Types ─────────────────────────────────────────────────────────────
  const standardRoom = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "standard-room" } },
    update: {},
    create: {
      propertyId: property.id,
      name: "Standard Room",
      slug: "standard-room",
      description: "Comfortable room with essential amenities, perfect for solo travelers and couples.",
      areaM2: 25,
      maxAdults: 2,
      maxChildren: 1,
      bedType: BedType.DOUBLE,
      photoUrls: [],
      basePrice: 500000,
      isActive: true,
      isFeatured: false,
    },
  })

  const deluxeRoom = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "deluxe-room" } },
    update: {},
    create: {
      propertyId: property.id,
      name: "Deluxe Room",
      slug: "deluxe-room",
      description:
        "Spacious deluxe room with king bed, city views, and premium amenities for a luxurious stay.",
      areaM2: 35,
      maxAdults: 2,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [],
      basePrice: 800000,
      isActive: true,
      isFeatured: true,
    },
  })

  const suite = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "suite" } },
    update: {},
    create: {
      propertyId: property.id,
      name: "Suite",
      slug: "suite",
      description:
        "Our most prestigious accommodation, featuring a separate living area, panoramic city views, and butler service.",
      areaM2: 55,
      maxAdults: 3,
      maxChildren: 2,
      bedType: BedType.KING,
      photoUrls: [],
      basePrice: 1500000,
      isActive: true,
      isFeatured: true,
    },
  })
  console.log(`✅ Room types: Standard, Deluxe, Suite`)

  // Assign amenities to room types (upsert-safe)
  const roomTypeAmenities = [
    { roomTypeId: standardRoom.id, amenityId: wifi!.id },
    { roomTypeId: standardRoom.id, amenityId: ac!.id },
    { roomTypeId: standardRoom.id, amenityId: tv!.id },
    { roomTypeId: deluxeRoom.id, amenityId: wifi!.id },
    { roomTypeId: deluxeRoom.id, amenityId: ac!.id },
    { roomTypeId: deluxeRoom.id, amenityId: tv!.id },
    { roomTypeId: deluxeRoom.id, amenityId: fridge!.id },
    { roomTypeId: suite.id, amenityId: wifi!.id },
    { roomTypeId: suite.id, amenityId: ac!.id },
    { roomTypeId: suite.id, amenityId: tv!.id },
    { roomTypeId: suite.id, amenityId: fridge!.id },
    { roomTypeId: suite.id, amenityId: bath!.id },
  ]

  await db.roomTypeAmenity.createMany({
    data: roomTypeAmenities,
    skipDuplicates: true,
  })

  // ─── Rooms (10 total) ────────────────────────────────────────────────────────
  const roomData = [
    // Standard rooms (5)
    { number: "101", floor: 1, roomTypeId: standardRoom.id },
    { number: "102", floor: 1, roomTypeId: standardRoom.id },
    { number: "103", floor: 1, roomTypeId: standardRoom.id },
    { number: "201", floor: 2, roomTypeId: standardRoom.id },
    { number: "202", floor: 2, roomTypeId: standardRoom.id },
    // Deluxe rooms (4)
    { number: "104", floor: 1, roomTypeId: deluxeRoom.id },
    { number: "105", floor: 1, roomTypeId: deluxeRoom.id },
    { number: "203", floor: 2, roomTypeId: deluxeRoom.id },
    { number: "204", floor: 2, roomTypeId: deluxeRoom.id },
    // Suite (1)
    { number: "205", floor: 2, roomTypeId: suite.id },
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
  console.log(`✅ Rooms: 10 rooms created (5 Standard, 4 Deluxe, 1 Suite)`)

  // ─── Rate Plans ──────────────────────────────────────────────────────────────
  const standardRate = await db.ratePlan.upsert({
    where: { id: `rateplan-standard-${property.id}` },
    update: {},
    create: {
      id: `rateplan-standard-${property.id}`,
      propertyId: property.id,
      name: "Standard Rate",
      description: "Flexible rate with free cancellation up to 48 hours before check-in.",
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
      name: "Non-Refundable Rate",
      description: "Save 15% with our best-value non-refundable rate.",
      isNonRefundable: true,
      discountPercent: 15.0,
      isActive: true,
    },
  })

  // Link rate plans to all room types
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
  console.log(`✅ Rate plans: Standard Rate, Non-Refundable Rate`)

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

  // ─── Services (5) ────────────────────────────────────────────────────────────
  const serviceData = [
    { name: "Breakfast", category: ServiceCategory.FOOD_BEVERAGE, unit: "person/day", price: 150000 },
    {
      name: "Airport Transfer",
      category: ServiceCategory.TRANSPORT,
      unit: "trip",
      price: 500000,
    },
    { name: "Laundry", category: ServiceCategory.LAUNDRY, unit: "piece", price: 50000 },
    { name: "Spa Treatment", category: ServiceCategory.SPA, unit: "session", price: 800000 },
    { name: "Minibar Restock", category: ServiceCategory.MINIBAR, unit: "set", price: 200000 },
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
  console.log(`✅ Services: ${serviceData.length} services created`)

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

  // ─── Demo Promo Code ──────────────────────────────────────────────────────────
  await db.promoCode.upsert({
    where: { code: "DEMO2025" },
    update: {},
    create: {
      propertyId: property.id,
      code: "DEMO2025",
      description: "Demo promo code — 10% off any room",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      maxUses: 100,
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
      roomTypeIds: [],
      isActive: true,
    },
  })
  console.log(`✅ Promo code: DEMO2025 (10% off)`)

  console.log("\n✨ Seed complete!")
  console.log(`   Property ID: ${property.id}`)
  console.log(`   Kiosk API Key: ${property.kioskApiKey}`)
  console.log(`   Admin login: admin@demo.hotel / Admin123!`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
