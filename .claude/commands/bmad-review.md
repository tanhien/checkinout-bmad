Review completed implementation work against the BMAD story specification.

Usage: /project:bmad-review [story-id]

Steps:
1. Read `_bmad-output/epics-stories.md` and find the story's Acceptance Criteria
2. Read `_bmad-output/project-context.md` for tech conventions
3. Review all changed files for the story (use `git diff main` or read relevant files)
4. For each Acceptance Criterion, report: ✅ Pass / ❌ Fail / ⚠️ Partial
5. Check for:
   - Missing edge cases not in AC but implied by business rules
   - TypeScript type safety (no `any`, proper nullability)
   - Security issues (unvalidated input, exposed PII, missing auth checks)
   - Inconsistency with the project-context.md conventions
6. Output a structured report:
   - AC coverage summary
   - Issues found (critical / minor)
   - Suggested fixes for any failures
   - Verdict: APPROVED / NEEDS REVISION
