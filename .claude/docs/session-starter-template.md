# Feature Session Starter

> **Mostly superseded (2026-06-21):** The **superpowers** plugin now bootstraps the methodology automatically via its `SessionStart` hook, and its `brainstorming` skill drives planning — you no longer need to paste a starter block to kick off the workflow. This template remains only as an optional way to front-load a feature's requirements and the "read these docs" reminders in one message. See [feature-workflow.md](./feature-workflow.md) and [CLAUDE.md](../../CLAUDE.md) §Development Workflow.

Copy the block below into Claude Code at the start of a new feature session if you want to front-load requirements.
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
