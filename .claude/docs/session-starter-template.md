# Feature Session Starter

Copy the block below into Claude Code at the start of every new feature session.
Replace the bracketed items with your actual feature details.

---

```
I'm building [feature name]: [one-sentence description].

Read .claude/docs/feature-workflow.md for the standard process.
Use context7 MCP for any library API question (Next 16, Prisma 7, Tailwind 4 are post-cutoff).
Follow all conventions in the CLAUDE.md files (root, src/, src/app/api/, prisma/) and .claude/rules/.

Requirements:
- [requirement 1]
- [requirement 2]
- [requirement 3]

Let's start with planning — what files need to be created or modified?
```

---

After Claude finishes planning, review the file list before approving. If the plan misses a fan-out step (Zod schema, public type, `revalidatePath`, seed update), call it out before implementation starts — these are the conventions that bite later if skipped.
