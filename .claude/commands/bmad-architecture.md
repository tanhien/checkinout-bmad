Create or update the Architecture document at `_bmad-output/architecture.md` (BMAD Phase 3 — Solutioning).

Prerequisites: All three PRDs must exist and be confirmed before running this.

Steps:
1. Read all files in `_bmad-output/` (full-plan, prd-kiosk, prd-staff, prd-booking)
2. Read `CLAUDE.md` for confirmed tech preferences
3. Generate `_bmad-output/architecture.md` with these sections:
   - **Monorepo Structure** — directory tree with explanation of each package
   - **Tech Stack** — final decisions with rationale (not proposals)
   - **Database Schema** — all entities, fields, relationships (Prisma format preferred)
   - **API Design** — tRPC router structure or REST endpoints per sub-system
   - **Authentication & Authorization** — strategy per user type (staff/guest/kiosk)
   - **Real-time Requirements** — what needs live updates and how
   - **Integration Points** — payment adapter, email, file storage, key card
   - **Deployment Architecture** — how each app is deployed
   - **Security Considerations** — kiosk lockdown, PII handling, data isolation
4. Also generate `_bmad-output/project-context.md` — a condensed version for BMAD dev agents containing: tech stack with versions, critical conventions, file naming patterns
5. Highlight any decisions that require user confirmation before proceeding
