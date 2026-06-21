# Feature Workflow

The process spine for building new features is the **superpowers** methodology (see [CLAUDE.md](../../CLAUDE.md) §Development Workflow): `brainstorming → using-git-worktrees → writing-plans → subagent-driven-development`/`executing-plans → test-driven-development → systematic-debugging → verification-before-completion → requesting-code-review → finishing-a-development-branch`. These skills auto-trigger; the project-specific reference below is the **execution detail** each step links into.

The superpowers `SessionStart` hook bootstraps the methodology automatically — no session-starter paste is needed. Code templates for pages, API routes, components, and validation schemas live in [feature-templates.md](./feature-templates.md).

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

### Domain-executor agents

See [CLAUDE.md](../../CLAUDE.md) §Development Workflow for the three executor agents (`db-agent`, `code-reviewer`, `maintenance-agent`) and when the superpowers subagent loop dispatches each. (There is no `feature-builder` — end-to-end feature building is the superpowers brainstorm→plan→subagent loop itself.)

### Skills

**Superpowers process skills** (the methodology layer, auto-triggering): `brainstorming`, `writing-plans`, `using-git-worktrees`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `finishing-a-development-branch`. See [CLAUDE.md](../../CLAUDE.md) §Development Workflow.

**Project domain skills** (execution detail the steps call into):

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

### Plan + in-session tasks

The superpowers `writing-plans` skill produces the task breakdown (small, individually verifiable tasks); `subagent-driven-development` / `executing-plans` work through it. Claude's task tools surface the live list in the UI.

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
| New agent or skill added                | Root CLAUDE.md §Available Agents, this doc's "Domain-executor agents" + "Skills" sections.                                      |
| New plugin installed / removed          | Root CLAUDE.md §Plugins table + §UI Skills table (if design-related), `.claude/rules/components.md` UI Skills section, roadmap. |

### What NOT to update

`.claude/docs/archive/` is frozen history. Don't touch it. If something there is still used as guidance, lift the content into a current doc and leave the archive untouched.

---

## Finishing — before a PR

This is the superpowers `finishing-a-development-branch` step. `verification-before-completion` requires evidence first — run the quality gate (the `pre-commit-gate` hook also enforces it at commit):

```bash
npm run lint        # ESLint + Prettier — must pass
npm run type-check  # tsc --noEmit — must pass
npm run build       # Includes lint + Next build — must pass
npm test            # Vitest — must pass (run affected tests at minimum)
```

`/check` runs lint → type-check → test in one go; `/pr-ready` runs the full gate and drafts the PR (does not create it). Then:

1. Run `requesting-code-review` (dispatches the `code-reviewer` agent over the diff).
2. Project-specific manual checklist:
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

## Orchestration

Orchestration is the superpowers spine (see [CLAUDE.md](../../CLAUDE.md) §Development Workflow): `subagent-driven-development` dispatches a fresh subagent per plan task; `dispatching-parallel-agents` handles independent domains concurrently. Key points:

- **Built-in subagents**: `Explore` (haiku, read-only search), `Plan` (sonnet, design), `general-purpose` (sonnet, multi-step).
- **When NOT to run the full spine**: single-file edits, trivial fixes, tasks already in progress, tasks where cold-context briefing costs more than the work — apply judgment.
- **Verify, don't trust**: a subagent's summary describes what it _intended_ to do. Check the actual diff before reporting work as done.
