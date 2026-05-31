# Full System Plan — Hotel Management System (BMAD Method)

**Created:** 2026-05-30  
**Method:** BMAD (https://github.com/bmad-code-org/BMAD-METHOD)  
**Status:** Phase 1 — Analysis

---

## 1. Confirmed Requirements

| Question | Answer |
|---|---|
| Hotel types | Multi-type support (see Section 2) |
| Current PMS | None — greenfield |
| Payment | Demo payment layer; real gateway integrated on demand |
| Kiosk devices | Android tablet + Windows PC |
| Tech stack | No preference — team selects best fit |

---

## 2. Hotel Types Supported

The system is designed to be **property-type agnostic** via configuration, not code forks.

| Type | Rooms | Key Characteristics | Special Modules |
|---|---|---|---|
| **Boutique** | 10–50 | Unique character, personal service | Guest preferences, CRM |
| **Business Hotel** | 50–200 | Corporate travelers, meeting rooms | Meeting room booking, invoice splitting, loyalty |
| **Resort** | 50–300 | Leisure, multiple amenities | Spa/pool booking, activity scheduling, all-inclusive billing |
| **Budget / Hostel** | 20–100 beds | Shared facilities, dorm beds | Bed-level inventory, locker management, shared bathrooms |
| **Serviced Apartment** | 20–100 units | Long-stay guests | Weekly/monthly rates, utility billing, lease management |
| **Motel / Guesthouse** | 20–80 | Simple, quick turnover | Walk-in heavy, minimal amenities |

**Implementation strategy:** A `property_type` config field drives which modules/features are enabled. Core booking engine is shared; modules are feature-flagged.

---

## 3. Three Sub-Systems

### 3.1 Kiosk App (Guest Self-Service)
**Devices:** Android tablet + Windows PC (responsive Electron or PWA)  
**Use cases:**
- Check-in: lookup booking → verify identity → room assignment → digital/card key
- Check-out: view folio → review charges → pay → receipt (print/email)
- During stay: request services, extend stay, get information
- Walk-in: create booking on-site

### 3.2 Staff Management Web
**Users:** Front desk, Housekeeping, Manager, Accountant  
**Use cases:**
- Dashboard: today's arrivals/departures, occupancy, alerts
- Booking management: CRUD, search, channel-sourced bookings
- Room management: assignment, status, maintenance flags
- Housekeeping board: task assignment, room status live updates
- Guest profiles: history, preferences, notes
- Billing: folio management, service charges, invoicing
- Reports: occupancy, revenue, channel mix, ADR, RevPAR

### 3.3 Online Booking Portal
**Users:** Public guests  
**Use cases:**
- Search availability by date/guests/room type
- View rooms with photos, amenities, rates
- Multi-step booking funnel
- Guest account: view/modify/cancel bookings
- Promo codes & packages
- Confirmation email with booking details

---

## 4. Architecture (Planned)

### Monorepo Structure
```
checkinout-bmad/
├── apps/
│   ├── kiosk/          # Electron (cross-platform: Android + Windows)
│   ├── staff/          # Next.js — staff management
│   └── booking/        # Next.js — public booking portal
├── packages/
│   ├── db/             # Prisma schema, migrations, seed
│   ├── ui/             # Shared Tailwind + Radix component library
│   ├── types/          # Shared TypeScript types & Zod schemas
│   ├── business/       # Business logic (availability engine, pricing)
│   └── config/         # Shared ESLint, TS, Tailwind configs
├── _bmad-output/       # All BMAD planning artifacts
└── CLAUDE.md
```

### Tech Stack
| Layer | Technology | Rationale |
|---|---|---|
| Language | TypeScript (all) | Type safety across monorepo |
| Monorepo | Turborepo | Shared packages, incremental builds |
| Backend | Next.js API Routes + tRPC | Type-safe APIs, SSR for SEO |
| Database | PostgreSQL | Relational, strong for booking constraints |
| ORM | Prisma | Type-safe queries, migrations |
| Auth | NextAuth.js (staff) + JWT (kiosk/guest) | Role-based access |
| Realtime | Pusher / Ably | Live room status updates |
| Payments | Demo adapter pattern | Plug-in real gateway per client |
| Kiosk | Electron + React | Runs on Android (Kiosk Browser) + Windows |
| UI | Tailwind CSS + shadcn/ui | Consistent design system |
| File Storage | Cloudflare R2 | Room photos, documents |
| Email | Resend | Booking confirmations |
| Deployment | Vercel (web) + Docker (kiosk) | |

### Domain Model (Core Entities)
```
Property          ← top-level (multi-property support)
  ├── RoomType    ← category with pricing & amenities
  │   └── Room   ← physical room with status
  ├── RatePlan    ← pricing rules (BAR, package, long-stay)
  └── Amenity     ← spa, pool, meeting room, etc.

Guest             ← profile, contact, preferences
  └── Booking     ← reservation (dates, rooms, guests, channel)
      ├── BookingRoom  ← room allocated to booking
      ├── Folio        ← charges ledger
      │   └── FolioItem ← individual charge/credit
      └── Payment      ← payment transaction

Staff             ← employee with role
HousekeepingTask  ← assigned cleaning/inspection per room
ServiceRequest    ← guest request during stay
```

---

## 5. Epic & Story Breakdown

### Epic 1: Foundation & Infrastructure
- 1.1 Monorepo setup (Turborepo, shared configs, CI)
- 1.2 Database schema v1 + Prisma migrations
- 1.3 Seed data (room types, demo property, demo rooms)
- 1.4 Staff authentication (NextAuth, roles: admin/front-desk/housekeeping)
- 1.5 Kiosk authentication (PIN mode + QR token)

### Epic 2: Core Booking Engine
- 2.1 Room type & room CRUD (staff)
- 2.2 Rate plan management (BAR, packages, long-stay)
- 2.3 Availability engine (date range, room type, occupancy check)
- 2.4 Booking CRUD (staff-created reservations)
- 2.5 Guest profile management

### Epic 3: Kiosk — Check-in Flow
- 3.1 Booking lookup (confirmation number + QR code)
- 3.2 Guest identity verification step (name/DOB confirm)
- 3.3 Room assignment display & confirmation
- 3.4 Digital key generation / key card instruction screen
- 3.5 Welcome screen post-check-in

### Epic 4: Kiosk — Check-out Flow
- 4.1 Retrieve and display folio (itemized charges)
- 4.2 Demo payment processing screen
- 4.3 Receipt: email + thermal print driver (Windows)
- 4.4 Room status trigger (set to "dirty" on check-out)

### Epic 5: Online Booking Portal
- 5.1 Room search page (date picker, guest count, availability calendar)
- 5.2 Room listing with photos, amenities, rate display
- 5.3 Booking funnel: select → guest details → review → demo payment
- 5.4 Booking confirmation email
- 5.5 Guest account: view, modify, cancel bookings
- 5.6 Promo code support

### Epic 6: Staff Operations
- 6.1 Front desk dashboard (arrivals, departures, occupancy widget)
- 6.2 Housekeeping Kanban board (room status: clean/dirty/inspected)
- 6.3 Folio management (add charges, adjustments, split billing)
- 6.4 Reports: occupancy rate, revenue by period, channel mix

### Epic 7: Multi-Property & Property Types
- 7.1 Property configuration (type, modules enabled)
- 7.2 Hostel/dorm mode: bed-level inventory
- 7.3 Long-stay mode: weekly/monthly rate billing
- 7.4 Amenity booking (spa, pool slots, meeting rooms)
- 7.5 Multi-property selector (staff)

---

## 6. BMAD Artifact Checklist

```
_bmad-output/
├── full-plan.md              ✅ (this file)
├── product-brief.md          ✅ CONFIRMED
├── prd-kiosk.md              ✅ DRAFT — awaiting user confirmation
├── prd-staff.md              ✅ DRAFT — awaiting user confirmation
├── prd-booking.md            ✅ CONFIRMED
├── ux-flows.md               ⬜ TODO — Phase 2 (optional)
├── architecture.md           ✅ DRAFT — awaiting user confirmation
├── project-context.md        ✅ DRAFT — awaiting user confirmation
└── epics-stories.md          ✅ DRAFT — awaiting user confirmation
```

---

## 7. Timeline (Estimate)

| Week | Phase | Deliverable |
|---|---|---|
| 1 | Analysis | product-brief.md confirmed |
| 2 | Planning | prd-kiosk.md, prd-staff.md, prd-booking.md |
| 3 | Planning | ux-flows.md, UX wireflows |
| 4 | Solutioning | architecture.md, project-context.md |
| 5 | Solutioning | epics-stories.md (full breakdown) |
| 6–7 | Epic 1 | Foundation, auth, DB schema |
| 8–9 | Epic 2 | Booking engine core |
| 10–11 | Epics 3–4 | Kiosk check-in/out |
| 12–13 | Epic 5 | Online booking portal |
| 14–15 | Epic 6 | Staff operations |
| 16 | Epic 7 | Multi-property & property types |
| 17 | — | Testing, UAT, deployment prep |

---

## 8. Open Decisions (to resolve before Epic 7)

- Real payment gateway per client (VNPay / MoMo / Stripe / ZaloPay)
- Key card system integration (RFID encoder brand — Assa Abloy, Dormakaba)
- Channel manager API (if needed: SiteMinder, Cloudbeds, direct OTA APIs)
- POS integration for F&B (resort/business hotel types)
- Kiosk Android deployment: dedicated Kiosk Browser app vs Android Kiosk Mode
