# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hotel management system built using the **BMAD method** (https://github.com/bmad-code-org/BMAD-METHOD). Three sub-systems:

| System | Users | Description |
|---|---|---|
| **Kiosk App** (`apps/kiosk`) | Hotel guests | Self-service check-in/check-out on touchscreen kiosk |
| **Staff Management Web** (`apps/staff`) | Hotel staff & managers | Full hotel operations: bookings, rooms, housekeeping, reports |
| **Online Booking Portal** (`apps/booking`) | Hotel guests | Room search, booking, and reservation management |

## BMAD Development Workflow

```
Phase 1: Analysis      → product-brief.md
Phase 2: Planning      → prd-*.md, ux-flows.md
Phase 3: Solutioning   → architecture.md, epics-stories.md
Phase 4: Implementation → code, per story
```

All BMAD artifacts live in `_bmad-output/`. Do not skip phases or start implementation before prior phase artifacts are complete.

### Project Skills (slash commands)

| Command | When to use |
|---|---|
| `/project:bmad-status` | Check current phase and what's needed next |
| `/project:bmad-implement [story-id]` | Implement a story (Phase 4) |
| `/project:bmad-review [story-id]` | Review implementation vs ACs (Phase 4) |
| `/project:bmad-stories [epic-id]` | Generate story breakdown (Phase 3) |

All skills in [.claude/commands/](.claude/commands/) — see [README](.claude/commands/README.md) for full index.

## Common Commands

```bash
# Root — runs all packages via Turborepo
pnpm dev            # start all apps in parallel
pnpm typecheck      # typecheck all packages
pnpm lint           # lint all packages
pnpm build          # build all packages
pnpm format         # prettier --write

# packages/db — run from repo root with filter or cd in
pnpm --filter @hotel/db db:generate   # after editing schema.prisma
pnpm --filter @hotel/db db:migrate    # apply migrations (dev)
pnpm --filter @hotel/db db:push       # push schema without migration (rapid proto)
pnpm --filter @hotel/db db:seed       # seed dev data
pnpm --filter @hotel/db db:studio     # open Prisma Studio at localhost:5555
pnpm --filter @hotel/db db:reset      # drop + re-migrate + re-seed (dev only)

# packages/api — unit tests
pnpm --filter @hotel/api test         # vitest run (pricing logic tests)

# Typecheck a single package
pnpm -r typecheck   # all packages
```

Docker for local Postgres:
```bash
docker compose up -d   # starts postgres on localhost:5432
```

## Architecture

**Stack:** TypeScript · Next.js 15 (App Router) · PostgreSQL · Prisma 6.x · Tailwind CSS · Turborepo · tRPC v11 · Socket.io · Redis (Upstash)

```
apps/
  kiosk/          # Vite + React (fullscreen PWA, tablet kiosk)
  staff/          # Next.js + custom HTTP server wrapping Next (for Socket.io)
  booking/        # Next.js (public portal, i18n with next-intl)
packages/
  api/            # tRPC router — all business logic lives here
  db/             # Prisma schema + migrations + seed
  ui/             # Shared Tailwind + shadcn/ui components
  types/          # Shared TypeScript types + Socket.io event types
  config/         # ESLint, TypeScript, Tailwind shared configs
```

### `packages/api` — tRPC layer

Entry point: `src/root.ts` — registers all routers on `appRouter`.

**Procedure variants** (from `src/trpc.ts`):
| Procedure | Auth requirement |
|---|---|
| `publicProcedure` | None |
| `staffProcedure` | Valid staff JWT (any role) |
| `managerProcedure` | Staff JWT with role `MANAGER` or `ADMIN` |
| `adminProcedure` | Staff JWT with role `ADMIN` only |
| `kioskProcedure` | `X-Kiosk-Api-Key` header |
| `guestProcedure` | Guest JWT |

**Request context** (`src/context.ts`): `{ db, redis, auth, propertyId }`
- `ctx.auth.staffId`, `ctx.auth.role`, `ctx.auth.propertyId` available after `staffProcedure`
- `ctx.propertyId` is always scoped to the authenticated staff/kiosk property — never accept `propertyId` from client input

**Routers implemented:**
`property`, `roomType`, `amenity`, `availability`, `ratePlan`, `pricing`, `guest`, `booking`, `folio`, `room`, `housekeeping`, `staff`, `report`, `promoCode`, `service`, `kiosk`

### `apps/staff` — custom server

`server.ts` wraps Next.js with a raw `http.Server` to mount Socket.io.
- `/staff` namespace: staff JWT auth, auto-joins `property:{propertyId}` room
- `/kiosk` namespace: API key auth
- `global.staffIO` / `global.kioskIO` — emit helpers for tRPC mutations

## Coding Conventions

These are enforced across all stories — do not deviate:

**Soft delete** — never `db.entity.delete()`. Use status flags (`isActive: false`, `status: "CANCELLED"`, `isDeleted: true`).

**Audit log** — every staff mutation writes an `AuditLog` record:
```typescript
await ctx.db.auditLog.create({
  data: {
    staffId: ctx.auth.staffId,
    entityType: "Booking",  // Pascal case entity name
    entityId: id,
    action: "UPDATE",       // CREATE | UPDATE | CANCEL | CHECK_IN | CHECK_OUT
    changes: JSON.parse(JSON.stringify(changePayload)), // Prisma Json? field workaround
  },
})
```

**Prisma `Json?` fields** — always pass through `JSON.parse(JSON.stringify(obj))` to strip `undefined` values before writing.

**PII encryption** — `idNumber` is stored encrypted as `idNumberEnc` using `packages/api/src/lib/crypto.ts` (AES-256-GCM). Never expose `idNumberEnc`; always decrypt via `safeDecrypt()` before returning.

**UTC dates** — all dates stored and compared in UTC. `checkIn`/`checkOut` inputs are `z.string().date()` (YYYY-MM-DD) — construct as `new Date(input + "T00:00:00.000Z")`.

**Availability check** — `Booking` overlap formula: `checkInDate < checkOut AND checkOutDate > checkIn` with `status IN (CONFIRMED, CHECKED_IN)`.

**Pricing** — use `calculatePricing()` from `packages/api/src/lib/pricing.ts`. Weekend = Fri/Sat/Sun (UTC dow 5, 6, 0).

**Confirmation codes** — format `HTL-{YEAR}-{6ALPHANUMERIC}` using `crypto.randomBytes`. Retry up to 5 times for uniqueness.

**Import style** — `import type { PrismaClient, Prisma } from "@hotel/db"` for type-only Prisma imports. Never import from `@prisma/client` directly.

## Current Implementation Status (Phase 4)

### E1 — Infrastructure
| Story | Status | Description |
|---|---|---|
| E1-S1 | ✅ | Turborepo monorepo with pnpm |
| E1-S2 | ✅ | PostgreSQL + Prisma schema |
| E1-S3 | ✅ | Staff JWT authentication (jose) |
| E1-S4 | ✅ | tRPC API layer |
| E1-S5 | ✅ | Redis + Socket.io realtime |
| E1-S6 | ✅ | Shared UI component library |
| E1-S7 | ✅ | File storage (Cloudflare R2 adapter + demo fallback) + room photo upload UI |

### E2 — Backend API (Core Hotel Operations)
| Story | Status | Description |
|---|---|---|
| E2-S1 | ✅ | Property & Room Type config (Admin CRUD) |
| E2-S2 | ✅ | Availability engine |
| E2-S3 | ✅ | Rate plan management & pricing |
| E2-S4 | ✅ | Guest profile CRUD & search |
| E2-S5 | ✅ | Booking CRUD (staff-created) |
| E2-S6 | ✅ | Room assignment & status management |
| E2-S7 | ✅ | Folio management & service charges |
| E2-S8 | ✅ | Staff check-in & check-out flow |

### E3 — Staff Management Web (UI)
| Story | Status | Description |
|---|---|---|
| E3-S1 | ✅ | Staff app shell: layout, navigation, login page |
| E3-S2 | ✅ | Front desk dashboard with realtime alerts |
| E3-S3 | ✅ | Booking management: list, detail, create, edit, cancel |
| E3-S4 | ✅ | Room management page |
| E3-S5 | ✅ | Housekeeping Kanban board |
| E3-S6 | ✅ | Guest profile pages |
| E3-S7 | ✅ | Folio and payment management pages |
| E3-S8 | ✅ | Reports pages |
| E3-S9 | ✅ | Admin settings pages |

### E4 — Kiosk App
| Story | Status | Description |
|---|---|---|
| E4-S1 | ✅ | Kiosk PWA setup + home screen (3 buttons, idle overlay, language toggle, 5/3 min timers) |
| E4-S2 | ✅ | Kiosk check-in flow (code input + QR, booking confirm, name verify, auto-assign room, success) |
| E4-S3 | ✅ | Kiosk walk-in booking (dates, room types, guest info, summary, demo payment → auto check-in) |
| E4-S4 | ✅ | Kiosk check-out flow (lookup by room/code, folio display, demo payment, success) |
| E4-S5 | ✅ | "Gọi nhân viên" button → WebSocket alert to staff dashboard, audio beep, dismiss |

**Kiosk tech notes:**
- `apps/kiosk` is Vite + React PWA (`vite-plugin-pwa`) — fullscreen standalone mode
- Calls staff app tRPC at `VITE_STAFF_API_URL/api/trpc` with `X-Kiosk-Api-Key` header
- Name normalization: strip Vietnamese diacritics + lowercase (server-side via `normalizeName()`)
- Room auto-assign uses optimistic locking (version field) with up to 5 retries
- Demo payment: 2s simulation on frontend, demo DEMO record created in DB
- `VITE_KIOSK_ID` env var identifies the kiosk device for call-for-help alerts
- QR scanning uses native `BarcodeDetector` API (Chrome Android 83+), falls back to code input

### E5 — Online Booking Portal
| Story | Status | Description |
|---|---|---|
| E5-S1 | ✅ | Booking portal setup với i18n (next-intl), VI/EN, sitemap, robots, generateMetadata, Schema.org |
| E5-S2 | ✅ | Homepage (hero, search widget, featured rooms) + /about, /amenities, /contact pages |
| E5-S3 | ✅ | /rooms listing (sort, slideshow, availability) + /rooms/[slug] detail (lightbox, ISR) |
| E5-S4 | ✅ | Booking funnel 4 bước (confirm + promo code, guest info, review, confirm + availability re-check) |
| E5-S5 | ✅ | /booking/[confirmationCode] confirmation page (QR code server-side, ICS, Google Calendar, print) |
| E5-S6 | ✅ | Guest auth (register, login, forgot/reset password) + /my-bookings (3 tabs) + lookup (no-auth) |
| E5-S7 | ✅ | Promo code validate (portal.validatePromoCode publicProcedure) |

**Portal tech notes:**
- `apps/booking` là Next.js 15 App Router với next-intl (URL prefix `/vi/...`, `/en/...`)
- `packages/api/src/routers/portal.ts` — tất cả public + guestProcedure endpoints cho booking portal
- `BOOKING_PROPERTY_ID` env var xác định property cho portal (single-property mode)
- `GUEST_JWT_SECRET` — JWT secret cho guest auth (httpOnly cookie `guest_token`, 7d/30d)
- `BookingChannel.ONLINE` — channel mới cho online bookings
- Guest schema: thêm `emailVerifiedAt`, `passwordResetToken`, `passwordResetExpiry`
- QR code: `qrcode` library server-side tạo base64 PNG embed vào page
- Email: `resend` (silent fail nếu `RESEND_API_KEY` absent)
- Booking lock: `lockedUntil = now + 30min` khi confirm (BR-B-07)

### E6 — Integration & Advanced Features
| Story | Status | Description |
|---|---|---|
| E6-S1 | ✅ | Per-property email template system (Handlebars editor, preview, restore default) |
| E6-S2 | ✅ | Per-property invoice PDF (@react-pdf/renderer, taxCode, bankAccount, payment history) |
| E6-S3 | ✅ | Housekeeping realtime alerts + call-for-help dismiss broadcast to all staff screens |
| E6-S4 | ✅ | Staff password reset & onboarding flow (forgot password, set-password, change password) |

**E1-S7 tech notes:**
- `packages/api/src/lib/storage.ts` — `uploadFile`, `getSignedUrl`, `deleteFile`, `getPublicUrl`, `processImage`, `roomPhotoKey`
- Demo mode when `CLOUDFLARE_R2_ACCOUNT_ID` absent — returns `/demo-placeholder/{key}` URLs, upload is skipped
- `sharp` library processes images to WebP 1920px max before upload
- `apps/staff/src/app/api/upload/room-photo/route.ts` — POST multipart, validates 10 MB limit
- `roomType.updatePhotos({ id, photoUrls })` — reorder/remove photos, persists to DB
- Photo manager UI in `/settings/room-types` — thumbnail strip with move/delete, expand-in-place

**E6 tech notes:**
- `Property` schema: added `taxCode String?`, `bankAccount String?` (shown in invoice PDF and property settings)
- Invoice PDF: `apps/staff/src/lib/invoice-pdf.tsx` using `@react-pdf/renderer`, served from `GET /api/invoices/[bookingId]`
- Download button on folio page → `/api/invoices/[bookingId]` → returns `application/pdf` stream
- `property.emailTemplate` — Handlebars HTML template, null = use default. Stored in DB.
- Email template variables: `{{guestName}}`, `{{confirmationCode}}`, `{{checkIn}}`, `{{checkOut}}`, `{{roomType}}`, `{{propertyName}}`, `{{propertyAddress}}`, `{{qrCodeImage}}`
- Alert dismiss: staff client emits `alert:dismiss` → server re-broadcasts `alert:dismissed` → all screens remove that alert
- Staff onboarding: admin creates staff → onboarding token (72h) → email with `/set-password/[token]` link
- Password reset: `/forgot-password` → email link → `/set-password/[token]?type=reset`
- Staff schema: added `passwordResetToken String? @unique`, `passwordResetExpiry DateTime?`, `onboardingToken String? @unique`

## Domain Model

Core entities (all in `packages/db/prisma/schema.prisma`):
- `Property` — hotel property with `propertyType` config
- `Guest` — profile, contact, loyalty, encrypted `idNumberEnc`
- `RoomType` — category, capacity, amenities
- `Room` — specific room with floor + status (`CLEAN`, `DIRTY`, `OCCUPIED`, `MAINTENANCE`)
- `Booking` — reservation; confirmation code `HTL-{YEAR}-{6CHAR}`; links to `BookingRoom`
- `Folio` — one per booking; contains `FolioItem` (charges) and `Payment`
- `RatePlan` — pricing rules (discount %, weekday/weekend price)
- `Staff` — employee with role (`FRONT_DESK`, `HOUSEKEEPING`, `MANAGER`, `ADMIN`, `ACCOUNTANT`)
- `AuditLog` — immutable log of all staff mutations

## Confirmed Requirements

| Item | Decision |
|---|---|
| Hotel types | Multi-type — `propertyType` config flag |
| Payment | Demo adapter pattern; real gateway plugged in per client |
| Kiosk devices | Android tablet + Windows PC (Electron or PWA in kiosk mode) |
| Tech stack | TypeScript · Next.js · PostgreSQL · Prisma · Turborepo · tRPC |
| Auth | Staff: JWT via jose (httpOnly cookie). Kiosk: API key header. |

## Open Decisions

1. Real payment gateway per deployment (VNPay / MoMo / Stripe / ZaloPay)
2. Key card encoder brand (Assa Abloy, Dormakaba) — needed for Kiosk Epic 3
3. Channel manager integration (SiteMinder, direct OTA APIs) — needed for E2-S8+
4. Cloud/hosting provider
5. Kiosk offline mode requirements
