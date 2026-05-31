# Architecture Document — Hotel Management System

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 3 — Solutioning  
**Status:** DRAFT — awaiting user confirmation

---

## 1. Confirmed Decisions (from PRD Open Questions)

| Decision | Value | Source |
|---|---|---|
| Kiosk platform | Web PWA (browser kiosk mode, no Electron) | OQ-K-05 |
| QR scanner | Hỗ trợ cả 2 (có và không có scanner) | OQ-K-01 |
| Check-in window | 14:00 mặc định, configurable | OQ-K-02 |
| Walk-in booking | Same-day only | OQ-K-03 |
| Concurrent kiosk | Queue-based | OQ-K-04 |
| Printer kiosk | USB hoặc IP network | OQ-K-06 |
| Call staff trigger | Âm thanh quầy + dashboard alert | OQ-K-07 |
| Staff realtime | WebSocket (Socket.io) | OQ-S-02 |
| Timezone storage | UTC | OQ-S-06 |
| Rate plan | Weekday/Weekend pricing | OQ-S-07 |
| Blacklist | Cảnh báo nhân viên, không chặn | OQ-S-08 |
| Invoice template | Theo từng khách sạn (configurable) | OQ-S-09 |
| Booking URL | Subdirectory (`/booking`) | OQ-B-01 |
| Child age threshold | Configurable per property | OQ-B-05 |
| Email template | Per property | OQ-B-06 |
| Booking lock timeout | Release sau 30 phút | OQ-B-07 |
| OG images | Có | OQ-B-08 |
| **Online payment** | **Pay at property (không thu tiền khi booking online)** | FR-B-33 note |

> **Quan trọng — Thay đổi booking model:** Online Booking Portal **không** thu tiền khi đặt phòng. Khách xác nhận booking → thanh toán khi check-out tại khách sạn. Chỉ **Kiosk walk-in** là prepay (BR-K-04).

---

## 2. Monorepo Structure

```
checkinout-bmad/
├── apps/
│   ├── kiosk/              # Vite + React — PWA, chạy trong browser kiosk mode
│   ├── staff/              # Next.js 15 (App Router) — staff management + API server chính
│   └── booking/            # Next.js 15 (App Router) — public booking portal
│
├── packages/
│   ├── api/                # tRPC routers + business logic (shared)
│   │   ├── src/
│   │   │   ├── routers/    # booking, room, guest, folio, housekeeping, report, property...
│   │   │   ├── context.ts  # request context (auth, db, property)
│   │   │   └── root.ts     # root router
│   │   └── package.json
│   │
│   ├── db/                 # Prisma schema + migrations + seed
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   ├── ui/                 # Shared React components (shadcn/ui base)
│   │   ├── src/
│   │   │   ├── components/ # Button, Input, Card, Badge, Dialog...
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── types/              # Shared TypeScript types + Zod schemas
│   │   ├── src/
│   │   │   ├── booking.ts
│   │   │   ├── room.ts
│   │   │   ├── guest.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/             # Shared configs
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── _bmad-output/           # BMAD planning artifacts
├── turbo.json              # Turborepo pipeline config
├── pnpm-workspace.yaml
└── CLAUDE.md
```

### App Responsibilities

| App | Port (dev) | Role | Auth |
|---|---|---|---|
| `apps/staff` | 3001 | Staff UI + **Primary API Server** (tRPC + WebSocket) | Staff JWT |
| `apps/booking` | 3000 | Public booking portal (SSR/ISR) | Guest JWT |
| `apps/kiosk` | 3002 | Kiosk PWA | Kiosk API Key |

**Kiosk gọi API:** Kiosk PWA gọi `apps/staff` cho check-in/out, gọi `apps/booking` cho availability search và walk-in booking.

---

## 3. Tech Stack (Final Decisions)

| Layer | Technology | Version | Lý do |
|---|---|---|---|
| Language | TypeScript | 5.x | Type safety toàn monorepo |
| Monorepo | Turborepo | 2.x | Shared packages, incremental builds |
| Package manager | pnpm | 9.x | Workspace support, disk efficiency |
| **Staff & Booking** | Next.js (App Router) | 15.x | SSR/ISR cho SEO, API Routes |
| **Kiosk** | Vite + React | 6.x / 19.x | Fast PWA build, no SSR needed |
| API layer | tRPC | 11.x | Type-safe end-to-end, no codegen |
| Database | PostgreSQL | 16.x | ACID, relations, booking constraints |
| ORM | Prisma | 6.x | Type-safe queries, migrations |
| Cache / Queue | Redis (Upstash) | — | Socket.io adapter, booking queue |
| **Auth — Staff** | jose (JWT) | 5.x | httpOnly cookie, 8h session |
| **Auth — Guest** | jose (JWT) | 5.x | httpOnly cookie, 30d session |
| **Auth — Kiosk** | API Key header | — | Per-device static key |
| Realtime | Socket.io | 4.x | WebSocket + Redis adapter |
| UI components | shadcn/ui + Radix | latest | Accessible, unstyled primitives |
| Styling | Tailwind CSS | 4.x | Utility-first |
| Email | Resend | latest | Transactional email + template |
| File storage | Cloudflare R2 | — | Room photos, invoice PDFs |
| PDF generation | @react-pdf/renderer | 4.x | Invoice PDF generation |
| QR code | qrcode | 1.x | QR generation for confirmation |
| Validation | Zod | 3.x | Schema validation + type inference |
| i18n | next-intl | 3.x | VI/EN, URL locale prefix |
| Testing | Vitest + Playwright | latest | Unit + E2E |
| Linting | ESLint + Prettier | latest | Code style |

---

## 4. Database Schema (Prisma)

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── PROPERTY ───────────────────────────────────────────

model Property {
  id                  String       @id @default(cuid())
  name                String
  type                PropertyType
  address             String
  phone               String
  email               String
  logoUrl             String?
  tagline             String?
  description         String?      // for booking portal homepage
  checkInHour         Int          @default(14)   // local time, e.g. 14 = 14:00
  checkOutHour        Int          @default(12)
  timezone            String       @default("Asia/Ho_Chi_Minh")
  currency            String       @default("VND")
  walkinMaxDays       Int          @default(0)    // 0 = same-day only (OQ-K-03)
  maxAdvanceDays      Int          @default(365)
  minStayNights       Int          @default(1)
  freeCancelHours     Int?         // null = non-refundable by default (OQ-B-02)
  childMaxAge         Int          @default(12)   // configurable (OQ-B-05)
  wifiPassword        String?
  breakfastHours      String?      // e.g. "07:00–10:00"
  invoiceTemplate     String?      // per-property HTML template (OQ-S-09)
  emailTemplate       String?      // per-property email HTML (OQ-B-06)
  kioskApiKey         String       @unique @default(cuid())
  roomTypes           RoomType[]
  rooms               Room[]
  ratePlans           RatePlan[]
  staff               Staff[]
  services            Service[]
  taxRates            TaxRate[]
  promoCodes          PromoCode[]
  amenities           Amenity[]
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt
}

enum PropertyType {
  BOUTIQUE
  BUSINESS
  RESORT
  HOSTEL
  SERVICED_APARTMENT
  MOTEL
}

// ─── ROOM TYPE ───────────────────────────────────────────

model RoomType {
  id          String            @id @default(cuid())
  propertyId  String
  property    Property          @relation(fields: [propertyId], references: [id])
  name        String
  slug        String            // SEO URL: /rooms/deluxe-ocean-view
  description String?
  areaM2      Float?
  maxAdults   Int
  maxChildren Int               @default(2)
  bedType     BedType
  photoUrls   String[]          // R2 URLs
  basePrice   Decimal           @db.Decimal(12, 2)
  isActive    Boolean           @default(true)
  isFeatured  Boolean           @default(false)  // show on homepage
  amenities   RoomTypeAmenity[]
  rooms       Room[]
  ratePlans   RatePlanRoomType[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@unique([propertyId, slug])
}

enum BedType {
  SINGLE
  DOUBLE
  TWIN
  KING
  QUEEN
  BUNK
}

model Amenity {
  id         String            @id @default(cuid())
  propertyId String
  property   Property          @relation(fields: [propertyId], references: [id])
  name       String
  icon       String            // icon identifier: "wifi", "pool", "parking"
  category   String
  rooms      RoomTypeAmenity[]
}

model RoomTypeAmenity {
  roomTypeId String
  amenityId  String
  roomType   RoomType @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)
  amenity    Amenity  @relation(fields: [amenityId], references: [id], onDelete: Cascade)
  @@id([roomTypeId, amenityId])
}

// ─── ROOM ───────────────────────────────────────────────

model Room {
  id              String        @id @default(cuid())
  propertyId      String
  property        Property      @relation(fields: [propertyId], references: [id])
  roomTypeId      String
  roomType        RoomType      @relation(fields: [roomTypeId], references: [id])
  number          String        // "101", "201A", "B12"
  floor           Int
  status          RoomStatus    @default(CLEAN)
  isActive        Boolean       @default(true)
  maintenanceNote String?
  maintenanceDue  DateTime?
  assignedToId    String?
  assignedTo      Staff?        @relation("HousekeepingAssignment", fields: [assignedToId], references: [id])
  cleaningStartAt DateTime?
  version         Int           @default(0)  // optimistic locking for concurrent assign
  bookingRooms    BookingRoom[]
  statusLogs      RoomStatusLog[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([propertyId, number])
}

enum RoomStatus {
  CLEAN
  DIRTY
  CLEANING
  INSPECTED
  OCCUPIED
  MAINTENANCE
  RESERVED
}

model RoomStatusLog {
  id        String     @id @default(cuid())
  roomId    String
  room      Room       @relation(fields: [roomId], references: [id])
  oldStatus RoomStatus
  newStatus RoomStatus
  staffId   String?
  note      String?
  createdAt DateTime   @default(now())
}

// ─── RATE PLAN ──────────────────────────────────────────

model RatePlan {
  id               String             @id @default(cuid())
  propertyId       String
  property         Property           @relation(fields: [propertyId], references: [id])
  name             String
  description      String?
  isNonRefundable  Boolean            @default(false)
  discountPercent  Decimal?           @db.Decimal(5, 2)
  minStayNights    Int                @default(1)
  weekdayPrice     Decimal?           @db.Decimal(12, 2)  // Mon–Thu override
  weekendPrice     Decimal?           @db.Decimal(12, 2)  // Fri–Sun override
  isActive         Boolean            @default(true)
  roomTypes        RatePlanRoomType[]
  bookings         Booking[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}

model RatePlanRoomType {
  ratePlanId    String
  roomTypeId    String
  priceOverride Decimal?  @db.Decimal(12, 2)
  ratePlan      RatePlan  @relation(fields: [ratePlanId], references: [id], onDelete: Cascade)
  roomType      RoomType  @relation(fields: [roomTypeId], references: [id], onDelete: Cascade)
  @@id([ratePlanId, roomTypeId])
}

// ─── GUEST ──────────────────────────────────────────────

model Guest {
  id           String      @id @default(cuid())
  email        String      @unique
  passwordHash String?     // null = guest checkout (no account)
  firstName    String
  lastName     String
  phone        String?
  nationality  String?
  idNumberEnc  String?     // AES-256 encrypted CCCD/Passport
  dateOfBirth  DateTime?
  tag          GuestTag    @default(REGULAR)
  isActive     Boolean     @default(true)
  language     String      @default("vi")
  bookings     Booking[]
  notes        GuestNote[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

enum GuestTag {
  REGULAR
  VIP
  CORPORATE
  BLACKLIST
}

model GuestNote {
  id        String   @id @default(cuid())
  guestId   String
  guest     Guest    @relation(fields: [guestId], references: [id])
  content   String
  authorId  String
  author    Staff    @relation(fields: [authorId], references: [id])
  isDeleted Boolean  @default(false)
  deletedAt DateTime?
  createdAt DateTime @default(now())
}

// ─── BOOKING ────────────────────────────────────────────

model Booking {
  id               String         @id @default(cuid())
  confirmationCode String         @unique  // human-readable, e.g. "HTL-2025-A3F7"
  propertyId       String
  guestId          String
  guest            Guest          @relation(fields: [guestId], references: [id])
  roomTypeId       String
  ratePlanId       String?
  ratePlan         RatePlan?      @relation(fields: [ratePlanId], references: [id])
  status           BookingStatus  @default(CONFIRMED)
  channel          BookingChannel @default(DIRECT)
  checkInDate      DateTime       // UTC midnight of check-in date
  checkOutDate     DateTime       // UTC midnight of check-out date
  actualCheckIn    DateTime?
  actualCheckOut   DateTime?
  adults           Int
  children         Int            @default(0)
  specialRequests  String?
  isEarlyCheckIn   Boolean        @default(false)
  isLateCheckOut   Boolean        @default(false)
  cancelledAt      DateTime?
  cancelReason     String?
  lockedUntil      DateTime?      // booking funnel lock (BR-B-07, OQ-B-07: released after 30min)
  promoCodeId      String?
  promoCode        PromoCode?     @relation(fields: [promoCodeId], references: [id])
  discountAmount   Decimal?       @db.Decimal(12, 2)
  roomPricePerNight Decimal       @db.Decimal(12, 2)  // snapshot at booking time
  totalNights      Int
  rooms            BookingRoom[]
  folio            Folio?
  auditLogs        AuditLog[]
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}

enum BookingStatus {
  CONFIRMED
  CHECKED_IN
  CHECKED_OUT
  CANCELLED
  NO_SHOW
}

enum BookingChannel {
  DIRECT    // online booking portal
  KIOSK     // walk-in via kiosk
  PHONE
  WALK_IN   // staff created
  OTA       // manual entry from OTA
}

model BookingRoom {
  id           String   @id @default(cuid())
  bookingId    String
  booking      Booking  @relation(fields: [bookingId], references: [id])
  roomId       String
  room         Room     @relation(fields: [roomId], references: [id])
  assignedAt   DateTime @default(now())
  assignedById String?
  @@unique([bookingId, roomId])
}

// ─── FOLIO ──────────────────────────────────────────────

model Folio {
  id          String      @id @default(cuid())
  bookingId   String      @unique
  booking     Booking     @relation(fields: [bookingId], references: [id])
  status      FolioStatus @default(OPEN)
  settledAt   DateTime?
  settledById String?
  items       FolioItem[]
  payments    Payment[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

enum FolioStatus {
  OPEN
  SETTLED
}

model FolioItem {
  id          String        @id @default(cuid())
  folioId     String
  folio       Folio         @relation(fields: [folioId], references: [id])
  type        FolioItemType
  description String
  quantity    Decimal       @db.Decimal(8, 2)
  unitPrice   Decimal       @db.Decimal(12, 2)
  amount      Decimal       @db.Decimal(12, 2)  // quantity × unitPrice
  serviceId   String?
  service     Service?      @relation(fields: [serviceId], references: [id])
  chargeDate  DateTime      // date the charge applies to (UTC)
  isVoided    Boolean       @default(false)
  voidReason  String?
  voidedAt    DateTime?
  voidedById  String?
  createdById String
  createdAt   DateTime      @default(now())
}

enum FolioItemType {
  ROOM_CHARGE
  SERVICE
  DISCOUNT
  TAX
}

model Payment {
  id          String        @id @default(cuid())
  folioId     String
  folio       Folio         @relation(fields: [folioId], references: [id])
  method      PaymentMethod
  amount      Decimal       @db.Decimal(12, 2)
  reference   String?
  note        String?
  createdById String
  createdAt   DateTime      @default(now())
}

enum PaymentMethod {
  CASH
  CARD
  BANK_TRANSFER
  DEMO
  OTHER
}

// ─── STAFF ──────────────────────────────────────────────

model Staff {
  id            String      @id @default(cuid())
  propertyId    String
  property      Property    @relation(fields: [propertyId], references: [id])
  email         String      @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          StaffRole
  isActive      Boolean     @default(true)
  language      String      @default("vi")
  lastLoginAt   DateTime?
  guestNotes    GuestNote[]
  assignedRooms Room[]      @relation("HousekeepingAssignment")
  auditLogs     AuditLog[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

enum StaffRole {
  ADMIN
  MANAGER
  FRONT_DESK
  HOUSEKEEPING
  ACCOUNTANT
}

model AuditLog {
  id         String   @id @default(cuid())
  staffId    String
  staff      Staff    @relation(fields: [staffId], references: [id])
  bookingId  String?
  booking    Booking? @relation(fields: [bookingId], references: [id])
  entityType String   // "Booking" | "Room" | "Folio" | "FolioItem" | "Staff"
  entityId   String
  action     String   // "CREATE" | "UPDATE" | "CHECK_IN" | "CHECK_OUT" | "VOID_CHARGE"
  changes    Json?    // { field: { old: any, new: any } }
  createdAt  DateTime @default(now())
}

// ─── SERVICES, TAX, PROMO ───────────────────────────────

model Service {
  id         String          @id @default(cuid())
  propertyId String
  property   Property        @relation(fields: [propertyId], references: [id])
  name       String
  category   ServiceCategory
  unit       String
  price      Decimal         @db.Decimal(12, 2)
  isActive   Boolean         @default(true)
  folioItems FolioItem[]
  createdAt  DateTime        @default(now())
}

enum ServiceCategory {
  FOOD_BEVERAGE
  LAUNDRY
  SPA
  MINIBAR
  TRANSPORT
  OTHER
}

model TaxRate {
  id         String       @id @default(cuid())
  propertyId String
  property   Property     @relation(fields: [propertyId], references: [id])
  name       String
  rate       Decimal      @db.Decimal(5, 2)
  appliesTo  TaxAppliesTo @default(ALL)
  isActive   Boolean      @default(true)
}

enum TaxAppliesTo {
  ROOM
  SERVICE
  ALL
}

model PromoCode {
  id            String       @id @default(cuid())
  propertyId    String
  property      Property     @relation(fields: [propertyId], references: [id])
  code          String       @unique
  description   String?
  discountType  DiscountType
  discountValue Decimal      @db.Decimal(10, 2)
  maxUses       Int?
  usedCount     Int          @default(0)
  validFrom     DateTime
  validUntil    DateTime
  roomTypeIds   String[]     // empty = all room types
  isActive      Boolean      @default(true)
  bookings      Booking[]
  createdAt     DateTime     @default(now())
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}
```

---

## 5. API Design (tRPC Routers)

`packages/api/src/routers/` — mỗi file là một tRPC router:

### 5.1 Context Types

```typescript
// packages/api/src/context.ts
type RequestContext = {
  db: PrismaClient
  redis: Redis
  auth: StaffSession | GuestSession | KioskSession | null
  propertyId: string | null
}

type StaffSession = { type: 'staff'; staffId: string; role: StaffRole; propertyId: string }
type GuestSession = { type: 'guest'; guestId: string; email: string }
type KioskSession = { type: 'kiosk'; propertyId: string }
```

### 5.2 Router Structure

```
packages/api/src/routers/
├── availability.ts    # checkAvailability(dates, adults, children, roomTypeId?)
├── booking.ts         # create, findByCode, updateStatus (checkIn/checkOut/cancel), list
├── room.ts            # list, updateStatus, assign, unassign, setMaintenance
├── guest.ts           # findOrCreate, getProfile, update, search, addNote
├── folio.ts           # getByBooking, addItem, voidItem, addPayment, settle, reopen
├── housekeeping.ts    # getBoard, assignRoom, startCleaning, finishCleaning, inspect
├── report.ts          # occupancy, revenue, channelMix, arrivals, departures
├── property.ts        # getConfig, updateConfig, getPublicInfo
├── roomType.ts        # list, getBySlug, getWithAvailability (calendar view)
├── staff.ts           # create, update, deactivate, list (admin only)
├── promoCode.ts       # validate, list, create, update (admin)
├── service.ts         # list, create, update (admin)
├── alert.ts           # triggerCallForHelp, getActiveAlerts, dismissAlert
└── kiosk.ts           # special router: checkInByCode, walkInBook, checkout, getQueueStatus
```

### 5.3 Auth Gates (tRPC middleware)

```typescript
// Middleware examples
const staffProcedure = publicProcedure.use(requireStaff)
const managerProcedure = staffProcedure.use(requireRole(['MANAGER', 'ADMIN']))
const adminProcedure = staffProcedure.use(requireRole(['ADMIN']))
const guestProcedure = publicProcedure.use(requireGuest)
const kioskProcedure = publicProcedure.use(requireKioskKey)

// Usage
booking.create = staffProcedure.input(CreateBookingSchema).mutation(...)
booking.checkIn = staffProcedure.input(...).mutation(...)  // front_desk+
folio.settle = managerProcedure.input(...).mutation(...)
kiosk.checkInByCode = kioskProcedure.input(...).mutation(...)
```

### 5.4 Kiosk Call Architecture

Kiosk PWA → gọi 2 endpoints:
- `GET /api/booking/rooms?checkin=...&checkout=...&adults=...` → booking portal API (availability)
- `POST /api/kiosk/trpc/[procedure]` → staff app tRPC (check-in, check-out, walk-in create)

Kiosk authenticate bằng `X-Kiosk-Api-Key` header với `property.kioskApiKey`.

### 5.5 Concurrent Check-in Queue (OQ-K-04)

```typescript
// packages/api/src/lib/kioskQueue.ts
// Redis-based queue cho concurrent kiosk check-in
async function acquireBookingLock(bookingId: string, ttlSec = 60): Promise<boolean> {
  const key = `kiosk:lock:${bookingId}`
  const result = await redis.set(key, '1', { NX: true, EX: ttlSec })
  return result === 'OK'
}

async function releaseBookingLock(bookingId: string): Promise<void> {
  await redis.del(`kiosk:lock:${bookingId}`)
}

// Trong kiosk.checkInByCode mutation:
// 1. acquireBookingLock(bookingId) → nếu false → trả lỗi "Đang xử lý, vui lòng chờ"
// 2. Thực hiện check-in logic
// 3. releaseBookingLock(bookingId) trong finally block
```

---

## 6. Authentication & Authorization

### 6.1 Staff Auth
- **Mechanism:** JWT trong httpOnly cookie (`staff_token`)
- **Payload:** `{ staffId, role, propertyId, iat, exp }`
- **Expiry:** 8 giờ; "Remember me" = 30 ngày
- **Refresh:** Tự động extend nếu activity trong 15 phút trước expire
- **Invalidation:** Redis blacklist khi admin deactivate tài khoản (NFR-S-11)

```typescript
// apps/staff/src/lib/auth.ts
const STAFF_JWT_SECRET = process.env.STAFF_JWT_SECRET  // min 32 bytes
```

### 6.2 Guest Auth (Booking Portal)
- **Mechanism:** JWT trong httpOnly cookie (`guest_token`)
- **Payload:** `{ guestId, email, iat, exp }`
- **Expiry:** 30 ngày
- **Guest checkout:** Không có token; tra cứu booking qua confirmationCode + email

### 6.3 Kiosk Auth
- **Mechanism:** Static API key per property, gửi trong header `X-Kiosk-Api-Key`
- **Key:** `property.kioskApiKey` (generated at property creation, regeneratable bởi admin)
- **Không có user session:** Kiosk API hoàn toàn stateless từ góc nhìn auth

### 6.4 RBAC Matrix (Staff)

```typescript
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  MANAGER: ['booking.*', 'room.*', 'housekeeping.*', 'guest.*', 'folio.*', 'report.*', 'staff.view', 'property.limited'],
  FRONT_DESK: ['booking.*', 'room.update', 'housekeeping.view', 'guest.*', 'folio.*'],
  HOUSEKEEPING: ['room.myAssigned', 'housekeeping.updateStatus'],
  ACCOUNTANT: ['booking.view', 'guest.view', 'folio.*', 'report.*'],
} as const
```

---

## 7. Real-time Architecture (WebSocket)

### 7.1 Stack
- **Socket.io 4.x** với Redis adapter (Upstash Redis)
- **Server:** Hosted trong `apps/staff` Next.js custom server
- **Clients:** Staff browser (React hooks), Kiosk PWA (alert subscription)

### 7.2 Events

```typescript
// packages/types/src/realtime.ts
type ServerToClientEvents = {
  'room:statusChanged': (data: { roomId: string; newStatus: RoomStatus; roomNumber: string }) => void
  'booking:checkedIn':  (data: { bookingId: string; roomNumber: string }) => void
  'booking:checkedOut': (data: { bookingId: string; roomNumber: string }) => void
  'alert:callForHelp':  (data: { kioskId: string; timestamp: string }) => void  // trigger sound (OQ-K-07)
  'alert:urgentRoom':   (data: { roomId: string; roomNumber: string; checkInAt: string }) => void
  'dashboard:refresh':  () => void
}

type ClientToServerEvents = {
  'housekeeping:startCleaning': (roomId: string) => void
  'housekeeping:finishCleaning': (roomId: string) => void
  'kiosk:callForHelp': (kioskId: string) => void
}
```

### 7.3 Rooms (Socket.io namespace)
- `/staff/{propertyId}` — Staff nhân viên subscribe
- `/kiosk/{propertyId}` — Kiosk subscribe để nhận `alert:callForHelp` confirmation

---

## 8. Integration Points

### 8.1 Email (Resend)

```typescript
// packages/api/src/lib/email.ts
// Templates per property (OQ-B-06, OQ-S-09)
sendBookingConfirmation(booking, property)  // → with QR code
sendCheckinConfirmation(booking, room, property)
sendCancellationConfirmation(booking, property)
sendPasswordReset(email, resetLink)
sendStaffPasswordReset(email, resetLink)
```

Email template: HTML lưu trong `property.emailTemplate`. Default template dùng nếu null.

### 8.2 File Storage (Cloudflare R2)

```
Bucket: hotel-management-{property-id}/
  rooms/{roomTypeId}/{filename}.webp    # Room photos
  invoices/{bookingId}/invoice.pdf      # Generated invoices
  logos/{propertyId}/logo.png           # Property logo
```

Upload: Server-side upload (không upload trực tiếp từ client). Signed URL với TTL 1h.

### 8.3 Payment (Demo Adapter)

```typescript
// packages/api/src/lib/payment/adapter.ts
interface PaymentAdapter {
  createIntent(amount: number, currency: string, metadata: object): Promise<PaymentIntent>
  confirmPayment(intentId: string): Promise<PaymentResult>
}

class DemoPaymentAdapter implements PaymentAdapter {
  async createIntent(amount, currency, metadata) {
    return { id: `demo_${cuid()}`, status: 'pending', amount }
  }
  async confirmPayment(intentId) {
    return { status: 'succeeded', transactionId: intentId }
  }
}

// Future: VNPayAdapter, MoMoAdapter, StripeAdapter implements PaymentAdapter
```

### 8.4 Thermal Printer (Kiosk — Windows only)

```typescript
// apps/kiosk/src/lib/printer.ts
// Kết nối USB hoặc IP network (OQ-K-06)
// Windows: WebUSB API hoặc native printer via local print server agent
// Android: Gửi email thay thế

async function printReceipt(data: ReceiptData): Promise<void> {
  if (navigator.usb) {
    // WebUSB for USB printers
  } else {
    // IP printing via fetch to local print endpoint
  }
}
```

### 8.5 Confirmation Code Generation

```typescript
// Format: "HTL-{YEAR}-{6-char-alphanum}"
// Example: "HTL-2025-A3F7K2"
function generateConfirmationCode(): string {
  const year = new Date().getFullYear()
  const rand = nanoid(6).toUpperCase()
  return `HTL-${year}-${rand}`
}
```

QR Code payload: JSON `{ "code": "HTL-2025-A3F7K2", "v": 1 }` → base64 → QR image trong email.

---

## 9. Deployment Architecture

### 9.1 Production Layout

```
Internet
  │
  ├── booking.hotel.com        (Vercel — apps/booking)
  │     └── /booking subdirectory deploy (OQ-B-01)
  │
  └── staff.hotel.com          (Railway / VPS — apps/staff)
        ├── HTTP (Next.js)
        ├── WebSocket (Socket.io)
        └── /api/kiosk/*       (kiosk API endpoints)

Kiosk (hotel LAN)
  └── Chrome/Browser fullscreen → staff.hotel.com/kiosk

Database: Self-hosted PostgreSQL 16 (Docker trên VPS)
Cache:    Upstash Redis
Storage:  Cloudflare R2
Email:    Resend
```

### 9.2 Kiosk Deployment (PWA, OQ-K-05)

Kiosk **không cần cài đặt**. Chạy trong browser fullscreen (kiosk mode):

**Android tablet:**
1. Mở Chrome → điều hướng đến `staff.hotel.com/kiosk`
2. Enable Android Kiosk Mode (Device Owner via MDM) hoặc dùng Fully Kiosk Browser
3. Pinned single app mode: chỉ chạy browser với URL này

**Windows PC:**
1. Mở Chrome → `staff.hotel.com/kiosk`
2. Kiosk mode: `chrome.exe --kiosk --kiosk-printing staff.hotel.com/kiosk`
3. Startup script bật kiosk mode tự động

### 9.3 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Auth secrets
STAFF_JWT_SECRET=...        # min 32 bytes
GUEST_JWT_SECRET=...        # min 32 bytes

# External services
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
RESEND_API_KEY=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_BUCKET=...

# App URLs
NEXT_PUBLIC_STAFF_URL=https://staff.hotel.com
NEXT_PUBLIC_BOOKING_URL=https://booking.hotel.com
```

---

## 10. Security Considerations

### 10.1 PII Encryption
- `Guest.idNumberEnc`: AES-256-GCM encrypted, key stored in environment variable `PII_ENCRYPTION_KEY`
- Decrypt chỉ khi cần display (staff view), không decrypt khi query/search

### 10.2 Kiosk Security
- Session data: Không lưu vào localStorage/sessionStorage. Chỉ in-memory React state
- Auto-reset: Sau 3 phút inactive (FR-K-05), state xóa hoàn toàn
- API key: Rotate được bởi Admin; cũ thành invalid ngay lập tức

### 10.3 Rate Limiting
- Booking API: 10 requests/IP/giờ (NFR-B-18)
- Login (staff + guest): 5 failed attempts → lockout 15 phút
- tRPC mutations: 100 req/phút/user (NFR-S-09)
- Implement via `@upstash/ratelimit` với Redis

### 10.4 SQL Injection & XSS
- Prisma ORM: Parameterized queries tự động, không raw SQL trừ khi cần
- All user input: Validate qua Zod schema trước khi đến DB
- Output: React escapes HTML tự động; rich text description dùng DOMPurify khi render

### 10.5 Optimistic Locking (Room Assignment)
```typescript
// Prevent two staff assigning same room simultaneously
await db.$transaction(async (tx) => {
  const room = await tx.room.findFirst({
    where: { id: roomId, version: expectedVersion }
  })
  if (!room) throw new TRPCError({ code: 'CONFLICT', message: 'Phòng vừa được assign cho booking khác' })
  await tx.room.update({
    where: { id: roomId },
    data: { status: 'RESERVED', version: { increment: 1 } }
  })
})
```

---

## 11. i18n Strategy

- **Staff app:** Language per user account (stored in `staff.language`), không dùng URL prefix
- **Booking app:** URL prefix `/vi/` và `/en/` (next-intl), auto-detect từ Accept-Language
- **Kiosk app:** Toggle trong UI (React state), không persist (session isolation)
- **Translation files:** `packages/config/i18n/vi.json` và `en.json` — shared bởi tất cả apps

---

## 12. Key Architectural Decisions Summary

| Decision | Rationale |
|---|---|
| Staff app = primary API server | Đơn giản hóa deployment, không cần tách backend riêng |
| Kiosk là PWA (không Electron) | Không cần cài đặt, update tức thì, quản lý tập trung |
| tRPC thay REST | Type-safe end-to-end, không cần API documentation riêng |
| Redis cho queue + realtime | Booking lock và Socket.io adapter cần shared state |
| UTC everywhere | Tránh timezone bugs khi migrate property sang múi giờ khác |
| Soft-delete tất cả | Audit trail + data recovery, không bao giờ mất dữ liệu lịch sử |
| Online booking = pay at property | Phù hợp thực tế VN, reduce friction khi booking |

---

## 13. Review Checklist

- [ ] Monorepo structure hợp lý
- [ ] Tech stack phù hợp với team và scale mục tiêu
- [ ] Database schema đủ các entity và relationships
- [ ] Auth strategy cho 3 loại user rõ ràng
- [ ] Kiosk PWA deployment khả thi với hardware thực tế
- [ ] WebSocket architecture scalable
- [ ] "Pay at property" model đúng với business logic mong muốn

**Sau khi confirm, gọi `/bmad-stories` để tạo Epics & Stories breakdown.**
