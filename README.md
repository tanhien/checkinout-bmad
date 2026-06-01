# Hotel Management System

A full-stack hotel management platform built with TypeScript, Next.js, and tRPC in a Turborepo monorepo. Supports three user-facing sub-systems: a guest kiosk, a staff operations web app, and an online booking portal.

---

## Sub-systems

| App | Users | Port | Description |
|---|---|---|---|
| `apps/staff` | Hotel staff & managers | 3001 | Full hotel operations: bookings, rooms, housekeeping, reports, admin settings |
| `apps/booking` | Hotel guests | 3000 | Public room search, booking, confirmation, guest account, i18n (VI/EN) |
| `apps/kiosk` | Hotel guests | 3002 | Self-service check-in/check-out (fullscreen PWA, tablet/kiosk) |

---

## Tech Stack

- **Runtime:** Node.js 22+, pnpm 9+
- **Framework:** Next.js 15 (App Router) · Vite + React (Kiosk)
- **API:** tRPC v11
- **Database:** PostgreSQL 16 + Prisma 6.x
- **Realtime:** Socket.io + Redis (Upstash)
- **Auth:** JWT via jose — httpOnly cookie (staff & guest); API key header (kiosk)
- **Styling:** Tailwind CSS + shadcn/ui
- **Monorepo:** Turborepo
- **File storage:** Cloudflare R2 (S3-compatible); demo mode if not configured
- **Email:** Resend; silent no-op if not configured
- **PDF:** @react-pdf/renderer (invoice generation)
- **i18n:** next-intl (VI/EN) in booking portal

---

## Project Structure

```
apps/
  staff/          # Next.js + custom HTTP server (Socket.io)
  booking/        # Next.js (i18n with next-intl, VI/EN)
  kiosk/          # Vite + React (fullscreen PWA)
packages/
  api/            # tRPC router — all business logic
  db/             # Prisma schema, migrations, seed
  ui/             # Shared Tailwind + shadcn/ui components
  types/          # Shared TypeScript types + Socket.io event types
  config/         # ESLint, TypeScript, Tailwind shared configs
_bmad-output/     # BMAD planning artifacts (PRD, architecture, epics)
```

---

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm >= 9
- Docker (for local PostgreSQL)

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values. See the [Environment Variables](#environment-variables) section below.

### 3. Start the database

```bash
docker compose up -d
```

Starts PostgreSQL on `localhost:5433` and pgAdmin at `http://localhost:5050`.

### 4. Set up the database

```bash
pnpm --filter @hotel/db db:migrate   # apply migrations
pnpm --filter @hotel/db db:seed      # seed development data
```

The seed creates an admin staff account, a demo property, room types, rooms, and rate plans.

### 5. Start all apps

```bash
pnpm dev
```

All apps start in parallel via Turborepo. Staff app on `:3001`, booking portal on `:3000`, kiosk on `:3002`.

---

## Common Commands

```bash
# Development
pnpm dev                              # start all apps
pnpm build                            # build all packages
pnpm lint                             # lint all packages
pnpm typecheck                        # typecheck all packages
pnpm format                           # format with prettier

# Database (run from repo root)
pnpm --filter @hotel/db db:generate   # regenerate Prisma client after schema changes
pnpm --filter @hotel/db db:migrate    # apply pending migrations
pnpm --filter @hotel/db db:push       # push schema without a migration (rapid prototyping)
pnpm --filter @hotel/db db:seed       # re-seed dev data
pnpm --filter @hotel/db db:studio     # open Prisma Studio at localhost:5555
pnpm --filter @hotel/db db:reset      # drop + re-migrate + re-seed (dev only)

# API unit tests (pricing logic)
pnpm --filter @hotel/api test
```

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `STAFF_JWT_SECRET` | Min 32-char secret for staff JWT tokens |
| `GUEST_JWT_SECRET` | Min 32-char secret for guest JWT tokens (booking portal) |
| `PII_ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM (guest ID number encryption) |
| `UPSTASH_REDIS_URL` | Upstash Redis URL (for session cache + Socket.io adapter) |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis token |
| `KIOSK_API_KEY` | Per-property API key for the kiosk app |
| `BOOKING_PROPERTY_ID` | Property ID served by the booking portal (single-property mode) |
| `STAFF_BASE_URL` | Public URL of the staff app (used in emails, e.g. `https://staff.hotel.com`) |
| `CLOUDFLARE_R2_ACCOUNT_ID` | R2 storage (optional — demo mode if absent) |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | R2 access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | R2 secret key |
| `CLOUDFLARE_R2_BUCKET` | R2 bucket name |
| `CLOUDFLARE_R2_PUBLIC_URL` | R2 public URL prefix |
| `RESEND_API_KEY` | Resend email API key (optional — silent no-op if absent) |

---

## Architecture Notes

- All business logic lives in `packages/api` (tRPC routers). Apps only contain UI and server setup.
- Soft deletes everywhere — no `DELETE` queries; use status flags (`isActive`, `isDeleted`, `status: CANCELLED`).
- Every staff mutation writes an `AuditLog` record.
- Guest ID numbers are stored AES-256-GCM encrypted (`idNumberEnc`); decrypted only at read time.
- All dates are stored and compared in UTC.
- `ctx.propertyId` is always derived from the authenticated session — never accepted from client input.
- Socket.io has two namespaces: `/staff` (JWT auth) and `/kiosk` (API key); both auto-join `property:{propertyId}` room for scoped broadcasts.
- Demo adapters: R2, Resend, and payment all degrade gracefully when credentials are absent, suitable for local development without external accounts.

---

## Implementation Status

All 6 epics and 34 stories are implemented:

| Epic | Description | Stories |
|---|---|---|
| **E1** | Infrastructure (monorepo, DB, auth, tRPC, realtime, UI lib, file storage) | 7/7 ✅ |
| **E2** | Backend API — availability, bookings, rooms, folio, check-in/out | 8/8 ✅ |
| **E3** | Staff web UI — dashboard, bookings, housekeeping, guests, reports, settings | 9/9 ✅ |
| **E4** | Kiosk PWA — check-in, walk-in booking, check-out, call-for-help | 5/5 ✅ |
| **E5** | Online booking portal — i18n, room listing, 4-step funnel, guest auth | 7/7 ✅ |
| **E6** | Integration features — email templates, invoice PDF, realtime alerts, staff onboarding | 4/4 ✅ |

---

## Development Workflow (BMAD)

This project was built using the [BMAD method](https://github.com/bmad-code-org/BMAD-METHOD). Planning artifacts live in `_bmad-output/`.

```
Phase 1: Analysis      → product-brief.md
Phase 2: Planning      → prd-*.md, ux-flows.md
Phase 3: Solutioning   → architecture.md, epics-stories.md
Phase 4: Implementation → code, per story
```

Slash commands available in Claude Code:

| Command | Purpose |
|---|---|
| `/project:bmad-status` | Check current phase and next steps |
| `/project:bmad-implement [story-id]` | Implement a story |
| `/project:bmad-review [story-id]` | Review implementation vs acceptance criteria |
| `/project:bmad-stories [epic-id]` | Generate story breakdown |
