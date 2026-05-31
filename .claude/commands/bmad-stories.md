Create or update the Epics & Stories breakdown at `_bmad-output/epics-stories.md` (BMAD Phase 3 — Solutioning).

Prerequisites: `_bmad-output/architecture.md` must exist and be confirmed.

Steps:
1. Read `_bmad-output/architecture.md`, `_bmad-output/full-plan.md`, and all PRDs
2. Generate or update `_bmad-output/epics-stories.md` with:
   - Each Epic with a clear goal statement
   - Each Story under its Epic with:
     - **ID** (e.g., E1-S3)
     - **Title** (verb phrase: "Implement booking lookup by confirmation number")
     - **As a** [role] **I want** [action] **so that** [outcome]
     - **Acceptance Criteria** — numbered, each testable and binary (pass/fail)
     - **Technical Notes** — key implementation decisions, relevant schema fields
     - **Dependencies** — other story IDs that must complete first
     - **Estimate** — S/M/L (Small <4h, Medium 4-8h, Large 8-16h)
3. Order stories by dependency chain (can be worked top-to-bottom)
4. Flag any story that is L-sized and suggest splitting

If asked to create a single story (provide the story ID or title), generate just that story in full detail to the same standard.
