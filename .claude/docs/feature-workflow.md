# Feature Workflow

The standard process for building new features in this repo. Paste [session-starter-template.md](./session-starter-template.md) at the start of every feature session — that prompt will point Claude here.

This doc is grounded in the **current** (post-refactor) codebase. Examples are lifted directly from working files; if you change a pattern in the code, update the example here too.

---

## Starting a New Feature

### Branch

```bash
git checkout main && git pull
git checkout -b feature/<short-kebab-name>
```

Use `feature/`, `fix/`, `chore/`, or `refactor/` prefixes. Keep the slug short and descriptive (`feature/blog-comments`, not `feature/add-the-new-blog-comments-system`).

### Neon database branch (only if the feature touches `prisma/schema.prisma`)

For any schema change that touches a table > 1k rows or drops/renames columns, create a Neon branch first and test the migration there. The [`prisma-neon`](../skills/prisma-neon/) skill walks through this. The short version:

1. Create a branch in the Neon console (or via `prisma-local` MCP).
2. Point `.env.test` at the branch URL.
3. `npm run prisma:migrate:deploy` against the branch.
4. Verify, then merge the migration to `main` and let Amplify deploy.

Trivial additive schema changes (new optional column on a small table) can skip this and go straight to `prisma:migrate:dev`.

### Docs to read first (in order)

1. [CLAUDE.md](../../CLAUDE.md) — root. Critical rules + common mistakes.
2. [src/CLAUDE.md](../../src/CLAUDE.md) — frontend conventions (component naming, Server/Client decision, state management).
3. [src/app/api/CLAUDE.md](../../src/app/api/CLAUDE.md) — API route skeleton + response shapes.
4. [prisma/CLAUDE.md](../../prisma/CLAUDE.md) — only if the feature touches the database.
5. The matching rule in [.claude/rules/](../rules/) for any file pattern you'll be editing.

### Available agents

Spawn an agent when the task matches its description — not for every step.

| Agent             | When to use                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------- |
| `feature-builder` | Net-new end-to-end feature (model + migration + API route + admin UI + public surface).   |
| `db-agent`        | Schema changes, migrations, seed updates. Knows the Neon branching workflow.              |
| `code-reviewer`   | Read-only review before opening the PR. Cites the specific rule each issue violates.      |
| `refactor-agent`  | Bringing existing code in line with conventions. File-by-file. Logs to `refactor-log.md`. |

### Skills

Invoke when the task matches the skill's trigger:

- [`nextjs-app-router`](../skills/nextjs-app-router/) — new route segment, layout, loading state, error boundary, `proxy.ts`.
- [`tailwind-v4`](../skills/tailwind-v4/) — adding/changing Tailwind classes or theme tokens (no JS config file in v4).
- [`prisma-neon`](../skills/prisma-neon/) — any Prisma + Neon operation, especially safe migration testing.
- [`aws-deploy`](../skills/aws-deploy/) — Amplify deploys, env var changes, S3/CloudFront/SES/Cognito operations.

---

## Adding a New Page (App Router)

### Location

```
src/app/(public)/<segment>/
├── page.tsx        # Server Component with ISR
├── loading.tsx     # Skeleton matching the page layout
└── error.tsx       # Recoverable error boundary (optional but recommended)
```

Admin pages live under `src/app/(admin)/admin/<segment>/` and default to Client Components. Public pages default to Server Components.

### Server vs Client decision

| Area                           | Default                   | Add `"use client"` when                                                  |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------ |
| `src/app/(public)/**/page.tsx` | **Server** with ISR       | Almost never. Push interactivity into a child client component.          |
| `src/app/(admin)/**/page.tsx`  | **Client**                | Default for admin. The dashboard is currently the only server exception. |
| `src/components/public/**`     | Server unless interactive | Lightboxes, carousels, forms.                                            |
| `src/components/admin/**`      | **Client**                | Always — admin UI is form-heavy.                                         |

### Data fetching (public)

Always go through [src/lib/data/public-queries.ts](../../src/lib/data/public-queries.ts). Never call Prisma from a page component.

```ts
// src/lib/data/public-queries.ts
export async function getAboutPageIntro(): Promise<AboutPage | null> {
  try {
    return await prisma.aboutPage.findUnique({ where: { id: "default" } });
  } catch (error) {
    console.error("Failed to fetch about page intro:", error);
    return null;
  }
}
```

Public types come from [src/lib/data/types.ts](../../src/lib/data/types.ts) — do NOT add new files under `src/types/`.

### Page template (real, from `src/app/(public)/about/page.tsx`)

```tsx
import { Metadata } from "next";
import { getAboutPageIntro, getHero } from "@/lib/data/public-queries";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about ...",
};

// ISR — rebuild this page at most once per hour
export const revalidate = 3600;

const DEFAULT_HEADING = "About Me";

export default async function AboutPage() {
  // Fetch in parallel — never serialize unrelated queries
  const [intro, hero] = await Promise.all([getAboutPageIntro(), getHero()]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground">{intro?.heading ?? DEFAULT_HEADING}</h1>
        <p className="mt-2 text-muted-foreground">{intro?.subheading}</p>
      </div>
      {/* ... */}
    </div>
  );
}
```

### Loading + error states

`loading.tsx` should mirror the page layout with `bg-muted animate-pulse` placeholders — see [src/app/(public)/about/loading.tsx](<../../src/app/(public)/about/loading.tsx>) for the reference pattern. Skeletons that don't match the layout cause visible reflow on hydration.

`error.tsx` is a Client Component (`"use client"`) and accepts `{ error, reset }`. Keep it minimal — log to console and offer a reset button.

---

## Adding a New API Route

### Location

```
src/app/api/<resource>/route.ts          # Collection endpoint (GET, POST)
src/app/api/<resource>/[id]/route.ts     # Single resource (GET, PATCH, DELETE)
```

### Standard response shapes (only three)

```ts
{ data: T }                              // Single resource
{ data: T[], meta: { total, page, limit, totalPages } }  // Collection
{ error: { message, code, details? } }   // Error (set by withErrorHandler)
```

Never wrap in `{ data: { success: true } }`. Use `204 No Content` for empty-success cases (DELETE, sign-out).

### Skeleton (real, from `src/app/api/projects/route.ts`)

```ts
import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, ProjectStatus, prisma } from "@/lib/prismaClient";
import { projectCreateSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "PUBLISHED";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  // Conditional auth — check the param first, then require auth only for the privileged branch
  if (status === "all" || status === "DRAFT") {
    await requireAuth();
  }

  const where: Prisma.ProjectWhereInput = {};
  if (status !== "all") where.status = status as ProjectStatus;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return Response.json({
    data: projects,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const existing = await prisma.project.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    throw new ApiError("A project with this slug already exists", 409, ErrorCodes.CONFLICT);
  }

  const project = await prisma.project.create({ data: parsed.data });

  revalidatePath("/projects");
  if (project.featured) revalidatePath("/");

  return Response.json({ data: project }, { status: 201 });
});
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

After any mutation affecting a public page, call `revalidatePath` for every affected route. Common pairs:

- Project changes → `/projects` (and `/` if `featured`).
- Project by slug → also `/projects/${slug}`.
- Blog post → `/blog` and `/blog/${slug}`.
- Hero / About / Settings → `/`.

### Rate limiting

`await rateLimit(key, limit, windowMs)` from [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) — it's async (Upstash-backed). Missing `await` silently returns `undefined.success` → spurious 429s. Used today by `/api/contact` (5 / 15min) and `/api/upload` (20 / 1min).

### What NOT to do

- ❌ `try/catch` inside the handler — let `withErrorHandler` catch.
- ❌ `NextResponse.json` — use the global `Response.json`.
- ❌ `Record<string, unknown>` for where clauses — use `Prisma.<Model>WhereInput`.
- ❌ `new URL(request.url).searchParams` — use `request.nextUrl.searchParams`.
- ❌ `pageSize` — use `page` + `limit`.
- ❌ `new PrismaClient()` — import `prisma` from `@/lib/prismaClient`.
- ❌ `requireAuth` from `@/lib/auth` — that path doesn't exist. Use `@/app/api/auth`.

---

## Adding a New Database Model

### Schema rules (see [.claude/rules/prisma-schema.md](../rules/prisma-schema.md))

- Model name: `PascalCase`, singular (`Comment`, not `Comments`).
- ID: `String @id @default(cuid())`. No UUIDs, no auto-increment ints.
- Timestamps: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`. Skip both only for true singletons.
- Slugs: `slug String @unique` + `@@index([slug])` for any model with a public detail page.
- Display ordering: `displayOrder Int @default(0)` + `@@index([status, displayOrder])`.
- Long text: `@db.Text`. Bounded text: `@db.VarChar(N)` with a realistic limit.
- Tag arrays: Postgres `String[]` — don't introduce a join table for simple tag lists.
- New FK: explicit `<rel>Id String` column + `@relation(..., onDelete: <Cascade|Restrict|SetNull>)` + `@@index([<rel>Id])`. Always specify `onDelete`.
- Many-to-many: explicit join table (a model with both FKs). Don't use Prisma's implicit M:N.
- Section divider comment (`// ═══ MODEL NAME ═══`) between top-level models.

### Migration workflow

```bash
# 1. Edit prisma/schema.prisma
npm run prisma:format            # Validates + formats
npm run prisma:migrate:dev -- --name descriptive_name
npm run prisma:generate
npm run type-check
```

Before running `migrate:dev`, ask the `prisma-local` MCP for `migrate-status` first — surfaces drift between local schema, migration history, and the database.

**NEVER** run `prisma migrate reset` without explicit, typed user confirmation. It drops all data.

### Renames and drops

Prisma's default migration SQL is drop + add — it loses data. For renames, generate the migration then hand-edit the SQL to use `ALTER TABLE ... RENAME COLUMN`. For drops, do a two-phase migration: (1) deploy code that no longer reads the column, (2) follow-up migration that drops it.

### After the schema change — fan-out checklist

- [ ] Update Zod schema in [src/lib/validations/<entity>.ts](../../src/lib/validations/).
- [ ] Update public type in [src/lib/data/types.ts](../../src/lib/data/types.ts) (if the field is publicly exposed).
- [ ] Update or add the query in [src/lib/data/public-queries.ts](../../src/lib/data/public-queries.ts).
- [ ] Update seed in [prisma/seed.ts](../../prisma/seed.ts) (use `prisma.upsert` for idempotency).
- [ ] `npm run type-check` clean.
- [ ] If the change invalidates a template in this `feature-workflow.md`, update the template to match.
- [ ] If the change reflects a new pattern future schema work should follow, add it to [prisma/CLAUDE.md](../../prisma/CLAUDE.md) or [.claude/rules/prisma-schema.md](../rules/prisma-schema.md).

---

## Adding New UI Components

### Location + naming

```
src/components/public/<PascalCase>.tsx     # Public-site components
src/components/admin/<PascalCase>.tsx      # Admin-only components
src/components/ui/<lowercase>.tsx          # shadcn primitives — do not hand-edit
```

shadcn primitives are added via `npx shadcn@latest add <component>` — never edit them by hand, or the registry drifts.

### Patterns

- Class composition: always `cn()` from [src/lib/utils.ts](../../src/lib/utils.ts). Never template-literal concatenation.
- Variants: CVA — reference [src/components/ui/button.tsx](../../src/components/ui/button.tsx).
- Theme tokens (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `bg-accent`, `bg-primary`/`text-primary-foreground`) over hardcoded colors. `dark:` variants only when no token expresses the contrast (e.g. status banners).
- Forms: react-hook-form + `@hookform/resolvers/zod` + Sonner toasts + TanStack Query mutations. No exceptions.
- Client data: `apiClient` from [src/lib/api-client.ts](../../src/lib/api-client.ts) wrapped in TanStack Query. Never `fetch` directly.

### Component template (real, from `src/components/public/ProjectCard.tsx`)

```tsx
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: {
    slug: string;
    title: string;
    shortDescription: string;
    techTags: string[];
    thumbnailImage: string;
    liveUrl?: string | null;
  };
  priority?: boolean;
}

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/projects/${project.slug}`}>
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        </div>
      </Link>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {project.shortDescription}
        </p>
      </div>
    </article>
  );
}
```

No `"use client"` — this is a Server Component. Add the directive only if you use hooks, event handlers, or browser APIs.

### Validation schema template (real, from `src/lib/validations/project.ts`)

```ts
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const projectBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  shortDescription: z.string().min(1, "Short description is required").max(300),
  techTags: z.array(z.string().max(50)).min(1, "At least one tech tag required"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const projectCreateSchema = projectBaseSchema;
export const projectUpdateSchema = projectBaseSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
```

Always export both schema and inferred type. Derive PATCH schemas via `.partial()` — don't duplicate.

---

## Testing

This project uses **Vitest** for unit + integration tests. Full rules in [.claude/rules/tests.md](../rules/tests.md). The workflow guidance:

### When to add a test

- **Always** — new code in [src/lib/validations/](../../src/lib/validations/), [src/lib/errors.ts](../../src/lib/errors.ts), [src/app/api/auth.ts](../../src/app/api/auth.ts), or any new helper with branching logic.
- **At minimum a happy-path + auth-check test** — every new API route. Place at `src/app/api/<route>/route.test.ts`. Invoke the exported handler with a constructed `NextRequest` — don't spin up a server.
- **Skip** — pure pass-through Prisma wrappers (Prisma already validates), shadcn primitives (third-party), type-only assertions (`tsc` covers them).

### When to update a test

If your change alters observable behavior, find the existing test and update it in the same commit:

```bash
grep -rn '<changed-symbol>' --include="*.test.ts" --include="*.test.tsx"
```

A passing test suite that no longer reflects reality is worse than no tests — it manufactures false confidence.

### Running

```bash
npm test                       # Watch mode (Vitest default)
npm test -- --run              # Single run
npm test -- --run <path>       # Single file
npm run test:ci                # vitest run --coverage
```

Run the affected tests locally before opening the PR. CI runs the full suite via `npm run test:ci`.

### Test data

Builders live in `src/test/factories/` (create the directory when the first builder is needed). Don't inline large fixtures.

Do not mock the Prisma client per-test — use a real Postgres test database (Neon branch is ideal — see [prisma/CLAUDE.md](../../prisma/CLAUDE.md)). Mocked DBs hide migration drift.

---

## Tracking Progress

Three layers, each owning a different time horizon:

### In-session — `TodoWrite` (automatic)

Claude's `TodoWrite` tool tracks the current task list and surfaces it in the UI. It kicks in automatically for any task ≥ 3 steps. You don't need to do anything — but if you see Claude skipping it on a complex task, prompt `use the todo list`.

### Mid-session / hand-off — plan files

Every time Claude enters plan mode, the harness writes a plan to `~/.claude/plans/<slug>.md` (e.g. `~/.claude/plans/do-phase-7-to-reactive-harp.md`). These are durable across sessions on the same machine — useful when you stop mid-feature and resume tomorrow.

For multi-day features, optionally check in a scratchpad at `.claude/docs/wip-<feature-slug>.md` with:

- **Decisions made** (and why — links to PR/Slack/issue threads)
- **Open questions** waiting on humans
- **Next steps** so a future session can resume cold

Delete the WIP doc when the feature merges — its purpose is hand-off, not history.

### Cross-session / durable — the PR

The PR description is the authoritative record. Link the WIP doc, key commits, and any external context (issue, design doc). After merge, the PR is the artifact future developers will find via `git log` and `git blame`.

---

## Keeping Docs Honest

Docs drift faster than anyone notices. Treat them as code: check at the start, update at the end.

### At feature start — drift check

Before designing, open the docs you'll rely on for this feature and skim for staleness. If a rule cites a file path that no longer exists, a convention that the code no longer follows, or an MCP that's been replaced — flag it, fix it, then start the feature.

Common drift spots:

- File path examples in CLAUDE.md / rules that referenced renamed/moved files.
- "Common Mistakes" entries describing bugs that have since been fixed (rule is now obsolete).
- Skill files (`.claude/skills/*`) that quote a pattern the codebase no longer uses.
- `feature-workflow.md` templates whose source file has changed shape since the template was lifted.

### At feature end — propagate the change

If your feature changes how things are done, update every doc that references the old way. Use this table to decide what to touch:

| Change                                         | Update                                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| New env var                                    | Root [CLAUDE.md](../../CLAUDE.md) §Environment Setup, [amplify.yml](../../amplify.yml), `.env.example`.               |
| New directory, new file naming convention      | Root [CLAUDE.md](../../CLAUDE.md) §Architecture, matching [.claude/rules/](../rules/) file.                           |
| New pattern that future features should follow | The relevant section of this `feature-workflow.md` (replace the template if the example is now wrong).                |
| New "gotcha" / footgun discovered              | Root [CLAUDE.md](../../CLAUDE.md) §Common Mistakes.                                                                   |
| New MCP server installed / removed             | Root [CLAUDE.md](../../CLAUDE.md) §MCP Servers, [.claude/docs/infrastructure.md](./infrastructure.md) if AWS-related. |
| Library version bump that changes API shape    | Anywhere the old API is shown — search `grep -rn '<old-api>' .claude/ CLAUDE.md src/`.                                |
| New agent or skill added                       | Root [CLAUDE.md](../../CLAUDE.md) §Available Agents, "Available agents" + "Skills" tables in this doc.                |

If you delete a file, `grep -rn '<filename>' --include="*.md"` and fix every reference (or repoint to an archive copy, like the post-refactor cleanup did with `audit.md`).

### What NOT to update

`.claude/docs/archive/` is frozen history. Don't touch it — not for drift fixes, not for path repointing, not for stylistic edits. Archived docs intentionally capture the state of the project at the time of archiving; "fixing" them erases that signal. If an active doc still links to an archived file (e.g. the `code-reviewer` agent references `archive/audit.md` as an anti-pattern catalog), that's by design — the archive is a historical reference, not a live source of truth.

If something in an archived doc is materially wrong AND still being used as guidance, the right move is to lift the still-useful content into a current doc, then leave the archive untouched.

### Heuristic

If the change you're shipping would have made an earlier session easier _if it had been documented_, document it now. Future-you (or future-Claude) will hit the same wall otherwise.

---

## Before Creating a PR

```bash
npm run lint        # ESLint + Prettier — must pass
npm run type-check  # tsc --noEmit — must pass
npm run build       # Includes lint + Next build — must pass
npm test            # Vitest — must pass (run the affected tests at minimum)
```

Then:

1. Spawn the `code-reviewer` agent. It reviews against the rules in [.claude/rules/](../rules/) and cites the specific rule each issue violates.
2. Manual checklist:
   - [ ] Every API mutation that affects a public page calls `revalidatePath`.
   - [ ] New env vars wired through [amplify.yml](../../amplify.yml) (not just `.env`). No `AWS_*` names — use `APP_AWS_*`.
   - [ ] No `pageSize` introduced (use `page` + `limit`).
   - [ ] No response shape like `{ data: { success: true } }`.
   - [ ] No `import "dotenv/config"` in app code (only `prisma.config.ts` needs it).
   - [ ] No new files under `src/types/` (that directory is being phased out — use `src/lib/data/types.ts`).
   - [ ] No new Zustand stores (the dep is listed but unused — keep it that way).
   - [ ] Touched docs match the code change (CLAUDE.md, `.claude/rules/`, `.claude/skills/`, `feature-workflow.md` examples). See §Keeping Docs Honest for the propagation table.
   - [ ] No new convention introduced without a corresponding CLAUDE.md or rule-file update.
   - [ ] No edits to anything under `.claude/docs/archive/` (frozen by policy — see §Keeping Docs Honest).
   - [ ] Tests added for new logic in `src/lib/` or `src/app/api/` (see §Testing for what to skip).
   - [ ] Tests updated for any behavior change (`grep -rn '<changed-symbol>' --include="*.test.ts"` and fix matches).

---

## Available Tools

### MCP servers

Use these **before** assuming an API detail, especially for post-cutoff library versions.

| Server         | Scope | When to use                                                                                          |
| -------------- | ----- | ---------------------------------------------------------------------------------------------------- |
| `context7`     | user  | Live docs for Next 16, Prisma 7, Tailwind 4. Always check before assuming syntax in these libraries. |
| `aws-docs`     | user  | AWS service behavior (Amplify SSR caveats, SES sandbox limits, Cognito token TTLs).                  |
| `aws-iac`      | user  | Low priority here — infra is Amplify Console-managed, not CloudFormation/CDK.                        |
| `prisma-local` | local | `migrate-status` before any `migrate-dev`. Never `migrate-reset` without typed confirmation.         |
| `aws-api`      | local | Deploy state + S3/SES/Cognito config checks. Uses standard AWS SDK creds.                            |

See [.claude/docs/infrastructure.md](./infrastructure.md) for canonical AWS resource names referenced by `aws-api` calls.

### Skills

Invoke via `Skill` when the task matches the trigger — listed under "Starting a New Feature" above.

### Agents

Spawn via the `Agent` tool only when the task matches an agent's description. The full breakdown — built-in subagents, project agents, orchestration patterns — is in the next section.

---

## Agent & Subagent Orchestration

Each agent spawn starts **cold** — it re-derives context you already have, on a fresh token budget. That makes spawning a real cost, not a free win. Two reasons to do it anyway:

1. **Context isolation** — large search results / agent traces stay out of the main session.
2. **Specialization** — a project agent already knows the conventions for its domain.

### Built-in subagents (from the `Agent` tool)

| Subagent          | When to use                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Explore`         | Read-only codebase search — "where is X defined / which files reference Y." Pass a breadth hint (`quick` / `medium` / `very thorough`). Cheap; spawn 2–3 in parallel. |
| `Plan`            | Designing a non-trivial change before edits. Returns a step-by-step plan with critical files identified. Use when scope spans multiple areas.                         |
| `general-purpose` | Multi-step research or execution when no specialized agent fits.                                                                                                      |

### Project agents

| Agent             | When to use                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `orchestrator`    | Multi-domain features (3+ areas) or user explicitly asks for orchestration. Strict-delegate.      |
| `feature-builder` | Net-new end-to-end feature (model + migration + API route + admin UI + public surface).           |
| `db-agent`        | Schema changes, migrations, seed updates. Knows the Neon branching workflow.                      |
| `code-reviewer`   | Read-only review against `.claude/rules/`. Cites the specific rule each issue violates.           |
| `refactor-agent`  | Bring existing code in line with conventions. The original refactor is done — this is on standby. |

### Models

Project agents have a default model set in their frontmatter. Built-in subagents don't have a definition file — pass `model:` on the `Agent` call.

| Agent / subagent  | Default model | Override to `opus` when                                                                     |
| ----------------- | ------------- | ------------------------------------------------------------------------------------------- |
| `orchestrator`    | `sonnet`      | Genuinely novel architectural decisions across many domains.                                |
| `feature-builder` | `sonnet`      | High-stakes feature where one-pass quality matters more than speed/cost.                    |
| `db-agent`        | `sonnet`      | Unusually tricky migration (e.g. cross-table data backfill, custom SQL).                    |
| `code-reviewer`   | `sonnet`      | Security-sensitive diff (auth, payment, PII handling).                                      |
| `refactor-agent`  | `sonnet`      | Bulk rewrite touching cross-cutting abstractions.                                           |
| `Explore`         | `haiku`       | Search query requires synthesizing across many unrelated files.                             |
| `Plan`            | `sonnet`      | Plan needs to weigh several architectural alternatives, not just sequence known steps.      |
| `general-purpose` | `sonnet`      | Multi-step task with unusual reasoning load.                                                |

Default is `sonnet` for engineering, `haiku` for `Explore` (fast search + summarize). Pass `model: opus` on the `Agent` call only when the task warrants it — opus is slower and more expensive, so reserve it.

### Orchestration patterns

**Pattern A — Explore-first.** Before designing anything non-trivial, spawn 1–3 `Explore` agents in parallel (single message, multiple `Agent` calls) to map the affected code. Their summaries come back to the main session; the bulky file reads stay in their context. Then design from the summaries.

**Pattern B — Build → Review.** Spawn `feature-builder` to implement the feature, then spawn `code-reviewer` over the resulting diff before opening the PR. The reviewer didn't see the builder's reasoning, so its feedback is independent.

**Pattern C — DB-first feature.** `db-agent` (schema + migration on a Neon branch) → `feature-builder` (Zod schema + API route + admin UI + public read) → `code-reviewer`. Run sequentially — each depends on the previous step's output.

**Pattern D — Orchestrator-driven.** Main session spawns `orchestrator` with the full feature spec. Orchestrator picks the underlying sub-pattern (usually C plus tests), spawns `db-agent` → `feature-builder` → `code-reviewer` in sequence, verifies between steps, and reports back a structured summary. Use for multi-domain features (3+ areas) or when you want standardized "ready-for-PR" output. **Tradeoff:** adds one cold-start layer (main → orchestrator → subagent). For 2-step flows, spawn directly from main and skip the orchestrator.

**Parallel spawning.** When agents are independent (e.g. two `Explore` agents searching different areas), put both `Agent` calls in **one** message. Sequential `Agent` calls in separate messages waste round-trips.

### When NOT to spawn

- Single-file edits where you already know what to change.
- Tasks already in progress in the main session — spawning re-briefs from zero, throwing away the warm context.
- Tasks small enough that the cold-context briefing costs more than the work itself.
- "Just to be safe" reviews of trivial diffs — code-reviewer is for non-trivial changes.

### Verify, don't trust

An agent's summary describes what it _intended_ to do. When an agent edits files, check the actual diff before reporting work as done — agents can over-state success.
