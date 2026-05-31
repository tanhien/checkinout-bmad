Add a new skill to the project's `.claude/commands/` directory and register it in the skill index.

Usage: /project:bmad-add-skill [skill-name] [description]

Steps:
1. Read the existing skills in `.claude/commands/` to understand conventions
2. Create `.claude/commands/{skill-name}.md` with clear, actionable instructions
3. Update `.claude/commands/README.md` (create if not exists) to add the skill to the index
4. Report: skill name, what it does, and how to invoke it

Skill file format:
- Start with a one-line description of what the skill does
- Include "Usage:" line if the skill takes arguments  
- List numbered steps that Claude should follow
- Be prescriptive — tell Claude exactly what to read, generate, and report
- Do NOT add generic advice or obvious steps
