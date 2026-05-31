Implement a specific story from the hotel management system (BMAD Phase 4).

Usage: /project:bmad-implement [story-id]  (e.g., E1-S3)

Steps:
1. Read `_bmad-output/epics-stories.md` and find the specified story
2. Read `_bmad-output/project-context.md` for tech stack and conventions
3. Read `_bmad-output/architecture.md` for relevant schema/API context
4. Read any files in `apps/` or `packages/` relevant to the story
5. Implement the story:
   - Write code exactly per the Acceptance Criteria
   - Follow the tech stack and file structure in project-context.md
   - Do not implement more than the story requires
   - Do not leave placeholder TODOs unless explicitly noted in the story
6. After implementation, run a self-check:
   - Does every AC item pass?
   - Any TypeScript errors?
   - Any missing edge cases from the story's business rules?
7. Report: what was built, which files changed, and any follow-up items for the next story

Do not start implementation if prerequisites (prior stories in dependency chain) are not marked complete in epics-stories.md.
