Create a PRD (Product Requirements Document) for a specific sub-system of the hotel management project.

Usage: /project:bmad-prd [kiosk|staff|booking]

Steps:
1. Read `_bmad-output/full-plan.md` and `_bmad-output/product-brief.md` for context
2. Read `CLAUDE.md` for confirmed requirements
3. Identify which sub-system to document from the argument (or ask if not provided)
4. Generate the PRD at `_bmad-output/prd-{system}.md` with these sections:
   - **Overview** — purpose and scope of this sub-system
   - **Users & Roles** — who uses it and what they need
   - **Functional Requirements** — numbered list, each testable
   - **User Stories** — format: "As a [role], I want [action] so that [benefit]"
   - **Business Rules** — constraints and logic that must be enforced
   - **Non-Functional Requirements** — performance, accessibility, offline, multi-language
   - **Out of Scope** — explicit exclusions for this sub-system
   - **Open Questions** — items requiring clarification before implementation
5. After generating, highlight any Open Questions and ask the user to resolve them

PRD must be approved by user before architecture/story creation begins.
