# Epics & Stories — Hotel Management System

**Version:** 1.0  
**Date:** 2026-05-30  
**Phase:** 3 — Solutioning  
**Status:** DRAFT — awaiting user confirmation

**Estimate key:** S = Small <4h · M = Medium 4–8h · L = Large 8–16h (L stories are flagged for splitting)

---

## Overview

| Epic | Title | Stories | Est. Total |
|---|---|---|---|
| E1 | Foundation & Infrastructure | 7 | ~5 ngày |
| E2 | Core Business Logic | 8 | ~6 ngày |
| E3 | Staff Management Web | 10 | ~7 ngày |
| E4 | Kiosk App | 7 | ~5 ngày |
| E5 | Online Booking Portal | 8 | ~6 ngày |
| E6 | Integration & Advanced Features | 4 | ~3 ngày |

**Total estimate: ~32 ngày dev (1 người)**

---

## EPIC 1 — Foundation & Infrastructure

**Goal:** Thiết lập toàn bộ nền tảng kỹ thuật (monorepo, DB, auth, realtime) để các epic tiếp theo có thể build trên đó.

---

### E1-S1 — Initialize Turborepo monorepo với pnpm

**As a** developer, **I want** a working monorepo structure **so that** all apps and packages can share code and build in the right order.

**Acceptance Criteria:**
1. `pnpm-workspace.yaml` khai báo `apps/*` và `packages/*`
2. `turbo.json` có pipeline: `build` (depends on `^build`), `dev`, `lint`, `typecheck`
3. `packages/config/` chứa: shared ESLint config, shared tsconfig base, shared Tailwind config
4. `apps/staff/` có Next.js 15 App Router, chạy được `pnpm dev` trên port 3001
5. `apps/booking/` có Next.js 15 App Router, chạy được `pnpm dev` trên port 3000
6. `apps/kiosk/` có Vite + React, chạy được `pnpm dev` trên port 3002
7. `pnpm -r build` chạy thành công, không có lỗi TypeScript
8. `.gitignore` đúng: bỏ `node_modules`, `.next`, `dist`, `.env*`

**Technical Notes:**
- Dùng `create-turbo` làm base template, sau đó customize
- Next.js apps: `"transpilePackages": ["@hotel/ui", "@hotel/types"]` trong next.config
- Package name convention: `@hotel/db`, `@hotel/api`, `@hotel/ui`, `@hotel/types`, `@hotel/config`

**Dependencies:** None  
**Estimate:** M

---

### E1-S2 — Set up PostgreSQL dev environment và Prisma schema

**As a** developer, **I want** a local PostgreSQL database with the full schema **so that** I can develop and test against real data.

**Acceptance Criteria:**
1. `docker-compose.yml` ở root khởi động PostgreSQL 16 + pgAdmin trên port 5432/5050
2. `packages/db/prisma/schema.prisma` chứa đầy đủ tất cả models từ `_bmad-output/architecture.md` Section 4
3. `pnpm --filter @hotel/db db:migrate` chạy migration thành công trên DB trống
4. `pnpm --filter @hotel/db db:generate` tạo Prisma Client không có error
5. `packages/db/prisma/seed.ts` tạo được: 1 Property (demo hotel), 3 RoomTypes, 10 Rooms, 2 RatePlans, 1 Admin Staff account, 5 Services, 1 TaxRate
6. `pnpm --filter @hotel/db db:seed` chạy thành công và data có trong DB
7. `.env.example` ở root chứa tất cả required env vars với placeholder values

**Technical Notes:**
- `DATABASE_URL="postgresql://hotel:hotel@localhost:5432/hotel_dev"`
- Seed admin: `admin@demo.hotel` / `Admin123!`
- Confirmation code format trong seed: `HTL-2025-SEED01`
- `packages/db/src/index.ts` export PrismaClient singleton

**Dependencies:** E1-S1  
**Estimate:** M

---

### E1-S3 — Implement Staff JWT authentication

**As a** staff member, **I want** to log in with email/password **so that** I can access the staff management system with appropriate permissions.

**Acceptance Criteria:**
1. `POST /api/auth/login` nhận email + password, trả về httpOnly cookie `staff_token` (JWT, 8h)
2. JWT payload: `{ staffId, role, propertyId, iat, exp }`
3. `POST /api/auth/logout` xóa cookie `staff_token`
4. `GET /api/auth/me` trả về staff info khi có valid token, 401 khi không có
5. Middleware `withStaffAuth(roles[])` bảo vệ protected routes — redirect `/login` nếu không auth
6. RBAC: request với role không đủ trả về 403, không redirect
7. "Remember me" checkbox: token expiry 30 ngày thay vì 8h
8. Sai password 5 lần liên tiếp: lockout 15 phút, trả về lỗi rõ ràng

**Technical Notes:**
- Dùng `jose` library, không dùng `jsonwebtoken` (edge runtime compat)
- `STAFF_JWT_SECRET` từ env, min 32 chars
- Password hash: `bcrypt` với cost 12
- Rate limiting login: `@upstash/ratelimit` 5 req/15min per IP

**Dependencies:** E1-S2  
**Estimate:** M

---

### E1-S4 — Set up tRPC API layer

**As a** developer, **I want** a type-safe tRPC API layer **so that** all apps can call backend procedures with full TypeScript inference.

**Acceptance Criteria:**
1. `packages/api/src/root.ts` export `appRouter` với sub-routers: `booking`, `room`, `guest`, `folio`, `housekeeping`, `property`, `staff`, `report`, `promoCode`, `service`, `kiosk`
2. `packages/api/src/context.ts` export `createContext` nhận `{ db, redis, auth, propertyId }`
3. `apps/staff/app/api/trpc/[trpc]/route.ts` mount tRPC handler cho staff app
4. Middleware `staffProcedure` — require valid staff JWT
5. Middleware `kioskProcedure` — require valid `X-Kiosk-Api-Key` header
6. Middleware `guestProcedure` — require valid guest JWT
7. `publicProcedure` — không require auth
8. Từ `apps/staff`, gọi `api.property.getConfig.query()` thành công (type-safe, no `any`)

**Technical Notes:**
- `packages/api` là pure TypeScript package, không phụ thuộc Next.js
- Dùng `@trpc/server@11` với `initTRPC.context<Context>().create()`
- Error formatter: log error server-side, trả về message an toàn cho client
- `apps/booking/app/api/trpc/[trpc]/route.ts` mount subset router (public + guest)

**Dependencies:** E1-S2, E1-S3  
**Estimate:** M

---

### E1-S5 — Set up Redis và Socket.io realtime

**As a** developer, **I want** WebSocket realtime infrastructure **so that** housekeeping updates và alerts broadcast ngay lập tức.

**Acceptance Criteria:**
1. Upstash Redis client khởi tạo từ `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN`
2. `apps/staff` dùng Next.js custom server (`server.ts`) với Socket.io 4.x mounted
3. Socket.io dùng Redis adapter (`@socket.io/redis-adapter`) cho horizontal scaling
4. Namespace `/staff` với auth middleware check staff JWT từ cookie
5. Namespace `/kiosk` với auth middleware check kiosk API key từ query param
6. Server emit `room:statusChanged` → tất cả clients trong cùng `propertyId` room nhận được
7. Client test (browser console): connect, subscribe, nhận event trong < 500ms
8. `pnpm dev` vẫn chạy bình thường với custom server

**Technical Notes:**
- Custom server: `apps/staff/server.ts` wrap Next.js handler
- Socket rooms: `property:{propertyId}` — tất cả staff của cùng property
- Events type-safe: export từ `packages/types/src/realtime.ts`
- Dev mode: có thể dùng in-memory adapter thay Redis để đơn giản hơn

**Dependencies:** E1-S3, E1-S4  
**Estimate:** M

---

### E1-S6 — Tạo shared UI component library

**As a** developer, **I want** shared UI components **so that** staff and booking apps have a consistent look and feel without duplicating code.

**Acceptance Criteria:**
1. `packages/ui` export các components: `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `Dialog`, `Toast`, `Table`, `Skeleton`
2. Mỗi component dùng shadcn/ui + Tailwind CSS 4.x
3. Components có TypeScript props interface đầy đủ, không có `any`
4. `packages/ui` build được (`tsc --noEmit` pass)
5. `apps/staff` import và render `<Button>` từ `@hotel/ui` thành công
6. Storybook (optional) hoặc demo page tại `apps/staff/app/ui-demo`

**Technical Notes:**
- `packages/ui/src/index.ts` export tất cả components
- Tailwind config trong `packages/config/tailwind/base.ts` — shared bởi cả 2 apps
- Font: Inter (Google Fonts hoặc local)
- Color palette: neutral gray + primary blue (configurable qua CSS variables)

**Dependencies:** E1-S1  
**Estimate:** S

---

### E1-S7 — File storage setup (Cloudflare R2) và upload utilities

**As a** staff admin, **I want** to upload room photos and files **so that** they're stored reliably and served fast to guests.

**Acceptance Criteria:**
1. R2 bucket configured, `@aws-sdk/client-s3` gọi được R2 API
2. `packages/api/src/lib/storage.ts` export: `uploadFile(buffer, key, contentType)`, `getSignedUrl(key, ttlSeconds)`, `deleteFile(key)`
3. Upload từ staff app: Admin upload ảnh phòng → lưu URL vào `RoomType.photoUrls`
4. Signed URL có TTL 1 giờ cho private files (invoices)
5. Public URL cho room photos (R2 public bucket hoặc custom domain)
6. File size limit: 10MB per image, validate trước khi upload

**Technical Notes:**
- R2 endpoint: `https://{accountId}.r2.cloudflarestorage.com`
- Key structure: `rooms/{roomTypeId}/{timestamp}-{filename}.webp`
- Resize + convert to WebP server-side: dùng `sharp` library
- `CLOUDFLARE_R2_*` env vars

**Dependencies:** E1-S4  
**Estimate:** S

---

## EPIC 2 — Core Business Logic

**Goal:** Implement toàn bộ business logic cốt lõi: availability engine, booking CRUD, folio, và staff auth workflows. Đây là backbone mà tất cả UI apps build trên.

---

### E2-S1 — Property và Room Type configuration (Admin CRUD)

**As an** admin, **I want** to configure the property, room types, and rooms **so that** the system reflects the real hotel.

**Acceptance Criteria:**
1. tRPC: `property.getConfig`, `property.update` (admin only)
2. tRPC: `roomType.list`, `roomType.create`, `roomType.update`, `roomType.toggleActive` (admin only)
3. tRPC: `room.list`, `room.create`, `room.update`, `room.toggleActive` (admin/manager)
4. tRPC: `amenity.list`, `amenity.create`, `amenity.update` (admin)
5. `roomType.create` yêu cầu: name, slug (unique per property), maxAdults, bedType, basePrice
6. `room.create` yêu cầu: number (unique per property), floor, roomTypeId
7. Slug auto-generated từ name nếu không provide, validate unique
8. Deactivated rooms không xuất hiện trong availability queries

**Technical Notes:**
- Validate slug: lowercase, dashes only, max 80 chars
- `room.list` filter: `{ status?, isActive?, floor?, roomTypeId? }`
- Batch create rooms: `room.bulkCreate([{ number, floor, roomTypeId }])`

**Dependencies:** E1-S4  
**Estimate:** M

---

### E2-S2 — Availability Engine

**As a** system, **I want** to accurately compute room availability **so that** no two bookings overlap for the same physical room.

**Acceptance Criteria:**
1. `availability.check({ propertyId, checkIn, checkOut, roomTypeId?, adults, children })` trả về danh sách RoomType còn phòng trống
2. Availability tính đúng: phòng không available nếu có booking với status `CONFIRMED` hoặc `CHECKED_IN` trong khoảng ngày, hoặc status là `OCCUPIED`/`MAINTENANCE`/`RESERVED`
3. Trả về count available per room type (không trả về room IDs cụ thể)
4. `availability.getCalendar({ propertyId, roomTypeId, month })` trả về map ngày → available/unavailable cho 3 tháng
5. Performance: query trả về < 200ms cho property có 300 phòng
6. Test: 2 bookings không overlap → cả 2 available. 1 booking tồn tại → count giảm 1

**Technical Notes:**
- Query: `Room.findMany` where `NOT exists` booking trong date range với status active
- Date range overlap: `checkIn < bookingCheckOut AND checkOut > bookingCheckIn`
- Index: `Room(propertyId, roomTypeId, status)`, `Booking(roomTypeId, checkInDate, checkOutDate, status)`
- Availability check cũng exclude rooms `isActive: false`

**Dependencies:** E2-S1  
**Estimate:** M

---

### E2-S3 — Rate Plan management và pricing calculation

**As a** manager, **I want** to manage rate plans with weekday/weekend pricing **so that** the system shows correct prices for each booking.

**Acceptance Criteria:**
1. tRPC: `ratePlan.list`, `ratePlan.create`, `ratePlan.update`, `ratePlan.delete` (admin/manager)
2. Rate plan áp dụng được cho: tất cả room types, hoặc specific room types
3. `pricing.calculate({ roomTypeId, ratePlanId?, checkIn, checkOut })` trả về breakdown: nights × price per night, total, discount nếu có
4. Weekday price (Mon–Thu) và weekend price (Fri–Sun) override base price nếu set
5. `isNonRefundable: true` flag hiển thị trong booking detail
6. Nếu không có rate plan nào, dùng `RoomType.basePrice` cho tất cả ngày

**Technical Notes:**
- Price calculation: iterate từng ngày trong range, check day-of-week, dùng weekday/weekend price
- `getEffectivePrice(roomType, ratePlan, date)` — pure function, testable
- Write unit tests cho pricing logic: weekday vs weekend, multi-week booking

**Dependencies:** E2-S1  
**Estimate:** S

---

### E2-S4 — Guest profile CRUD và search

**As a** front desk staff, **I want** to find and manage guest profiles **so that** I can look up guest history and add notes.

**Acceptance Criteria:**
1. `guest.findOrCreate({ email, firstName, lastName, phone?, nationality?, idNumber? })` — upsert by email
2. `guest.search({ query })` — full-text search trên name, email, phone, (decrypted) id number
3. `guest.getProfile({ guestId })` — trả về profile + last 10 bookings + notes
4. `guest.update({ guestId, ...fields })` — update contact info, tag
5. `guest.addNote({ guestId, content })` — thêm internal note với author + timestamp
6. `idNumber` được AES-256-GCM encrypt trước khi lưu, decrypt khi display
7. `guest.tag` = BLACKLIST → alert hiển thị khi booking được tạo cho guest đó

**Technical Notes:**
- Encryption key: `PII_ENCRYPTION_KEY` (32 bytes hex) từ env
- `packages/api/src/lib/crypto.ts`: `encrypt(plaintext)`, `decrypt(ciphertext)`
- Search: PostgreSQL `ILIKE` hoặc `pg_trgm` extension cho fuzzy search
- Không search trên encrypted `idNumber` — chỉ search trên name/email/phone

**Dependencies:** E1-S4  
**Estimate:** M

---

### E2-S5 — Booking CRUD (Staff-created)

**As a** front desk staff, **I want** to create and manage bookings **so that** I can handle phone reservations and walk-ins.

**Acceptance Criteria:**
1. `booking.create({ guestId, roomTypeId, ratePlanId?, checkIn, checkOut, adults, children, channel, specialRequests? })` — tạo booking với confirmation code `HTL-{YEAR}-{6CHAR}`
2. Validate: không overlap (gọi availability engine), checkOut > checkIn, adults ≥ 1
3. Auto-create Folio với room charge line items khi booking created
4. `booking.list({ propertyId, filters... })` — paginated list, 20/trang
5. Filters: status, checkIn range, checkOut range, roomTypeId, channel
6. Search: by confirmationCode, guestName, phone, roomNumber
7. `booking.getById({ bookingId })` — full detail với room, guest, folio summary, status history
8. `booking.cancel({ bookingId, reason })` — soft cancel, không xóa folio
9. `booking.update({ bookingId, ...editableFields })` — audit log ghi reason nếu đổi ngày/roomType

**Technical Notes:**
- Confirmation code: `nanoid(6).toUpperCase()` → `HTL-2025-A3F7K2`
- Room charge folio items: tạo 1 FolioItem per đêm, hoặc 1 item với tổng (chọn approach đơn giản hơn: 1 item tổng)
- `booking.cancel` emit `booking:cancelled` via Socket.io để dashboard update
- Audit log: mọi thay đổi booking ghi `AuditLog`

**Dependencies:** E2-S2, E2-S3, E2-S4  
**Estimate:** M

---

### E2-S6 — Room assignment và status management

**As a** front desk staff, **I want** to assign rooms to bookings and update room status **so that** the property runs smoothly.

**Acceptance Criteria:**
1. `room.assign({ bookingId, roomId })` — assign room, dùng optimistic locking trên `Room.version`
2. Concurrent assign: nếu 2 requests cùng lúc, chỉ 1 thành công, 1 trả lỗi "Phòng vừa được assign"
3. Chỉ assign phòng có status `CLEAN` hoặc `INSPECTED` (validate server-side)
4. Sau assign: phòng status → `RESERVED`, emit `room:statusChanged` WebSocket event
5. `room.updateStatus({ roomId, newStatus, note? })` — manual status change với validation flow
6. `room.setMaintenance({ roomId, note, estimatedDoneAt })` — set maintenance + log
7. `room.unassign({ bookingId, roomId })` — unassign trước khi check-in
8. `roomStatusLog` entry tạo cho mọi status transition

**Technical Notes:**
- Optimistic locking:
  ```typescript
  await db.$transaction(async tx => {
    const room = await tx.room.findFirst({ where: { id: roomId, version: currentVersion } })
    if (!room) throw new TRPCError({ code: 'CONFLICT', message: '...' })
    await tx.room.update({ where: { id: roomId }, data: { status: 'RESERVED', version: { increment: 1 } } })
  })
  ```
- Valid status transitions (enforce server-side): xem state machine trong architecture.md

**Dependencies:** E2-S5  
**Estimate:** M

---

### E2-S7 — Folio management và service charges

**As an** accountant, **I want** to manage guest folios with itemized charges **so that** billing is accurate and auditable.

**Acceptance Criteria:**
1. `folio.getByBooking({ bookingId })` — full folio với items, payments, totals
2. `folio.addServiceCharge({ folioId, serviceId?, description, quantity, unitPrice, chargeDate })` — thêm phí dịch vụ
3. `folio.voidItem({ folioItemId, reason })` — soft void, không xóa, ghi log
4. `folio.addPayment({ folioId, method, amount, reference? })` — ghi nhận thanh toán
5. Tax tự động tính và thêm vào folio khi create/update (theo `TaxRate` config)
6. `folio.settle({ folioId })` — đánh dấu settled, validate tổng payments ≥ tổng charges
7. `folio.reopen({ folioId, reason })` — manager chỉ, unsettled folio + audit log
8. Discount: `folio.addDiscount({ folioId, type, value, reason })` — validate role (>10% cần Manager)

**Technical Notes:**
- Folio total = Σ(non-voided items amount) - Σ(payments amount)
- Tax calculation: tạo FolioItem type=TAX tự động khi add room charge hoặc service
- Service catalog: `service.list({ propertyId })` cho dropdown
- `folio.settle` cần room status check: chỉ settle được khi booking `CHECKED_OUT`

**Dependencies:** E2-S5  
**Estimate:** M

---

### E2-S8 — Staff check-in và check-out (manual flow)

**As a** front desk staff, **I want** to manually check-in and check-out guests **so that** I can assist guests who don't use the kiosk.

**Acceptance Criteria:**
1. `booking.checkIn({ bookingId })` — validate: phòng assigned, trong check-in window, booking CONFIRMED
2. Sau check-in: booking → `CHECKED_IN`, room → `OCCUPIED`, ghi `actualCheckIn` timestamp (UTC)
3. Gửi check-in confirmation email qua Resend
4. `booking.checkOut({ bookingId })` — validate: booking CHECKED_IN, folio settled hoặc settle now
5. Sau check-out: booking → `CHECKED_OUT`, room → `DIRTY`, ghi `actualCheckOut` timestamp
6. Emit WebSocket: `booking:checkedIn` và `booking:checkedOut` để dashboard refresh
7. `booking.markNoShow({ bookingId })` — soft mark, không trigger room change

**Technical Notes:**
- Check-in window validation: `actualCheckIn >= checkInDate + checkInHour (property config)`
- Resend email: dùng template từ `property.emailTemplate` hoặc default
- Check-out không bắt buộc folio settled trong demo mode — chỉ warn
- Audit log cho cả check-in và check-out

**Dependencies:** E2-S6, E2-S7  
**Estimate:** M

---

## EPIC 3 — Staff Management Web (UI)

**Goal:** Build toàn bộ giao diện web cho nhân viên và quản lý, kết nối với tRPC API từ Epic 2.

---

### E3-S1 — Staff app shell: layout, navigation, login page

**As a** staff member, **I want** a clean app shell with role-based navigation **so that** I see only the tools relevant to my role.

**Acceptance Criteria:**
1. `/login` — form login email/password, error message khi sai, redirect đến `/dashboard` khi thành công
2. Authenticated layout: sidebar trái + main content + header với user info + logout
3. Sidebar navigation items theo role (xem Role Matrix trong prd-staff.md)
4. Housekeeping role: chỉ thấy "Dashboard" và "Housekeeping" trong nav
5. Unauthorized route: hiển thị trang "Bạn không có quyền truy cập" (không redirect về login)
6. Mobile: sidebar collapse thành hamburger menu
7. Loading skeleton khi navigate giữa các trang
8. `/api/auth/logout` → xóa cookie → redirect `/login`

**Technical Notes:**
- Next.js App Router: `(auth)/login/page.tsx`, `(dashboard)/layout.tsx`
- Server Component layout: đọc auth từ cookie server-side, redirect nếu không có
- Active nav item: highlight dựa trên current pathname
- Dùng `@hotel/ui` Button, Input cho login form

**Dependencies:** E1-S3, E1-S6  
**Estimate:** S

---

### E3-S2 — Front desk dashboard với realtime alerts

**As a** front desk staff, **I want** a dashboard showing today's operations at a glance **so that** I can manage the day without hunting for information.

**Acceptance Criteria:**
1. Widget "Arrivals hôm nay": số tổng, đã check-in (xanh), còn lại (cam). Click → danh sách
2. Widget "Departures hôm nay": tương tự. Overdue checkouts highlight đỏ
3. Widget "Tình trạng phòng": 4 số: Occupied, Clean/Available, Dirty, Maintenance (màu sắc theo NFR-S-07)
4. Widget "Alerts": badge đỏ khi có: checkout quá giờ, phòng dirty trước check-in 2h, booking chưa assign phòng
5. Widget "Occupancy forecast": bar chart 7 ngày tới (dùng Recharts)
6. Dashboard auto-refresh mỗi 60 giây (polling)
7. WebSocket: khi nhận `room:statusChanged` → room status widget cập nhật tức thì
8. Housekeeping dashboard: chỉ hiển thị danh sách phòng assign cho mình hôm nay

**Technical Notes:**
- Recharts hoặc Tremor cho bar chart
- Socket.io client: `useSocket()` custom hook trong staff app
- `report.getDashboard({ date, propertyId })` tRPC query
- Arrivals list: click widget → `/bookings?filter=arriving-today`

**Dependencies:** E2-S8, E3-S1, E1-S5  
**Estimate:** M

---

### E3-S3 — Booking management: list, detail, create, edit, cancel

**As a** front desk staff, **I want** to view and manage all bookings **so that** I can handle reservations from phone, walk-in, or OTA.

**Acceptance Criteria:**
1. `/bookings` — paginated table, 20 rows/trang, sortable by checkIn, createdAt
2. Filters: date range (checkIn), status dropdown, roomType dropdown, channel dropdown
3. Search: real-time search bar (debounce 300ms) theo name, phone, confirmationCode, roomNumber
4. Booking row: confirmation code, guest name, room type, check-in/out, status badge, channel badge
5. `/bookings/new` — form tạo booking: guest search/create inline, date picker (availability real-time), rate plan select
6. `/bookings/[id]` — full detail: guest info, assigned room, folio summary, status history, action buttons
7. Action buttons theo status: Assign Room / Check-in / Check-out / Cancel (với reason dialog)
8. Cancel: confirm dialog với reason input, soft cancel, không xóa folio

**Technical Notes:**
- Date picker: `react-day-picker` hoặc `shadcn Calendar`
- Availability indicator khi chọn ngày: "3 phòng còn trống" dưới date picker
- Blacklist guest alert: banner đỏ trên booking detail nếu `guest.tag === 'BLACKLIST'`
- Booking history: timeline component hiển thị audit log events

**Dependencies:** E2-S5, E2-S6, E3-S1  
**Estimate:** M

---

### E3-S4 — Room management page

**As a** front desk staff, **I want** to see all rooms and their current status **so that** I can manage room assignments and maintenance.

**Acceptance Criteria:**
1. `/rooms` — grid view, mỗi phòng là 1 card màu theo status (NFR-S-07)
2. Card hiển thị: số phòng, tầng, loại phòng, status badge, guest name nếu occupied
3. Filter theo tầng: tabs "Tất cả", "Tầng 1", "Tầng 2"...
4. Click card → side panel (hoặc modal): room detail, current booking nếu có, action buttons
5. Actions: Change Status (dropdown với valid transitions), Set Maintenance (form với note + date)
6. Maintenance rooms: card có icon công cụ, tooltip hiện lý do và estimated done date
7. Lịch sử phòng: xem 30 ngày gần nhất trong modal

**Technical Notes:**
- Status màu sắc: green=CLEAN/INSPECTED, red=DIRTY, gray=OCCUPIED, orange=MAINTENANCE, purple=CLEANING, yellow=RESERVED
- Status transition validation: client hiển thị chỉ valid transitions (theo state machine)
- Realtime: WebSocket `room:statusChanged` → card cập nhật màu ngay

**Dependencies:** E2-S6, E3-S1, E1-S5  
**Estimate:** M

---

### E3-S5 — Housekeeping Kanban board

**As a** housekeeping staff, **I want** to see and update room cleaning status on my phone **so that** I can work efficiently without paper.

**Acceptance Criteria:**
1. `/housekeeping` — Kanban 4 cột: Dirty, Cleaning, Clean, Inspected
2. Card phòng: số phòng, tầng, loại phòng. Nếu có check-in sắp tới < 2h: badge cam "URGENT"
3. Manager/Front Desk: có nút "Assign" trên card, dropdown chọn housekeeping staff
4. Housekeeping staff: chỉ thấy phòng assign cho mình, không thấy phòng của người khác
5. Cập nhật trạng thái: swipe card (mobile) hoặc click button → transition hợp lệ
6. Realtime: khi status thay đổi từ bất kỳ thiết bị nào → board cập nhật ngay
7. Mobile layout: full-width cards, 44px min touch target, không cần sidebar
8. Manager view: hiển thị timer từ khi phòng bắt đầu cleaning (duration indicator)

**Technical Notes:**
- Dùng `@dnd-kit/sortable` cho drag-and-drop assign (desktop)
- Mobile swipe: cân nhắc `@use-gesture/react` hoặc simple tap-to-cycle
- Socket.io: listen `room:statusChanged`, update local state (React Query invalidation)
- Route mobile-first: `/housekeeping` responsive, không cần route riêng (OQ-S-01)

**Dependencies:** E2-S6, E3-S1, E1-S5  
**Estimate:** M

---

### E3-S6 — Guest profile pages

**As a** front desk staff, **I want** to search and view guest profiles with history **so that** I can provide personalized service.

**Acceptance Criteria:**
1. `/guests` — search page với search bar, debounce 300ms, hiển thị tối đa 20 kết quả
2. Kết quả: avatar (initials), tên, email, phone, tag (VIP badge vàng, Blacklist badge đỏ), số lần ở
3. `/guests/[id]` — profile: thông tin cá nhân, tags, booking history (10 gần nhất), internal notes
4. Edit profile: inline form cho contact info, tag dropdown (Manager để đổi tag)
5. Add note: textarea + submit, notes hiển thị theo chronological order với author + timestamp
6. Notes không có nút delete (chỉ Manager thấy delete icon)
7. Booking history rows: confirmation code, dates, room type, status — click navigate đến booking detail

**Technical Notes:**
- Search API: `guest.search({ query })` — gọi ngay khi type 2+ chars
- VIP tag: banner vàng nhẹ trên top của profile
- Blacklist tag: banner đỏ + warning message "Cần xác nhận Manager khi tạo booking"
- Avatar: initials từ firstName + lastName, màu random từ hash

**Dependencies:** E2-S4, E3-S1  
**Estimate:** M

---

### E3-S7 — Folio và payment management pages

**As an** accountant, **I want** to manage guest folios and record payments **so that** billing is complete and invoices can be generated.

**Acceptance Criteria:**
1. Folio tab trong booking detail: danh sách items, totals, payment history, balance remaining
2. "Add charge" button: chọn service từ catalog hoặc nhập free-text, qty, unit price, date
3. "Void charge" button (đỏ): reason input dialog, soft void với strikethrough trong list
4. "Add payment" button: method dropdown, amount, reference, note
5. Balance remaining nổi bật: xanh nếu = 0, đỏ nếu > 0, xám nếu credit
6. "Settle folio" button (Manager+): disable nếu balance > 0
7. "Export Invoice PDF" button: download `invoice-{confirmationCode}.pdf`
8. Discount button: type (% hoặc fixed), amount, reason — validate role 10% rule

**Technical Notes:**
- PDF: `@react-pdf/renderer`, template lấy `property.invoiceTemplate` hoặc default
- PDF content: property logo/info, guest info, booking info, itemized charges, totals, payment summary
- Folio items sorted by: TAX items ở dưới cùng, discounts trước tax
- "Reopen folio" button (Manager): chỉ hiện khi `folio.status === 'SETTLED'`

**Dependencies:** E2-S7, E3-S1, E1-S7  
**Estimate:** M

---

### E3-S8 — Reports pages

**As a** manager, **I want** to view occupancy and revenue reports **so that** I can track hotel performance.

**Acceptance Criteria:**
1. `/reports/occupancy` — date range picker, % occupancy per day (bar chart), table below
2. `/reports/revenue` — tổng revenue phòng + dịch vụ, ADR, RevPAR. Line chart theo ngày/tuần/tháng
3. `/reports/channels` — pie chart và table: booking count + revenue per channel
4. `/reports/arrivals-departures` — date picker → danh sách arrivals + departures cho ngày đó
5. Mọi report có nút "Export CSV" → download file
6. Revenue report có thêm "Export Excel (.xlsx)" dùng `exceljs`
7. Date range picker: presets (Hôm nay, Tuần này, Tháng này, Tháng trước)
8. So sánh kỳ trước: toggle "Compare" → hiển thị 2 lines trên chart

**Technical Notes:**
- Recharts cho tất cả charts (line, bar, pie)
- `report.getOccupancy({ from, to, propertyId })`, `report.getRevenue(...)`, etc.
- CSV export: tính toán server-side, stream response
- Excel: `exceljs` library, tạo workbook server-side
- Reports chỉ cho Accountant + Manager + Admin (RBAC middleware)

**Dependencies:** E2-S7, E3-S1  
**Estimate:** M

---

### E3-S9 — Admin settings pages

**As an** admin, **I want** settings pages to configure the property, staff, and catalog **so that** the system reflects our hotel's specifics.

**Acceptance Criteria:**
1. `/settings/property` — edit property info (name, address, check-in/out hours, timezone, currency, logo upload)
2. `/settings/room-types` — list + create + edit room types (với multi-image upload)
3. `/settings/rooms` — list + create/bulk-create + toggle active
4. `/settings/rate-plans` — CRUD rate plans với weekday/weekend pricing
5. `/settings/services` — CRUD service catalog
6. `/settings/taxes` — CRUD tax rates
7. `/settings/promo-codes` — CRUD promo codes với expiry, max uses, room type restrictions
8. `/settings/staff` — list staff, create account, change role, deactivate
9. Logo upload: S3/R2 upload, preview ngay, max 2MB
10. Room type photo upload: multi-file, preview, reorder, max 10 ảnh/loại

**Technical Notes:**
- Image upload: server action → `storage.uploadFile()` → save URL to DB
- `sharp` resize ảnh trước khi upload: max 1920px wide, convert to WebP
- Staff create: generate temp password, send email với reset link
- Deactivate staff: invalidate existing JWT (Redis blacklist)

**Dependencies:** E2-S1, E2-S3, E3-S1, E1-S7  
**Estimate:** L → **Split thành E3-S9a** (property + room types + rooms, M) và **E3-S9b** (rate plans + services + taxes + promos + staff, M)

---

## EPIC 4 — Kiosk App

**Goal:** Build Kiosk PWA cho phép khách tự check-in, check-out, và đặt phòng walk-in mà không cần nhân viên.

---

### E4-S1 — Kiosk PWA setup và home screen

**As a** hotel, **I want** a kiosk app that runs in browser fullscreen **so that** guests can self-serve at the lobby.

**Acceptance Criteria:**
1. Vite + React app build ra PWA với `vite-plugin-pwa`
2. `manifest.json`: `display: standalone`, `theme_color`, `background_color`, `start_url: /kiosk`
3. Home screen hiển thị 3 nút lớn: "Tôi đã đặt phòng", "Đặt phòng ngay", "Trả phòng"
4. Idle screen: sau 5 phút không touch → full-screen background ảnh + "Chạm để bắt đầu"
5. Trong luồng: sau 3 phút inactive → countdown 30s → auto reset về Home (xóa state)
6. Language toggle (VI/EN) góc trên phải — switch tức thì, không reload
7. "Gọi nhân viên" button góc dưới phải — visible mọi lúc
8. Responsive: layout đúng từ 10" (portrait) đến 27" (landscape)

**Technical Notes:**
- Kiosk API key: lấy từ `VITE_KIOSK_API_KEY` env (set khi deploy per property)
- `VITE_STAFF_API_URL`: URL của staff app (nơi kiosk gọi API)
- Language: React context + `react-i18next` (hoặc simple JSON map)
- Idle timer: `useIdleTimer` hook với `react-idle-timer`
- Font: Inter, min 18px body, 28px+ headings

**Dependencies:** E1-S1, E1-S4  
**Estimate:** M

---

### E4-S2 — Kiosk check-in flow

**As a** guest with a booking, **I want** to check-in at the kiosk **so that** I get my room without waiting at reception.

**Acceptance Criteria:**
1. Screen 1: input mã xác nhận (virtual keyboard on-screen) hoặc tab "Quét QR" (camera)
2. QR scan: nếu camera available → show video preview, decode QR → auto-fill code
3. Screen 2: hiển thị booking info (tên, ngày, loại phòng, số khách) — "Đây có phải là bạn không?"
4. Screen 3: xác nhận danh tính — nhập họ tên (case-insensitive, bỏ dấu normalize)
5. Nếu tên không khớp: "Thông tin không khớp. Vui lòng liên hệ lễ tân" → back button
6. Screen 4: acquire Redis lock (E1-S5 queue) → auto-assign phòng clean → hiển thị số phòng, tầng, WiFi, key card hướng dẫn
7. Nếu không có phòng clean: "Phòng chưa sẵn sàng. Vui lòng đến quầy lễ tân"
8. Screen 5: "Check-in thành công" → gửi email xác nhận → auto reset sau 30s

**Technical Notes:**
- QR: `html5-qrcode` library, camera permission request khi click tab
- Name normalization: `diacritics.remove(name).toLowerCase()`
- API: `kiosk.checkInByCode({ confirmationCode, guestName })` → staff app tRPC
- Redis lock: acquire trước khi assign, release sau khi xong (hoặc timeout 60s)
- Nếu lock failed: "Đang xử lý, vui lòng đợi 30 giây"

**Dependencies:** E2-S8, E4-S1  
**Estimate:** M

---

### E4-S3 — Kiosk walk-in booking flow

**As a** walk-in guest, **I want** to search rooms and book directly at the kiosk **so that** I can check-in immediately without going to reception.

**Acceptance Criteria:**
1. Screen 1: date picker (check-in mặc định today, check-out mặc định tomorrow), adults/children counter
2. Validate: check-in chỉ được today (vì `walkinMaxDays=0`), check-out tối thiểu ngày mai
3. Screen 2: danh sách room types còn trống — card với ảnh, tên, giá/đêm, tổng giá, tiện nghi icons
4. Nếu không có phòng: "Không có phòng trống. Vui lòng liên hệ lễ tân"
5. Screen 3: form thông tin khách — họ tên (bắt buộc), CCCD/passport (optional), SĐT (bắt buộc), email (optional)
6. Screen 4: tóm tắt booking + tổng tiền + nút "Xác nhận Thanh toán"
7. Screen 5: demo payment (số tiền, nút "Thanh toán thành công" / "Thử lại")
8. Sau thành công: tạo booking + gửi email → tự động sang luồng check-in (E4-S2 screen 4)

**Technical Notes:**
- Availability call: `availability.check(...)` gọi booking app API
- Create booking: `kiosk.walkInBook(...)` gọi staff app tRPC (channel: KIOSK)
- Guest `findOrCreate` bằng SĐT hoặc email
- Demo payment: fake 2s delay + success animation
- Form virtual keyboard: màn hình cảm ứng dùng on-screen keyboard của OS (không custom)

**Dependencies:** E2-S2, E2-S5, E4-S2  
**Estimate:** M

---

### E4-S4 — Kiosk check-out flow

**As a** guest checking out, **I want** to settle my bill and check-out at the kiosk **so that** I don't have to wait at reception.

**Acceptance Criteria:**
1. Screen 1: nhập số phòng + họ tên, hoặc confirmation code
2. Screen 2: hiển thị folio itemized (phí phòng, dịch vụ, thuế, tổng)
3. Scroll: nếu danh sách dài → scrollable với scroll indicator
4. Nút "Có phí không đúng?" → hiển thị message "Vui lòng liên hệ lễ tân"
5. Screen 3: xác nhận tổng tiền + nút "Thanh toán"
6. Screen 4: demo payment (tương tự E4-S3)
7. Sau thành công: `booking.checkOut(...)` → phòng → DIRTY → emit WebSocket
8. Screen 5: "Check-out thành công" + nút "Gửi biên lai qua email" (nhập email nếu chưa có) + "In biên lai"
9. In biên lai (Windows only): gọi print API tới IP printer hoặc USB via WebUSB

**Technical Notes:**
- Lookup: `kiosk.lookupForCheckout({ roomNumber, guestName })` hoặc `{ confirmationCode }`
- Print: `window.print()` với CSS print stylesheet (đơn giản nhất) hoặc IP printer fetch
- Email receipt: Resend với receipt template (text format, không PDF)
- Room number input: virtual numpad (chỉ số) + text input cho tên

**Dependencies:** E2-S7, E2-S8, E4-S1  
**Estimate:** M

---

### E4-S5 — Kiosk "Gọi nhân viên" integration

**As a** guest, **I want** to call for staff help from the kiosk **so that** I get assistance when confused.

**Acceptance Criteria:**
1. "Gọi nhân viên" button: visible ở góc màn hình mọi screen (fixed position)
2. Click → confirm dialog "Nhân viên sẽ đến hỗ trợ bạn. Xác nhận?" + countdown 5s auto-confirm
3. Sau confirm: gọi `alert.triggerCallForHelp({ kioskId })` → staff app
4. Staff dashboard: alert mới xuất hiện trong widget Alerts với timestamp và kiosk location
5. Staff app: âm thanh thông báo khi nhận WebSocket event `alert:callForHelp` (audio beep)
6. Kiosk: hiển thị "Nhân viên đang trên đường đến. Cảm ơn bạn!" và timer
7. Alert dismiss: front desk click "Đã xử lý" trên dashboard

**Technical Notes:**
- Socket.io emit từ server → `/staff/{propertyId}` namespace
- Audio: `new Audio('/sounds/alert.mp3').play()` — một file âm thanh đơn giản
- Kiosk ID: có thể là device name (hostname) hoặc config từ env `VITE_KIOSK_ID`
- Alert model trong DB không cần (ephemeral qua WebSocket), chỉ log nếu cần audit

**Dependencies:** E1-S5, E4-S1, E3-S2  
**Estimate:** S

---

## EPIC 5 — Online Booking Portal

**Goal:** Build website công khai cho phép khách tìm kiếm và đặt phòng trực tuyến. Pay at property (không thu tiền upfront).

---

### E5-S1 — Booking portal setup với i18n và SEO base

**As a** developer, **I want** the booking portal configured with i18n and SEO infrastructure **so that** the site ranks on Google in both Vietnamese and English.

**Acceptance Criteria:**
1. `apps/booking` Next.js 15 App Router với `next-intl`, URL prefix `/vi/...` và `/en/...`
2. Middleware: redirect `/` → `/vi/` dựa trên `Accept-Language` header (fallback: vi)
3. Language switcher: dropdown trong header, chuyển locale giữ current path
4. `generateMetadata()` trả về `title`, `description`, `openGraph`, `alternates` cho tất cả pages
5. `sitemap.ts` tự generate, gồm room type pages và static pages
6. `robots.txt` cho phép crawl tất cả public pages
7. Schema.org Hotel markup trên homepage, HotelRoom markup trên room detail

**Technical Notes:**
- `messages/vi.json`, `messages/en.json` — flat keys: `"booking.step1.title": "Xác nhận lựa chọn"`
- Open Graph image: mặc định là property logo; per-room-type: first photo
- Canonical URL: `/vi/rooms/deluxe` → `<link rel="alternate" hreflang="en" href="/en/rooms/deluxe">`
- `next-sitemap` hoặc custom `sitemap.ts` (App Router built-in)

**Dependencies:** E1-S1, E2-S1  
**Estimate:** S

---

### E5-S2 — Homepage và trang thông tin tĩnh

**As a** potential guest, **I want** to see the hotel homepage with key information **so that** I can decide to book.

**Acceptance Criteria:**
1. `/[locale]/` — homepage với hero (ảnh từ R2), search widget, featured rooms section
2. Search widget: date picker (check-in/out), adults/children counter, "Tìm phòng" button
3. Featured rooms section: 3 room types có `isFeatured: true`, card với ảnh + tên + giá từ
4. `/[locale]/about` — mô tả khách sạn từ `property.description`
5. `/[locale]/amenities` — danh sách amenities từ property config (optional per OQ-B-03)
6. `/[locale]/contact` — địa chỉ, phone, email, link Google Maps (không embed, OQ-B-04), form liên hệ
7. Form liên hệ: gửi email qua Resend đến `property.email`
8. Footer: navigation links + contact info + copyright

**Technical Notes:**
- Homepage: Server Component, fetch property data + featured rooms
- Hero image: `next/image` với R2 URL, priority=true (LCP optimization)
- Search widget: Client Component (form state), navigate đến `/rooms?checkin=...`
- `generateStaticParams` cho static pages

**Dependencies:** E5-S1, E2-S1  
**Estimate:** M

---

### E5-S3 — Room listing và detail pages

**As a** guest, **I want** to browse available rooms with photos and details **so that** I can make an informed booking decision.

**Acceptance Criteria:**
1. `/[locale]/rooms` — listing page, filter từ search params (checkin, checkout, adults, children)
2. Room type card: ảnh slideshow (3 ảnh), tên, diện tích, sức chứa, bed type, tiện nghi icons, giá/đêm, tổng giá, "Chọn phòng" button
3. "Hết phòng" card: mờ, badge đỏ, không có "Chọn phòng" button
4. Filter sidebar: price range slider, capacity, bed type, amenities checkboxes
5. Sort: Giá tăng dần / Giá giảm dần / Diện tích
6. `/[locale]/rooms/[slug]` — room detail page (SSR/ISR)
7. Photo gallery: lightbox với tối đa 20 ảnh, lazy loading
8. Availability calendar: 3 tháng tới, blocked dates grayed out
9. Sticky booking widget (desktop) / bottom bar (mobile): giá + nút "Đặt ngay"

**Technical Notes:**
- Room listing: Server Component, call `availability.check` server-side, pass data to client
- ISR for room detail: `revalidate: 3600` (1 giờ), revalidate on demand khi admin cập nhật
- Photo gallery: `yet-another-react-lightbox` hoặc custom với `next/image`
- Availability calendar: client-side call `availability.getCalendar` (lazy load)
- LCP: first room image là `priority` image

**Dependencies:** E5-S1, E2-S2, E2-S3  
**Estimate:** M

---

### E5-S4 — Booking funnel (4 bước)

**As a** guest, **I want** to complete a booking in 4 clear steps **so that** I know exactly what I'm committing to.

**Acceptance Criteria:**
1. `/[locale]/book?roomTypeId=...&checkin=...&checkout=...&adults=...` — URL-driven funnel
2. Progress bar hiển thị 4 bước: Xác nhận → Thông tin → Xem lại → Xác nhận đặt
3. Bước 1: tóm tắt phòng + rate options (nếu có nhiều plans) + promo code field
4. Promo code validate: `promoCode.validate({ code, roomTypeId, amount })` — hiển thị discount ngay
5. Bước 2: form thông tin khách (tên, email, phone, quốc tịch, CCCD, giờ đến, special requests)
6. Nếu đã đăng nhập: pre-fill từ guest profile, checkbox "Lưu cho lần sau"
7. Bước 3: summary đầy đủ + cancellation policy + checkbox đồng ý T&C
8. Bước 4: "Confirm booking" button (KHÔNG phải payment — pay at property)
9. Sau submit: availability re-check server-side → tạo booking → redirect confirmation page

**Technical Notes:**
- Funnel state: URL params + server state (không dùng localStorage)
- Availability re-check tại Bước 4 submit: tránh booking khi phòng vừa hết
- `booking.createOnline(...)` — tạo booking với channel=DIRECT, không có payment
- Booking lock: khi submit bước 4, lock 30 phút (BR-B-07, OQ-B-07), tự release
- Guest create: `findOrCreate` by email — tạo account tạm nếu chưa có

**Dependencies:** E5-S3, E2-S5  
**Estimate:** M

---

### E5-S5 — Booking confirmation page và email

**As a** guest, **I want** to receive a clear confirmation with QR code **so that** I can check-in at the kiosk easily.

**Acceptance Criteria:**
1. `/[locale]/booking/[confirmationCode]` — confirmation page (accessible ngay sau đặt phòng)
2. Confirmation number nổi bật (copy button), QR code image (data: `{"code":"HTL-...","v":1}`)
3. Tóm tắt: phòng, ngày, khách, cancellation policy
4. "Thêm vào Google Calendar" link (ICS format)
5. "In trang này" → browser print với CSS @media print tối giản
6. Link "Quản lý booking" → My Bookings (nếu đã login) hoặc lookup form
7. Email confirmation gửi qua Resend ngay sau khi booking tạo thành công
8. Email content: confirmation code lớn + QR code image + booking summary + cancellation policy + địa chỉ khách sạn

**Technical Notes:**
- QR code: generate server-side với `qrcode` library → base64 PNG → embed trong email
- ICS file: generate với `ics` library
- Email template: HTML inline styles (email client compat), per-property template nếu set
- Confirmation page: Server Component, fetch booking by code (public query — chỉ trả về safe fields)

**Dependencies:** E5-S4, E2-S5  
**Estimate:** M

---

### E5-S6 — Guest account: auth và my bookings

**As a** registered guest, **I want** to have an account to manage my bookings **so that** I don't need to save confirmation emails.

**Acceptance Criteria:**
1. `/[locale]/register` — form đăng ký (email, password, tên), email verification link
2. `/[locale]/login` — form đăng nhập, remember me (30 ngày), "Quên mật khẩu" link
3. `/[locale]/forgot-password` và `/[locale]/reset-password/[token]` — email reset flow (24h link)
4. Guest checkout: đặt phòng không cần tài khoản (sau confirmation: prompt "Tạo tài khoản để quản lý dễ hơn")
5. `/[locale]/my-bookings` — 3 tabs: Sắp tới / Đã ở / Đã hủy. Mỗi booking: code, dates, room, status
6. Click booking → modal hoặc page: full detail, QR code, cancellation policy, "Hủy" button
7. Hủy booking: confirm dialog, gọi `booking.cancelByGuest(...)`, gửi email xác nhận hủy
8. `/[locale]/my-bookings/lookup` — nhập code + email → xem booking (không cần đăng nhập)

**Technical Notes:**
- Guest JWT: `GUEST_JWT_SECRET`, httpOnly cookie `guest_token`, 30d
- Email verify: `crypto.randomBytes(32).toString('hex')` token, lưu DB với expiry 24h
- `booking.cancelByGuest`: validate cancellation window, chỉ cancel CONFIRMED status
- Guest lookup (no auth): chỉ trả về public booking fields (no folio details)

**Dependencies:** E5-S5, E2-S5  
**Estimate:** M

---

### E5-S7 — Promo code system

**As a** manager, **I want** to create and manage promo codes **so that** I can run promotional campaigns.

**Acceptance Criteria:**
1. Admin tạo promo code trong `/settings/promo-codes`: code, discountType (% hoặc fixed), discountValue, validFrom, validUntil, maxUses (optional), roomTypeIds (optional)
2. `promoCode.validate({ code, roomTypeId, totalAmount, propertyId })` — server-side validation
3. Validate checks: tồn tại, active, chưa hết hạn, chưa vượt maxUses, áp dụng cho roomType này
4. Trả về: `{ valid: true, discountAmount: number, promoName: string }` hoặc lỗi cụ thể
5. Booking funnel: promo field ở Bước 1, call validate API, hiển thị discount ngay
6. Khi booking tạo: `usedCount++` atomically (dùng `$transaction`)
7. Admin xem usage: số lần dùng / maxUses, danh sách bookings dùng code

**Technical Notes:**
- `usedCount` increment trong cùng transaction với booking creation để tránh race condition
- Không expose danh sách promo codes qua public API (NFR-B-19)
- Code validation: case-insensitive (convert to uppercase trước khi so sánh)
- Promo discount FolioItem: tạo tự động khi booking confirmed

**Dependencies:** E2-S5, E3-S9  
**Estimate:** M

---

## EPIC 6 — Integration & Advanced Features

**Goal:** Hoàn thiện các tính năng tích hợp còn lại: email templates, PDF invoices, và WebSocket alerts.

---

### E6-S1 — Per-property email template system

**As an** admin, **I want** to customize the email templates for my hotel **so that** confirmation emails match my brand.

**Acceptance Criteria:**
1. Admin edit email template trong `/settings/property`: WYSIWYG hoặc HTML editor
2. Template variables: `{{guestName}}`, `{{confirmationCode}}`, `{{checkIn}}`, `{{checkOut}}`, `{{roomType}}`, `{{propertyName}}`, `{{propertyAddress}}`, `{{qrCodeImage}}`
3. "Preview" button: render template với sample data và hiển thị
4. "Restore default" button: xóa custom template, dùng lại default
5. Tất cả email types (confirmation, check-in, cancellation, receipt) dùng cùng base template với content khác nhau
6. Default template: professional HTML email với property name, hotel colors (CSS variables)

**Technical Notes:**
- Template engine: `handlebars` (mustache syntax)
- Template lưu trong `property.emailTemplate` (HTML string)
- QR code embed: base64 inline image trong email (`<img src="data:image/png;base64,..."`)
- Resend sender: `noreply@hotel-system.com` (hoặc custom domain khi production)

**Dependencies:** E2-S8, E3-S9  
**Estimate:** M

---

### E6-S2 — Per-property invoice PDF template

**As an** accountant, **I want** professional invoices with the hotel's branding **so that** corporate guests have proper documentation.

**Acceptance Criteria:**
1. Invoice PDF dùng `@react-pdf/renderer`, include: property logo, tên, địa chỉ, tax code (nếu có)
2. Guest info section: tên, email, phone, nationality
3. Booking info: confirmation code, room type, dates, nights
4. Itemized charges table: description, qty, unit price, amount
5. Tax breakdown và tổng
6. Payment history nếu đã thanh toán một phần
7. Footer: thank you message + property contact
8. Admin có thể cấu hình: tax code/VAT number, bank account info (cho chuyển khoản)

**Technical Notes:**
- PDF generate server-side: Next.js API route trả về `application/pdf` stream
- `@react-pdf/renderer`: `<Document>`, `<Page>`, `<View>`, `<Text>`, `<Image>`
- Logo: fetch từ R2, embed as base64 trong PDF
- Font: embed Inter hoặc Roboto (PDF cần embed font)
- Property tax/bank info: thêm fields vào `Property` schema nếu cần

**Dependencies:** E3-S7, E1-S7  
**Estimate:** M

---

### E6-S3 — Housekeeping realtime + Call-for-help audio alerts

**As a** front desk staff, **I want** audio alerts when a guest calls for help **so that** I can respond immediately even when not looking at the screen.

**Acceptance Criteria:**
1. Staff app play audio beep khi nhận WebSocket `alert:callForHelp` event
2. Audio beep: 3 lần, interval 1s, sau đó stop (không loop mãi)
3. Alert toast hiển thị: "Khách cần hỗ trợ tại Kiosk [ID]" với timestamp
4. Toast persists (không tự dismiss) cho đến khi staff dismiss thủ công
5. Dashboard Alerts widget: show active call-for-help alerts với "Đã xử lý" button
6. Click "Đã xử lý": emit `alert.dismiss(alertId)` → alert biến mất khỏi tất cả screens
7. Multiple concurrent alerts: stack, dismiss từng cái

**Technical Notes:**
- Audio: `AudioContext` + `OscillatorNode` (không cần file âm thanh — generate programmatically)
- Browser autoplay policy: audio chỉ play sau user interaction (1 click đầu tiên). Hiển thị "🔔 Click để bật thông báo âm thanh" khi load
- Alert tracking: in-memory trên server (Redis `HSET alerts:{propertyId} alertId timestamp`), không cần DB
- Dismiss: Redis `HDEL`, emit `alert:dismissed` WebSocket event

**Dependencies:** E1-S5, E3-S2, E4-S5  
**Estimate:** M

---

### E6-S4 — Password reset và staff onboarding flow

**As an** admin, **I want** staff accounts to be created with secure onboarding **so that** new staff can set their own password safely.

**Acceptance Criteria:**
1. Admin tạo staff account → system tạo temp secure token (không phải password)
2. Email gửi đến staff email: "Welcome" + link set password (token, 72h expiry)
3. `/staff/set-password/[token]` — form nhập new password (min 8 chars, 1 uppercase, 1 number)
4. Sau set password: redirect login, token invalidated
5. "Forgot password" trên login page: nhập email → nhận reset link (24h)
6. Password reset link sử dụng xong thì expire
7. Change password trong profile settings (staff): cần nhập old password

**Technical Notes:**
- Token: `crypto.randomBytes(32).toString('hex')`, lưu hashed trong `StaffPasswordReset` table (tạo thêm model)
- Verify token: hash input, compare với stored hash
- Hoặc đơn giản hơn: lưu raw token trong Redis với TTL, không cần DB table
- Resend email: `password-reset` template

**Dependencies:** E3-S9, E1-S3  
**Estimate:** S

---

## Dependency Graph (tóm tắt)

```
E1-S1 (monorepo)
  └── E1-S2 (DB schema)
        ├── E1-S3 (staff auth)
        │     └── E1-S4 (tRPC)
        │           ├── E2-S1 (property/room CRUD)
        │           │     ├── E2-S2 (availability engine)
        │           │     │     └── E2-S3 (rate plans)
        │           │     └── E2-S4 (guest CRUD)
        │           │           └── E2-S5 (booking CRUD)
        │           │                 ├── E2-S6 (room assign)
        │           │                 │     └── E2-S7 (folio)
        │           │                 │           └── E2-S8 (check-in/out)
        │           │                 └── [Epic 5: booking portal]
        │           └── E1-S5 (socket.io)
        │                 ├── E3-S2 (dashboard)
        │                 ├── E3-S5 (housekeeping board)
        │                 └── E4-S5 (call-for-help)
        └── E1-S6 (UI lib) ─── E3-S1 (staff shell) ─── [Epic 3 UI stories]

E4-S1 (kiosk setup) ─── E4-S2 (check-in) ─── E4-S3 (walk-in) ─── E4-S4 (check-out)
```

---

## Story Size Summary

| Epic | S | M | L | Notes |
|---|---|---|---|---|
| E1 | 2 | 5 | 0 | |
| E2 | 1 | 7 | 0 | |
| E3 | 1 | 7 | 1→2M | E3-S9 split thành E3-S9a + E3-S9b |
| E4 | 1 | 5 | 0 | |
| E5 | 1 | 6 | 0 | |
| E6 | 1 | 2 | 0 | |
| **Total** | **7** | **32** | **0** | **~39 stories** |

---

## Review Checklist

- [ ] Story breakdown đủ chi tiết để implement mà không cần hỏi lại
- [ ] Dependencies hợp lý (không có circular deps)
- [ ] Không có story nào L-size còn lại chưa được split
- [ ] Epic 1 và Epic 2 đủ để làm foundation cho tất cả UI epics
- [ ] Kiosk flow end-to-end rõ ràng (E4-S2 → E4-S3 → E4-S4)

**Sau khi confirm, gọi `/bmad-implement E1-S1` để bắt đầu Phase 4 — Implementation.**
