# Project Context — BMAD Dev Agent Reference

> Tài liệu này dành cho BMAD dev agents (Amelia). Đọc trước khi implement bất kỳ story nào.

---

## Stack & Versions

| Tool | Version | Notes |
|---|---|---|
| Node.js | 22.x LTS | Use `engines` field in package.json |
| pnpm | 9.x | Workspace protocol, NOT npm/yarn |
| TypeScript | 5.x strict | `"strict": true` in all tsconfigs |
| Next.js (staff, booking) | 15.x | App Router ONLY — không dùng Pages Router |
| React | 19.x | Server Components by default |
| Vite + React (kiosk) | 6.x / 19.x | SPA, no SSR |
| Prisma | 6.x | `prisma generate` sau mọi schema change |
| tRPC | 11.x | `@trpc/server`, `@trpc/client`, `@trpc/react-query` |
| TanStack Query | 5.x | Kèm tRPC |
| Socket.io | 4.x | Server trong apps/staff, client trong tất cả |
| Tailwind CSS | 4.x | Config ở packages/config/tailwind |
| shadcn/ui | latest | `npx shadcn add [component]` |
| Zod | 3.x | Validation tất cả inputs |
| next-intl | 3.x | i18n cho booking app |

---

## File Naming Conventions

```
# Components
PascalCase.tsx              → BookingCard.tsx
use-camel-case.ts           → use-booking-form.ts (hooks)
camelCase.ts                → bookingUtils.ts (utils)

# API / tRPC
camelCase.ts                → booking.ts, housekeeping.ts (routers)

# Database
snake_case trong Prisma     → checkin_date, room_type_id
camelCase trong TypeScript  → checkInDate, roomTypeId (Prisma auto-maps)

# i18n
vi.json, en.json            → flat key: "booking.checkin.title"
```

---

## Critical Conventions

### 1. Timezone
- **Lưu vào DB:** Luôn UTC (`new Date()` là UTC tự động)
- **Hiển thị:** Convert sang `property.timezone` (default `Asia/Ho_Chi_Minh`) tại UI layer
- **Date-only fields** (checkInDate, checkOutDate): Lưu `YYYY-MM-DDT00:00:00.000Z`
- **Đừng bao giờ** lưu local timezone string vào DB

```typescript
// ĐÚNG — convert cho display
import { toZonedTime, format } from 'date-fns-tz'
const localDate = toZonedTime(booking.checkInDate, property.timezone)

// SAI — đừng làm thế này
new Date().toLocaleDateString('vi-VN')  // phụ thuộc server locale
```

### 2. Soft Delete
- **Không bao giờ** dùng `db.entity.delete()`
- Dùng `isDeleted: true`, `isActive: false`, `cancelledAt`, `deactivatedAt`
- Queries phải filter: `where: { isActive: true }` hoặc `where: { isDeleted: false }`

### 3. Audit Logging
- Mọi mutation trong staff tRPC router phải ghi `AuditLog`
- Template:
```typescript
await db.auditLog.create({
  data: {
    staffId: ctx.auth.staffId,
    entityType: 'Booking',
    entityId: booking.id,
    action: 'CHECK_IN',
    changes: { status: { old: 'CONFIRMED', new: 'CHECKED_IN' } }
  }
})
```

### 4. Error Handling
- tRPC errors: Dùng `TRPCError` với code đúng (`NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `BAD_REQUEST`)
- Client: Wrap tất cả mutations trong try/catch; hiển thị toast notification
- Không expose internal error details ra client

### 5. Auth trong Next.js App Router
```typescript
// Server Component — đọc auth từ cookie
import { getStaffSession } from '@/lib/auth'
const session = await getStaffSession()
if (!session) redirect('/login')

// API Route Handler — validate JWT
import { withStaffAuth } from '@/lib/auth'
export const GET = withStaffAuth(async (req, session) => { ... })
```

### 6. Prisma Transaction cho concurrent ops
```typescript
// Luôn dùng transaction khi update nhiều tables liên quan
await db.$transaction(async (tx) => {
  const booking = await tx.booking.update(...)
  const room = await tx.room.update(...)
  await tx.auditLog.create(...)
})
```

### 7. Kiosk API Key
```typescript
// Middleware trong apps/staff
function validateKioskKey(request: NextRequest) {
  const key = request.headers.get('X-Kiosk-Api-Key')
  // Look up property by kioskApiKey
  const property = await db.property.findUnique({ where: { kioskApiKey: key } })
  if (!property) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return property
}
```

---

## Project Structure Quick Reference

```
apps/staff/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login page (no sidebar)
│   ├── (dashboard)/        # Authenticated pages with sidebar layout
│   │   ├── dashboard/      # /dashboard
│   │   ├── bookings/       # /bookings, /bookings/[id]
│   │   ├── rooms/          # /rooms
│   │   ├── housekeeping/   # /housekeeping
│   │   ├── guests/         # /guests, /guests/[id]
│   │   ├── reports/        # /reports
│   │   └── settings/       # /settings (admin only)
│   └── api/
│       ├── trpc/[trpc]/    # tRPC HTTP handler
│       └── socket/         # Socket.io init
├── components/
│   ├── ui/                 # shadcn/ui re-exports
│   ├── booking/            # Booking-specific components
│   ├── room/               # Room-specific components
│   └── housekeeping/       # Housekeeping board
└── lib/
    ├── auth.ts             # JWT helpers
    ├── trpc.ts             # tRPC client setup
    └── socket.ts           # Socket.io client

apps/booking/src/
├── app/
│   ├── [locale]/           # /vi/ or /en/ prefix
│   │   ├── page.tsx        # Homepage
│   │   ├── rooms/          # Room listing + detail
│   │   ├── book/           # Booking funnel
│   │   ├── my-bookings/    # Guest account
│   │   └── contact/        # Contact page
└── messages/               # i18n: vi.json, en.json

apps/kiosk/src/
├── pages/                  # React Router pages (SPA)
│   ├── Home.tsx            # 3 options screen
│   ├── CheckIn.tsx         # Luồng A
│   ├── WalkIn.tsx          # Luồng B
│   └── CheckOut.tsx        # Luồng C
└── lib/
    ├── api.ts              # Calls to staff app tRPC + booking app
    └── printer.ts          # WebUSB / IP printing

packages/api/src/
├── routers/                # tRPC routers (see section 5.2)
├── middleware/             # auth, rbac, rateLimit
├── context.ts              # Request context
└── root.ts                 # Root router
```

---

## Room Status Flow

```
          [assign]        [checkIn]
CLEAN ──────────► RESERVED ──────► OCCUPIED
  ▲                                    │
  │ [inspect]                    [checkOut]
INSPECTED ◄── CLEAN ◄── CLEANING ◄────┘ (→ DIRTY)
                              ▲
                         [startCleaning]
                              │
                           DIRTY
                              │
                         [maintenance]
                              ▼
                        MAINTENANCE
```

---

## Booking Status Flow

```
CONFIRMED → CHECKED_IN → CHECKED_OUT
    │
    └→ CANCELLED (soft)
    └→ NO_SHOW (soft)
```

---

## Confirmation Code Format
`HTL-{YEAR}-{6-CHAR-UPPERCASE-NANOID}`  
Example: `HTL-2025-A3F7K2`

QR payload: `{"code":"HTL-2025-A3F7K2","v":1}` → base64 → QR image

---

## Payment Model
- **Online booking portal:** Không thu tiền khi đặt phòng. Guest thanh toán khi check-out tại khách sạn.
- **Kiosk walk-in:** Prepay toàn bộ tại kiosk (demo payment).
- **All payments v1:** Demo only — `PaymentMethod.DEMO` logged trong DB.

---

## WebSocket Events (Quick Reference)
```typescript
// Emit from server (packages/api)
io.to(`property:${propertyId}`).emit('room:statusChanged', { roomId, newStatus, roomNumber })
io.to(`property:${propertyId}`).emit('alert:callForHelp', { kioskId, timestamp })

// Subscribe in client
socket.on('room:statusChanged', ({ roomId, newStatus }) => { /* update local state */ })
```
