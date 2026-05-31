# Project Skills Index

Invoke via `/project:{skill-name}` in Claude Code.

## BMAD Workflow Skills

| Skill | Phase | Description |
|---|---|---|
| `/project:bmad-status` | Any | Show current phase, completed artifacts, and next action |
| `/project:bmad-product-brief` | 1 — Analysis | Generate `_bmad-output/product-brief.md` |
| `/project:bmad-prd [kiosk\|staff\|booking]` | 2 — Planning | Generate PRD for a sub-system |
| `/project:bmad-architecture` | 3 — Solutioning | Generate architecture + project-context docs |
| `/project:bmad-stories [epic-id]` | 3 — Solutioning | Generate full epics & stories breakdown |
| `/project:bmad-implement [story-id]` | 4 — Implementation | Implement a specific story (e.g., E1-S3) |
| `/project:bmad-review [story-id]` | 4 — Implementation | Review implementation against story ACs |

## Meta Skills

| Skill | Description |
|---|---|
| `/project:bmad-add-skill [name] [desc]` | Add a new skill to this index |

## BMAD Artifact Files

```
_bmad-output/
├── full-plan.md          Master project plan
├── product-brief.md      Phase 1 output
├── prd-kiosk.md          Phase 2 output
├── prd-staff.md          Phase 2 output
├── prd-booking.md        Phase 2 output
├── ux-flows.md           Phase 2 output
├── architecture.md       Phase 3 output
├── project-context.md    Phase 3 output (fed to dev agent)
└── epics-stories.md      Phase 3 output
```
