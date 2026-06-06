# Feature Workflow

The standard process for building new features. Paste [session-starter-template.md](./session-starter-template.md) at the start of every feature session.

Code templates for pages, API routes, components, and validation schemas live in [feature-templates.md](./feature-templates.md). Agent orchestration patterns live in [the orchestrator agent](../agents/orchestrator.md).

---

## Starting a New Feature

### Branch

```bash
git checkout main && git pull
git checkout -b feature/<short-kebab-name>
```

Use `feature/`, `fix/`, `chore/`, or `refactor/` prefixes.

> **Enforced:** The `pre-edit-branch-guard` hook (PreToolUse on `Edit|Write`) blocks all file edits on `main` and `develop`. You must create a feature branch before any code changes.

### Neon database branch (only if the feature touches `prisma/schema.prisma`)

For schema changes touching a table > 1k rows or dropping/renaming columns, create a Neon branch first. The [`prisma-neon`](../skills/prisma-neon/) skill walks through this.

Trivial additive schema changes (new optional column on a small table) can skip this and go straight to `prisma:migrate:dev`.

### Docs to read first (in order)

1. [CLAUDE.md](../../CLAUDE.md) — root. Critical rules + common mistakes.
2. [src/CLAUDE.md](../../src/CLAUDE.md) — frontend conventions.
3. [src/app/api/CLAUDE.md](../../src/app/api/CLAUDE.md) — API route skeleton + response shapes.
4. [prisma/CLAUDE.md](../../prisma/CLAUDE.md) — only if the feature touches the database.
5. The matching rule in [.claude/rules/](../rules/) for any file pattern you'll be editing.

### Available agents

Spawn an agent when the task matches its description — not for every step.

| Agent                 | When to use                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `orchestrator`        | Requests touching 3+ domains (schema + API + UI) or when the user says "orchestrate" / "full pipeline".           |
| `feature-builder`     | Net-new end-to-end feature (model + migration + API route + admin UI + public surface).                           |
| `db-agent`            | Schema changes, migrations, seed updates. Knows the Neon branching workflow.                                      |
| `synthesizer`         | Cross-domain integration check after multi-agent builds. Spawned by orchestrator in Patterns C/D.                 |
| `code-reviewer`       | Read-only review before opening the PR. Cites the specific rule each issue violates.                              |
| `refactor-agent`      | Bringing existing code in line with conventions. File-by-file. Logs to `refactor-log.md`.                         |
| `documentation-agent` | Update project docs (CLAUDE.md, roadmap, rules) after significant changes. Run when post-commit hook suggests it. |

### Skills

- [`nextjs-app-router`](../skills/nextjs-app-router/) — new route segment, layout, loading state, error boundary, `proxy.ts`.
- [`tailwind-v4`](../skills/tailwind-v4/) — adding/changing Tailwind classes or theme tokens (no JS config file in v4).
- [`prisma-neon`](../skills/prisma-neon/) — any Prisma + Neon operation, especially safe migration testing.
- [`aws-deploy`](../skills/aws-deploy/) — Amplify deploys, env var changes, S3/CloudFront/SES/Cognito operations.
- [`excalidraw-diagram`](../skills/excalidraw-diagram/) — generate visual architecture diagrams in Excalidraw format (`.excalidraw`).
- [`aws-architecture-diagram`](../skills/aws-architecture-diagram/) — generate AWS infrastructure diagrams in draw.io format (`.drawio`) with a companion markdown guide.

### Slash commands

Three project slash commands are available in `.claude/commands/`:

| Command      | What it does                                                                               |
| ------------ | ------------------------------------------------------------------------------------------ |
| `/check`     | Runs `lint` → `type-check` → `test` sequentially and reports a pass/fail summary table.    |
| `/new-route` | Scaffolds a new API route at the path you pass, following all `api-routes.md` conventions. |
| `/pr-ready`  | Runs the full quality gate, then drafts a PR title + description. Does NOT create the PR.  |

---

## Adding a New Page (App Router)

### Location

```
src/app/(public)/<segment>/page.tsx        # Server Component with ISR
src/app/(public)/<segment>/loading.tsx     # Skeleton matching the page layout
src/app/(public)/<segment>/error.tsx       # Recoverable error boundary (optional)
```

Admin pages: `src/app/(admin)/admin/(shell)/<segment>/page.tsx` — Client Components by default.

### Server vs Client decision

| Area                           | Default                   | Add `"use client"` when                                         |
| ------------------------------ | ------------------------- | --------------------------------------------------------------- |
| `src/app/(public)/**/page.tsx` | **Server** with ISR       | Almost never. Push interactivity into a child client component. |
| `src/app/(admin)/**/page.tsx`  | **Client**                | Default for admin.                                              |
| `src/components/public/**`     | Server unless interactive | Lightboxes, carousels, forms.                                   |
| `src/components/admin/**`      | **Client**                | Always — admin UI is form-heavy.                                |

### Data fetching

- **Public pages:** always go through [src/lib/data/public-queries.ts](../../src/lib/data/public-queries.ts). Never call Prisma from a page component.
- **Loading states:** `loading.tsx` should mirror the page layout with `bg-muted animate-pulse` placeholders.
- **Error boundaries:** `error.tsx` is a Client Component accepting `{ error, reset }`.

See [feature-templates.md](./feature-templates.md) for the full page, query, and component templates.

---

## Adding a New API Route

### Location

```
src/app/api/<resource>/route.ts          # Collection endpoint (GET, POST)
src/app/api/<resource>/[id]/route.ts     # Single resource (GET, PATCH, DELETE)
```

### Response shapes (only three)

```ts
{ data: T }                              // Single resource
{ data: T[], meta: { total, page, limit, totalPages } }  // Collection
{ error: { message, code, details? } }   // Error (set by withErrorHandler)
```

### Status codes

| Code | When                                                        |
| ---- | ----------------------------------------------------------- |
| 200  | GET / PUT / PATCH success                                   |
| 201  | POST that created a resource                                |
| 204  | DELETE with no body — `new Response(null, { status: 204 })` |
| 400  | Validation — `ErrorCodes.VALIDATION_ERROR`                  |
| 401  | Auth missing/invalid — `ErrorCodes.UNAUTHORIZED`            |
| 404  | Resource not found — `ErrorCodes.NOT_FOUND`                 |
| 409  | Slug / unique conflict — `ErrorCodes.CONFLICT`              |
| 429  | Rate limit — `ErrorCodes.RATE_LIMIT_EXCEEDED`               |

### Cache invalidation

After mutations affecting public pages, call `revalidatePath`:

- Project changes → `/projects` (and `/` if `featured`).
- Blog post → `/blog` and `/blog/${slug}`.
- Hero / About / Settings → `/`.

See [feature-templates.md](./feature-templates.md) for the full API route template.

---

## Adding a New Database Model

Schema rules: [.claude/rules/prisma-schema.md](../rules/prisma-schema.md). Migration workflow: [prisma/CLAUDE.md](../../prisma/CLAUDE.md).

### Migration workflow

```bash
npm run prisma:format            # Validates + formats
npm run prisma:migrate:dev -- --name descriptive_name
npm run prisma:generate
npm run type-check
```

Before running `migrate:dev`, ask the `prisma-local` MCP for `migrate-status` first.

**NEVER** run `prisma migrate reset` without explicit, typed user confirmation.

### After the schema change — fan-out checklist

- [ ] Update Zod schema in [src/lib/validations/<entity>.ts](../../src/lib/validations/).
- [ ] Update public type in [src/lib/data/types.ts](../../src/lib/data/types.ts) (if publicly exposed).
- [ ] Update or add the query in [src/lib/data/public-queries.ts](../../src/lib/data/public-queries.ts).
- [ ] Update seed in [prisma/seed.ts](../../prisma/seed.ts) (use `prisma.upsert` for idempotency).
- [ ] `npm run type-check` clean.

---

## Adding New UI Components

### Location + naming

```
src/components/public/<PascalCase>.tsx     # Public-site components
src/components/admin/<PascalCase>.tsx      # Admin-only components
src/components/shared/<PascalCase>.tsx     # Components used in both public and admin (e.g. ThemeToggle)
src/components/ui/<lowercase>.tsx          # shadcn primitives — do not hand-edit
```

### Key patterns

- Class composition: always `cn()`. Never template-literal concatenation.
- Variants: CVA — reference [src/components/ui/button.tsx](../../src/components/ui/button.tsx).
- Theme tokens over hardcoded colors. `dark:` variants only when no token fits.
- Forms: react-hook-form + zodResolver + Sonner toasts + TanStack Query mutations.
- Client data: `apiClient` wrapped in TanStack Query. Never `fetch` directly.

See [feature-templates.md](./feature-templates.md) for the full component and validation schema templates.

---

## Testing

Full rules in [.claude/rules/tests.md](../rules/tests.md).

### When to add a test

- **Always** — new code in `src/lib/validations/`, `src/lib/errors.ts`, `src/app/api/auth.ts`, or any helper with branching logic.
- **At minimum a happy-path + auth-check test** — every new API route.
- **Skip** — pure pass-through Prisma wrappers, shadcn primitives, type-only assertions.

### Running

```bash
npm test                       # Watch mode
npm test -- --run              # Single run
npm test -- --run <path>       # Single file
npm run test:ci                # vitest run --coverage
```

---

## Tracking Progress

### In-session — tasks (automatic)

Claude's task tools track the current task list and surface it in the UI. Kicks in automatically for tasks with 3+ steps.

### Mid-session / hand-off — plan files

For multi-day features, optionally check in a scratchpad at `.claude/docs/wip-<feature-slug>.md` with decisions made, open questions, and next steps. Delete when the feature merges.

### Cross-session / durable — the PR

The PR description is the authoritative record. Link the WIP doc, key commits, and external context.

---

## Keeping Docs Honest

### At feature start — drift check

Skim docs you'll rely on for staleness. Common drift spots:

- File path examples in CLAUDE.md / rules that reference renamed/moved files.
- "Common Mistakes" entries for bugs that have been fixed.
- Skill files quoting patterns the codebase no longer uses.

### At feature end — propagate the change

| Change                                  | Update                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| New env var                             | Root CLAUDE.md §Environment Setup, amplify.yml, `.env.example`.                                                                 |
| New directory / naming convention       | Root CLAUDE.md §Architecture, matching `.claude/rules/` file.                                                                   |
| New pattern for future features         | The relevant section of this doc or `feature-templates.md`.                                                                     |
| New gotcha / footgun                    | Root CLAUDE.md §Common Mistakes.                                                                                                |
| New MCP server installed / removed      | Root CLAUDE.md §MCP Servers, `.claude/docs/infrastructure.md` if AWS-related.                                                   |
| Library version bump changing API shape | Search `grep -rn '<old-api>' .claude/ CLAUDE.md src/`.                                                                          |
| New agent or skill added                | Root CLAUDE.md §Available Agents, this doc's "Available agents" + "Skills" tables.                                              |
| New plugin installed / removed          | Root CLAUDE.md §Plugins table + §UI Skills table (if design-related), `.claude/rules/components.md` UI Skills section, roadmap. |

### What NOT to update

`.claude/docs/archive/` is frozen history. Don't touch it. If something there is still used as guidance, lift the content into a current doc and leave the archive untouched.

---

## Before Creating a PR

```bash
npm run lint        # ESLint + Prettier — must pass
npm run type-check  # tsc --noEmit — must pass
npm run build       # Includes lint + Next build — must pass
npm test            # Vitest — must pass (run affected tests at minimum)
```

Then:

1. Spawn the `code-reviewer` agent over the diff.
2. Manual checklist:
   - [ ] Every API mutation affecting a public page calls `revalidatePath`.
   - [ ] New env vars wired through [amplify.yml](../../amplify.yml). No `AWS_*` names — use `APP_AWS_*`.
   - [ ] No `pageSize` introduced (use `page` + `limit`).
   - [ ] No `{ data: { success: true } }` response shape.
   - [ ] No `import "dotenv/config"` in app code.
   - [ ] No new files under `src/types/`.
   - [ ] No new Zustand stores.
   - [ ] Touched docs match the code change.
   - [ ] No edits to `.claude/docs/archive/`.
   - [ ] Tests added for new logic; tests updated for behavior changes.

---

## Agent & Subagent Orchestration

See [the orchestrator agent](../agents/orchestrator.md) for the full playbook (patterns A/B/C/D, spawn rules, model selection). Key points:

### Built-in subagents

| Subagent          | When to use                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `Explore`         | Read-only codebase search. Cheap; spawn 2-3 in parallel. Default model: `haiku`.          |
| `Plan`            | Designing a non-trivial change before edits. Default model: `sonnet`.                     |
| `general-purpose` | Multi-step research or execution when no specialized agent fits. Default model: `sonnet`. |

### Models

| Agent / subagent  | Default model | Override to `opus` when                                         |
| ----------------- | ------------- | --------------------------------------------------------------- |
| `orchestrator`    | `sonnet`      | Novel architectural decisions across many domains.              |
| `feature-builder` | `sonnet`      | High-stakes feature where one-pass quality matters.             |
| `db-agent`        | `sonnet`      | Unusually tricky migration (cross-table backfill, custom SQL).  |
| `code-reviewer`   | `haiku`       | Security-sensitive diff (auth, payment, PII handling).          |
| `refactor-agent`  | `sonnet`      | Bulk rewrite touching cross-cutting abstractions.               |
| `Explore`         | `haiku`       | Search query requires synthesizing across many unrelated files. |
| `Plan`            | `sonnet`      | Plan needs to weigh several architectural alternatives.         |
| `general-purpose` | `sonnet`      | Multi-step task with unusual reasoning load.                    |

### When NOT to spawn

- Single-file edits where you already know what to change.
- Tasks already in progress in the main session.
- Tasks small enough that cold-context briefing costs more than the work.
- "Just to be safe" reviews of trivial diffs.

### Verify, don't trust

An agent's summary describes what it _intended_ to do. Check the actual diff before reporting work as done.
