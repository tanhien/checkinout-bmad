Generate a comprehensive, risk-based TESTPLAN.md for any BMAD project using a Senior QA Engineer framework.

Usage: /project:bmad-test [scope]
  scope (optional): all | auth | api | ui | integration | security | <subsystem-name>
  Default: all

---

## Step 1 — Discover project context

Read in order (stop at first found):
1. `_bmad-output/project-context.md` — tech stack, auth mechanisms, conventions
2. `_bmad-output/architecture.md` — subsystems, API routes, DB schema, data flows
3. `_bmad-output/epics-stories.md` — implemented features and acceptance criteria
4. `CLAUDE.md` — coding conventions, domain model, current implementation status

Extract and note:
- **Subsystems**: list every deployable app (web, mobile, kiosk, API, etc.)
- **Auth mechanisms**: JWT, API key, session, OAuth — per subsystem
- **User roles**: all roles and their access boundaries
- **Critical entities**: core domain models and their relationships
- **Real-time features**: WebSocket, SSE, polling
- **External integrations**: payment gateway, email, storage, third-party APIs
- **Known conventions**: soft-delete, audit log, PII encryption, UTC dates, etc.

---

## Step 2 — Risk assessment

Categorize every feature/subsystem:

**🔴 High Risk** — test all happy + error paths, include race conditions:
- Authentication & authorization (every role, every endpoint)
- Core business transactions (purchases, bookings, payments)
- Data integrity (create/update/delete flows)
- PII and security-sensitive operations
- Auto-assignment or concurrency-sensitive logic

**🟠 Medium Risk** — test happy path + primary error paths:
- Secondary user workflows
- Real-time / WebSocket features
- Third-party integrations
- File uploads, exports

**🟡 Low Risk** — test happy path only:
- UI-only features (sorting, filtering, display)
- Reports and read-only exports
- i18n / localization
- Non-critical configuration screens

---

## Step 3 — Generate test cases

For each identified feature, generate test cases across three layers:

### Layer A — Functional UI
- Standard happy-path interaction
- Input validation (required fields, format, length limits)
- Error states (server error, network failure, empty states)
- Role-gated UI elements (buttons hidden for wrong role)

### Layer B — API / tRPC
- Auth guard: unauthenticated request → correct error code
- Input validation: missing fields, wrong types, boundary values
- Business rule enforcement: duplicate, out-of-range, invalid state transition
- Response shape: required fields present, correct types

### Layer C — Integration & State
- Cross-subsystem flows (e.g., booking created on portal → visible in staff web)
- Real-time propagation: action in A → event appears in B within 2s
- State machine correctness: entity transitions follow defined rules
- Concurrent operations: same resource modified simultaneously

### Each test case must include:
```
### TC-{GROUP}-{NN}: {Action-oriented title}
**Priority:** P0/P1/P2 · **Risk:** 🔴/🟠/🟡

**Preconditions:** {What must be true before the test}

**Steps:**
1. {Numbered, specific, reproducible}
2. ...

**Expected:** {Exact outcome — DB state, UI state, API response}

**Failure indicators:** {What a bug looks like}
```

Priority mapping:
- **P0**: Must pass before any release. Blocks deploy.
- **P1**: Must pass before production. High confidence required.
- **P2**: Should pass. Can ship with known workaround.

---

## Step 4 — Structure TESTPLAN.md

Output file: `TESTPLAN.md` at project root.

Sections in order:

```markdown
# TESTPLAN — {Project Name}
> Version, Date, Author, Scope

## Executive Summary
Table: subsystem | URL/entry point | auth mechanism

## Risk Overview
Table: area | risk level | reason

## Test Environment Setup
Commands to reset DB, start apps, default credentials

## NHÓM 1 — {Feature Group} (repeat per group)
### TC-{GROUP}-{NN}: ...

## Go/No-Go Checklist
Table of all P0 tests with ⬜ status column

## Known Issues
Table: ID | description | status | file
```

Group test cases by feature domain (Auth, Core flow per subsystem, Security, Real-time, i18n, API contracts, Performance). Name groups in the project's primary language.

---

## Step 5 — Coverage verification

Before finalizing, self-check:

- [ ] Every user role has at least 1 auth test
- [ ] Every state transition in core entities has at least 1 test
- [ ] Every P0 risk item from Step 2 has ≥ 2 test cases (happy + error)
- [ ] Concurrency/race condition tested for any auto-assignment or reservation logic
- [ ] PII fields verified encrypted in DB if any exist
- [ ] At least 1 security test per auth boundary
- [ ] Cross-subsystem integration tested for every real-time feature
- [ ] All known bugs from git history (grep `fix:` commits) have regression tests

---

## Step 6 — Report

After writing TESTPLAN.md, output:
- Total test cases by priority: P0: N, P1: N, P2: N
- Total test cases by risk: 🔴 N, 🟠 N, 🟡 N
- Coverage gaps (any feature area with no test cases)
- Estimated manual test execution time (assume 3 min/case average)
- Top 3 highest-risk scenarios to run first

---

## Conventions

- Test IDs: `TC-{3-LETTER-GROUP}-{2-DIGIT-NUMBER}` (e.g., TC-AUTH-01, TC-BOOK-05)
- Do NOT generate mock code or automation scripts — this is a manual test plan
- Write steps in the project's primary language (detect from CLAUDE.md or product-brief.md)
- Reference exact file paths when describing where to verify DB state
- Include `pnpm` / `docker` commands for setup matching the project's toolchain
- Flag any missing preconditions or ambiguous acceptance criteria as `⚠️ CLARIFY`
