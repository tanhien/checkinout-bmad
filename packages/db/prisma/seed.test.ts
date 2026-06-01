/**
 * Test seed — creates deterministic data for E2E and integration tests.
 * Run: tsx prisma/seed.test.ts
 * Uses a separate PROPERTY so it doesn't pollute dev seed data.
 */
import { PrismaClient, StaffRole, PropertyType, BedType, BookingChannel, BookingStatus, RoomStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

const TEST_KIOSK_KEY = "test-kiosk-api-key-e2e"
const NOW = new Date()
const YESTERDAY = new Date(NOW.getTime() - 86400_000)
const TOMORROW = new Date(NOW.getTime() + 86400_000)
const IN3DAYS = new Date(NOW.getTime() + 3 * 86400_000)
const IN7DAYS = new Date(NOW.getTime() + 7 * 86400_000)
const IN14DAYS = new Date(NOW.getTime() + 14 * 86400_000)

function utcDate(d: Date) {
  const iso = d.toISOString().slice(0, 10)
  return new Date(iso + "T00:00:00.000Z")
}

async function main() {
  console.log("🧪 Seeding test database...\n")

  // ─── Property ──────────────────────────────────────────────────────────────
  const property = await db.property.upsert({
    where: { kioskApiKey: TEST_KIOSK_KEY },
    update: { name: "TEST Hotel E2E" },
    create: {
      name: "TEST Hotel E2E",
      type: PropertyType.BOUTIQUE,
      address: "1 Test Street, Ho Chi Minh City",
      phone: "+84 000 000 0000",
      email: "test@hotel.vn",
      checkInHour: 14,
      checkOutHour: 12,
      timezone: "Asia/Ho_Chi_Minh",
      currency: "VND",
      freeCancelHours: 48,
      wifiPassword: "TestWifi@2026",
      kioskApiKey: TEST_KIOSK_KEY,
      walkinMaxDays: 0,
      maxAdvanceDays: 365,
      minStayNights: 1,
      childMaxAge: 12,
    },
  })
  console.log(`✅ Property: ${property.id} (${property.name})`)

  // ─── Staff accounts ────────────────────────────────────────────────────────
  const staffAccounts: { email: string; role: StaffRole; firstName: string; lastName: string; pw: string }[] = [
    { email: "admin@test.hotel",     role: StaffRole.ADMIN,        firstName: "Admin",    lastName: "Test",  pw: "Admin@12345" },
    { email: "manager@test.hotel",   role: StaffRole.MANAGER,      firstName: "Manager",  lastName: "Test",  pw: "Manager@12345" },
    { email: "desk@test.hotel",      role: StaffRole.FRONT_DESK,   firstName: "FrontDesk", lastName: "Test", pw: "Desk@12345" },
    { email: "house@test.hotel",     role: StaffRole.HOUSEKEEPING, firstName: "House",    lastName: "Test",  pw: "House@12345" },
    { email: "account@test.hotel",   role: StaffRole.ACCOUNTANT,   firstName: "Account",  lastName: "Test",  pw: "Account@12345" },
  ]
  const staffMap: Record<string, string> = {}
  for (const s of staffAccounts) {
    const hash = await bcrypt.hash(s.pw, 10)
    const staff = await db.staff.upsert({
      where: { email: s.email },
      update: { passwordHash: hash, role: s.role, propertyId: property.id },
      create: { email: s.email, passwordHash: hash, role: s.role, propertyId: property.id,
                firstName: s.firstName, lastName: s.lastName, isActive: true },
    })
    staffMap[s.role] = staff.id
    console.log(`  👤 Staff [${s.role}]: ${s.email} / ${s.pw}`)
  }

  // ─── Room types ────────────────────────────────────────────────────────────
  const deluxe = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "test-deluxe" } },
    update: {},
    create: {
      propertyId: property.id, name: "Deluxe Room", slug: "test-deluxe",
      description: "Test deluxe room", maxAdults: 2, maxChildren: 1,
      bedType: BedType.KING, basePrice: 1_000_000, isActive: true,
      photoUrls: [],
    },
  })
  const standard = await db.roomType.upsert({
    where: { propertyId_slug: { propertyId: property.id, slug: "test-standard" } },
    update: {},
    create: {
      propertyId: property.id, name: "Standard Room", slug: "test-standard",
      description: "Test standard room", maxAdults: 2, maxChildren: 0,
      bedType: BedType.TWIN, basePrice: 600_000, isActive: true,
      photoUrls: [],
    },
  })
  console.log(`✅ RoomTypes: ${deluxe.id}, ${standard.id}`)

  // ─── Rate plan ─────────────────────────────────────────────────────────────
  let ratePlan = await db.ratePlan.findFirst({
    where: { propertyId: property.id, name: "TEST Standard Rate" },
  })
  if (!ratePlan) {
    ratePlan = await db.ratePlan.create({
      data: {
        propertyId: property.id, name: "TEST Standard Rate", isActive: true,
        discountPercent: null, weekdayPrice: 800_000, weekendPrice: 1_200_000,
        isNonRefundable: false,
      },
    })
  }
  await db.ratePlanRoomType.upsert({
    where: { ratePlanId_roomTypeId: { ratePlanId: ratePlan.id, roomTypeId: deluxe.id } },
    update: {},
    create: { ratePlanId: ratePlan.id, roomTypeId: deluxe.id },
  })
  console.log(`✅ RatePlan: ${ratePlan.id}`)

  // ─── Promo code ────────────────────────────────────────────────────────────
  await db.promoCode.upsert({
    where: { code: "TEST10" },
    update: { isActive: true },
    create: {
      propertyId: property.id, code: "TEST10",
      description: "Test 10% Off",
      discountType: "PERCENTAGE", discountValue: 10,
      isActive: true, usedCount: 0,
      validFrom: new Date(NOW.getTime() - 86400_000),
      validUntil: new Date(NOW.getTime() + 30 * 86400_000),
      roomTypeIds: [],
    },
  })
  console.log(`✅ PromoCode: TEST10`)

  // ─── Rooms (various states for tests) ─────────────────────────────────────
  const roomSpecs = [
    { number: "T101", floor: 1, status: RoomStatus.CLEAN,       label: "CLEAN — for check-in tests" },
    { number: "T102", floor: 1, status: RoomStatus.CLEAN,       label: "CLEAN — for kiosk check-in" },
    { number: "T103", floor: 1, status: RoomStatus.DIRTY,       label: "DIRTY — for housekeeping tests" },
    { number: "T104", floor: 1, status: RoomStatus.MAINTENANCE, label: "MAINTENANCE — should not be assigned" },
    { number: "T105", floor: 1, status: RoomStatus.CLEAN,       label: "CLEAN — for race condition test" },
    { number: "T201", floor: 2, status: RoomStatus.CLEAN,       label: "CLEAN — standard room" },
    { number: "T202", floor: 2, status: RoomStatus.OCCUPIED,    label: "OCCUPIED — for check-out test" },
  ]
  const roomMap: Record<string, string> = {}
  for (const r of roomSpecs) {
    const room = await db.room.upsert({
      where: { propertyId_number: { propertyId: property.id, number: r.number } },
      update: { status: r.status },
      create: {
        propertyId: property.id, number: r.number, floor: r.floor,
        roomTypeId: r.number.startsWith("T2") ? standard.id : deluxe.id,
        status: r.status, isActive: true, version: 1,
      },
    })
    roomMap[r.number] = room.id
    console.log(`  🚪 Room ${r.number}: ${r.status} — ${r.label}`)
  }

  // ─── Guests ────────────────────────────────────────────────────────────────
  const guestRegular = await db.guest.upsert({
    where: { email: "guest.test@example.com" },
    update: {},
    create: {
      email: "guest.test@example.com", firstName: "Test", lastName: "Guest",
      phone: "0912345678", nationality: "VN", language: "vi",
    },
  })
  const guestVi = await db.guest.upsert({
    where: { email: "nguyen.bob@example.com" },
    update: {},
    create: {
      email: "nguyen.bob@example.com", firstName: "Bob", lastName: "Nguyen",
      phone: "0987654321", nationality: "VN", language: "vi",
    },
  })
  const guestBlacklist = await db.guest.upsert({
    where: { email: "blacklist@example.com" },
    update: { tag: "BLACKLIST" },
    create: {
      email: "blacklist@example.com", firstName: "Black", lastName: "Listed",
      phone: "0900000000", nationality: "VN", language: "vi", tag: "BLACKLIST",
    },
  })
  const guestAuth = await db.guest.upsert({
    where: { email: "auth.guest@example.com" },
    update: {},
    create: {
      email: "auth.guest@example.com", firstName: "Auth", lastName: "Guest",
      phone: "0911111111", nationality: "VN", language: "vi",
      passwordHash: await bcrypt.hash("GuestPass@123", 10),
    },
  })
  console.log(`✅ Guests: regular, vietnamese-name, blacklist, auth`)

  // ─── Bookings (all states) ─────────────────────────────────────────────────

  async function createBookingWithFolio(opts: {
    confirmationCode: string
    guestId: string
    roomTypeId: string
    status: BookingStatus
    checkIn: Date
    checkOut: Date
    assignRoomNumber?: string
    channel?: BookingChannel
  }) {
    const nights = Math.round((opts.checkOut.getTime() - opts.checkIn.getTime()) / 86400_000)
    const b = await db.booking.upsert({
      where: { confirmationCode: opts.confirmationCode },
      update: { status: opts.status },
      create: {
        confirmationCode: opts.confirmationCode,
        propertyId: property.id,
        guestId: opts.guestId,
        roomTypeId: opts.roomTypeId,
        ratePlanId: ratePlan.id,
        status: opts.status,
        channel: opts.channel ?? BookingChannel.ONLINE,
        checkInDate: utcDate(opts.checkIn),
        checkOutDate: utcDate(opts.checkOut),
        adults: 2, children: 0,
        roomPricePerNight: 1_000_000,
        totalNights: nights,
        lockedUntil: new Date(NOW.getTime() + 30 * 60 * 1000),
      },
    })
    const folio = await db.folio.upsert({
      where: { bookingId: b.id },
      update: {},
      create: { bookingId: b.id, status: "OPEN" },
    })
    const existingCharge = await db.folioItem.findFirst({ where: { folioId: folio.id, type: "ROOM_CHARGE" } })
    if (!existingCharge) {
      await db.folioItem.create({
        data: {
          folioId: folio.id, type: "ROOM_CHARGE",
          description: `Room charge × ${nights} đêm`,
          amount: 1_000_000 * nights, quantity: nights,
          unitPrice: 1_000_000, isVoided: false,
          chargeDate: utcDate(opts.checkIn),
          createdById: staffMap[StaffRole.FRONT_DESK] ?? staffMap[StaffRole.ADMIN]!,
        },
      })
    }
    if (opts.assignRoomNumber && roomMap[opts.assignRoomNumber]) {
      const existing = await db.bookingRoom.findFirst({ where: { bookingId: b.id } })
      if (!existing) {
        await db.bookingRoom.create({ data: { bookingId: b.id, roomId: roomMap[opts.assignRoomNumber]! } })
      }
    }
    return b
  }

  // TC-KIOSK-01,02,03: CONFIRMED + room CLEAN → kiosk check-in
  const bKiosk = await createBookingWithFolio({
    confirmationCode: "HTL-2026-KIOSK1",
    guestId: guestVi.id,
    roomTypeId: deluxe.id,
    status: BookingStatus.CONFIRMED,
    checkIn: YESTERDAY,   // past checkIn so check-in window has passed
    checkOut: IN3DAYS,
    assignRoomNumber: "T102",
  })
  console.log(`  📋 Booking KIOSK  [CONFIRMED]: ${bKiosk.confirmationCode} — Guest: Nguyen Bob`)

  // TC-STAFF-03: CONFIRMED with CLEAN room → staff check-in
  const bCheckIn = await createBookingWithFolio({
    confirmationCode: "HTL-2026-CHKIN1",
    guestId: guestRegular.id,
    roomTypeId: deluxe.id,
    status: BookingStatus.CONFIRMED,
    checkIn: YESTERDAY,
    checkOut: IN3DAYS,
    assignRoomNumber: "T101",
  })
  console.log(`  📋 Booking CHECKIN [CONFIRMED]: ${bCheckIn.confirmationCode}`)

  // TC-STAFF-04, TC-KIOSK-08: CHECKED_IN → check-out
  const bCheckOut = await createBookingWithFolio({
    confirmationCode: "HTL-2026-CHKOUT",
    guestId: guestRegular.id,
    roomTypeId: standard.id,
    status: BookingStatus.CHECKED_IN,
    checkIn: YESTERDAY,
    checkOut: TOMORROW,
    assignRoomNumber: "T202",
  })
  console.log(`  📋 Booking CHECKOUT [CHECKED_IN]: ${bCheckOut.confirmationCode}`)

  // TC-BOOK-07,08: CONFIRMED future → cancel test
  const bCancel = await createBookingWithFolio({
    confirmationCode: "HTL-2026-CANCEL1",
    guestId: guestAuth.id,
    roomTypeId: deluxe.id,
    status: BookingStatus.CONFIRMED,
    checkIn: IN7DAYS,
    checkOut: IN14DAYS,
  })
  console.log(`  📋 Booking CANCEL  [CONFIRMED]: ${bCancel.confirmationCode} — free cancel window open`)

  // TC-BOOK-09: My-bookings tabs — CONFIRMED past checkIn (should still show)
  const bPastCheckin = await createBookingWithFolio({
    confirmationCode: "HTL-2026-PAST01",
    guestId: guestAuth.id,
    roomTypeId: standard.id,
    status: BookingStatus.CONFIRMED,
    checkIn: YESTERDAY,
    checkOut: TOMORROW,
  })
  console.log(`  📋 Booking PAST-CI [CONFIRMED]: ${bPastCheckin.confirmationCode} — past checkIn, still CONFIRMED`)

  // TC-KIOSK-04: Early check-in — CONFIRMED, checkIn = IN7DAYS (too early)
  const bEarly = await createBookingWithFolio({
    confirmationCode: "HTL-2026-EARLY1",
    guestId: guestRegular.id,
    roomTypeId: deluxe.id,
    status: BookingStatus.CONFIRMED,
    checkIn: IN7DAYS,
    checkOut: IN14DAYS,
  })
  console.log(`  📋 Booking EARLY   [CONFIRMED]: ${bEarly.confirmationCode} — checkIn in 7 days`)

  // TC-STAFF-11: No-show candidate
  const bNoShow = await createBookingWithFolio({
    confirmationCode: "HTL-2026-NOSHW1",
    guestId: guestRegular.id,
    roomTypeId: standard.id,
    status: BookingStatus.CONFIRMED,
    checkIn: YESTERDAY,
    checkOut: TOMORROW,
  })
  console.log(`  📋 Booking NO-SHOW [CONFIRMED]: ${bNoShow.confirmationCode}`)

  // TC-REPORT-*: CHECKED_OUT — for revenue/occupancy reports
  const bHistory = await createBookingWithFolio({
    confirmationCode: "HTL-2026-HIST01",
    guestId: guestRegular.id,
    roomTypeId: standard.id,
    status: BookingStatus.CHECKED_OUT,
    checkIn: new Date(NOW.getTime() - 3 * 86400_000),
    checkOut: YESTERDAY,
  })
  console.log(`  📋 Booking HISTORY [CHECKED_OUT]: ${bHistory.confirmationCode}`)

  // TC-FOLIO-*: CHECKED_IN with service charges
  const bFolio = await createBookingWithFolio({
    confirmationCode: "HTL-2026-FOLIO1",
    guestId: guestRegular.id,
    roomTypeId: deluxe.id,
    status: BookingStatus.CHECKED_IN,
    checkIn: YESTERDAY,
    checkOut: IN3DAYS,
  })
  // Add service charges to folio
  const folioForService = await db.folio.findUnique({ where: { bookingId: bFolio.id } })
  if (folioForService) {
    await db.folioItem.createMany({
      skipDuplicates: true,
      data: [
        { folioId: folioForService.id, type: "SERVICE" as const, description: "Minibar", amount: 150_000, quantity: 1, unitPrice: 150_000, isVoided: false, chargeDate: utcDate(YESTERDAY), createdById: staffMap[StaffRole.FRONT_DESK] ?? staffMap[StaffRole.ADMIN]! },
        { folioId: folioForService.id, type: "SERVICE" as const, description: "Laundry", amount: 80_000,  quantity: 1, unitPrice: 80_000,  isVoided: false, chargeDate: utcDate(YESTERDAY), createdById: staffMap[StaffRole.FRONT_DESK] ?? staffMap[StaffRole.ADMIN]! },
      ],
    })
  }
  console.log(`  📋 Booking FOLIO   [CHECKED_IN]: ${bFolio.confirmationCode} — with minibar+laundry`)

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(60))
  console.log("✅ Test seed complete!\n")
  console.log("PROPERTY ID  :", property.id)
  console.log("KIOSK API KEY:", TEST_KIOSK_KEY)
  console.log("\nSTAFF CREDENTIALS:")
  staffAccounts.forEach(s => console.log(`  ${s.role.padEnd(14)}: ${s.email} / ${s.pw}`))
  console.log("\nGUEST CREDENTIALS:")
  console.log("  Registered   : auth.guest@example.com / GuestPass@123")
  console.log("\nKEY BOOKINGS:")
  console.log("  Kiosk check-in    :", bKiosk.confirmationCode, "  Guest: Nguyen Bob (Họ=Nguyen, Tên=Bob)")
  console.log("  Staff check-in    :", bCheckIn.confirmationCode)
  console.log("  Staff check-out   :", bCheckOut.confirmationCode)
  console.log("  Cancel (in 7days) :", bCancel.confirmationCode)
  console.log("  Early (in 7days)  :", bEarly.confirmationCode)
  console.log("  No-show           :", bNoShow.confirmationCode)
  console.log("  Folio with charges:", bFolio.confirmationCode)
  console.log("\nROOM STATUS:")
  roomSpecs.forEach(r => console.log(`  ${r.number}: ${r.status.padEnd(12)} — ${r.label}`))
  console.log("─".repeat(60))
}

main()
  .catch((e) => { console.error("❌ Test seed failed:", e); process.exit(1) })
  .finally(() => db.$disconnect())
