# Hotel Management System

A full-stack hotel management platform built with TypeScript, Next.js, and tRPC in a Turborepo monorepo. Supports three user-facing sub-systems: a guest kiosk, a staff operations web app, and an online booking portal.

---

## Sub-systems

| App | Users | Port | Description |
|---|---|---|---|
| `apps/staff` | Hotel staff & managers | 3001 | Full hotel operations: bookings, rooms, housekeeping, reports |
| `apps/booking` | Hotel guests | 3000 | Public room search, booking, and reservation management |
| `apps/kiosk` | Hotel guests | 3002 | Self-service check-in/check-out (fullscreen PWA, tablet/kiosk) |

---

## Tech Stack

- **Runtime:** Node.js 22+, pnpm 9+
- **Framework:** Next.js 15 (App Router) · Vite + React (Kiosk)
- **API:** tRPC v11
- **Database:** PostgreSQL 16 + Prisma 6.x
- **Realtime:** Socket.io + Redis (Upstash)
- **Auth:** JWT via jose (httpOnly cookie for staff; API key for kiosk)
- **Styling:** Tailwind CSS + shadcn/ui
- **Monorepo:** Turborepo

---

## Project Structure

```
apps/
  staff/          # Next.js + custom HTTP server (Socket.io)
  booking/        # Next.js (i18n with next-intl)
  kiosk/          # Vite + React (fullscreen PWA)
packages/
  api/            # tRPC router — all business logic
  db/             # Prisma schema, migrations, seed
  ui/             # Shared Tailwind + shadcn/ui components
  types/          # Shared TypeScript types + Socket.io event types
  config/         # ESLint, TypeScript, Tailwind shared configs
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

Edit `.env` and fill in the required values (JWT secrets, PII encryption key, Redis, etc.).

### 3. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL on `localhost:5433` and pgAdmin at `http://localhost:5050`.

### 4. Set up the database

```bash
pnpm --filter @hotel/db db:migrate   # apply migrations
pnpm --filter @hotel/db db:seed      # seed development data
```

### 5. Start all apps

```bash
pnpm dev
```

All apps start in parallel via Turborepo.

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

# API unit tests
pnpm --filter @hotel/api test
```

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `STAFF_JWT_SECRET` | Min 32-char secret for staff tokens |
| `GUEST_JWT_SECRET` | Min 32-char secret for guest tokens |
| `PII_ENCRYPTION_KEY` | 64-char hex key for AES-256-GCM (guest ID encryption) |
| `UPSTASH_REDIS_URL` | Upstash Redis URL |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis token |
| `VITE_KIOSK_API_KEY` | Per-property API key for the kiosk app |

---

## Architecture Notes

- All business logic lives in `packages/api` (tRPC routers). Apps only contain UI and server setup.
- Soft deletes everywhere — no `DELETE` queries; use status flags (`isActive`, `isDeleted`, `status: CANCELLED`).
- Every staff mutation writes an `AuditLog` record.
- Guest ID numbers are stored AES-256-GCM encrypted (`idNumberEnc`); never exposed raw.
- All dates are stored and compared in UTC.
- `ctx.propertyId` is always derived from the authenticated session — never accepted from client input.

---

## Development Workflow (BMAD)

This project follows the [BMAD method](https://github.com/bmad-code-org/BMAD-METHOD). Artifacts live in `_bmad-output/`.

```
Phase 1: Analysis      → product-brief.md
Phase 2: Planning      → prd-*.md, ux-flows.md
Phase 3: Solutioning   → architecture.md, epics-stories.md
Phase 4: Implementation → code, per story
```

Useful slash commands in Claude Code:

| Command | Purpose |
|---|---|
| `/project:bmad-status` | Check current phase and next steps |
| `/project:bmad-implement [story-id]` | Implement a story |
| `/project:bmad-review [story-id]` | Review implementation vs acceptance criteria |
| `/project:bmad-stories [epic-id]` | Generate story breakdown |
