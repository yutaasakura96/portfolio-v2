# Portfolio v2

Personal portfolio + admin CMS. Public-facing Next.js site backed by an admin dashboard, deployed to AWS Amplify with Neon Postgres.

## Tech Stack

- **Framework:** Next.js 16.2.2 (App Router, `proxy.ts` middleware), React 19.2.3, TypeScript 5 (strict)
- **Database:** Prisma 7.4.1 + Neon Postgres via `@prisma/adapter-neon` + `@neondatabase/serverless`
- **Styling:** TailwindCSS 4 + `@tailwindcss/postcss`, shadcn (Radix UI primitives), CVA + clsx + `tailwind-merge`
- **Forms:** react-hook-form + `@hookform/resolvers` + Zod 4
- **Server state:** TanStack React Query 5 (no Zustand — do not add)
- **Auth:** AWS Cognito (Hosted UI, OAuth code flow) + jose for JWT verification, HTTP-only cookies
- **AWS runtime:** Amplify Hosting Gen 1 (SSR), S3 (images), CloudFront (assets CDN), SES (email)
- **Images:** Sharp → WebP, served via CloudFront
- **Markdown:** remark + rehype (`remark-gfm`, `rehype-sanitize`, `rehype-slug`, `rehype-highlight`)
- **Import/Export:** papaparse (CSV parsing/generation for admin bulk import/export)
- **Toasts:** Sonner. **Icons:** lucide-react. **Fonts:** Geist.

## Commands

| Task                    | Command                         |
| ----------------------- | ------------------------------- |
| Dev server              | `npm run dev`                   |
| Build (incl. lint)      | `npm run build`                 |
| Lint + format           | `npm run lint`                  |
| Type check              | `npm run type-check`            |
| Bundle analyze          | `npm run analyze`               |
| Prisma generate         | `npm run prisma:generate`       |
| Prisma migrate (dev)    | `npm run prisma:migrate:dev`    |
| Prisma migrate (deploy) | `npm run prisma:migrate:deploy` |
| Prisma studio           | `npm run prisma:studio`         |
| Seed                    | `npx prisma db seed`            |
| Test (watch)            | `npm test`                      |
| Test (CI + coverage)    | `npm run test:ci`               |

Tests use **Vitest** with **@testing-library/react**. See [.claude/rules/tests.md](.claude/rules/tests.md) for conventions.

## Architecture

| Path                                               | Purpose                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [src/app/(public)/](<src/app/(public)/>)           | Public site (ISR, Server Components by default)                |
| [src/app/(admin)/admin/](<src/app/(admin)/admin/>) | Admin CMS — login + auth-guarded shell                         |
| [src/app/api/auth.ts](src/app/api/auth.ts)         | `requireAuth` / `optionalAuth` (NOT `src/lib/auth`)            |
| [src/proxy.ts](src/proxy.ts)                       | Next.js 16 middleware replacement — JWT guard for admin routes |
| [src/components/ui/](src/components/ui/)           | shadcn primitives (use `npx shadcn add`, don't hand-edit)      |
| [src/lib/data/](src/lib/data/)                     | Server-side query layer + canonical types                      |
| [src/lib/validations/](src/lib/validations/)       | Zod schemas (one file per entity)                              |
| [src/lib/errors.ts](src/lib/errors.ts)             | `ApiError` + `withErrorHandler`                                |
| [src/lib/prismaClient.ts](src/lib/prismaClient.ts) | Singleton Prisma client (Neon adapter)                         |

Scoped instructions: [src/CLAUDE.md](src/CLAUDE.md), [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md), [prisma/CLAUDE.md](prisma/CLAUDE.md).

## Request Routing

Before starting implementation, evaluate the scope of the request:

| Signal                                                                        | Route to                                               |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| Request touches 3+ areas (schema + API + UI, or API + multiple pages + tests) | **orchestrator** agent — do NOT start editing directly |
| User says "orchestrate", "multi-agent", or "full pipeline"                    | **orchestrator** agent                                 |
| Single entity end-to-end (schema through UI)                                  | **feature-builder** agent directly                     |
| Schema-only change (migration, new model, field change)                       | **db-agent** directly                                  |
| Convention alignment of existing code                                         | **refactor-agent** directly                            |
| Review or audit                                                               | **code-reviewer** directly                             |
| Documentation update (docs out of sync, roadmap update)                       | **documentation-agent** directly                       |
| Single-file edit, typo fix, quick lookup                                      | Handle directly in main session                        |

If uncertain whether the orchestrator is needed, ask the user: "This looks like it might span multiple domains. Should I use the orchestrator to coordinate, or handle it directly?"

## Critical Rules (universal — domain-specific rules live in [.claude/rules/](.claude/rules/))

1. **Auth import is `@/app/api/auth`** — `requireAuth` for protected routes, `optionalAuth` when behavior differs by login state.
2. **Use the singleton Prisma client** from `@/lib/prismaClient`. Never instantiate `PrismaClient` directly.
3. **Types come from [src/lib/data/types.ts](src/lib/data/types.ts).** Do NOT add new files under `src/types/` — that directory is being phased out.
4. **Cookies are HTTP-only, Secure, SameSite=Lax.** Tokens never touch `localStorage`.

Domain rules (Zod validation, `withErrorHandler`, ISR/client split, image pipeline, forms, data layer) are enforced by pattern-matched rule files in [.claude/rules/](.claude/rules/) — they load automatically when you touch matching files.

## Common Mistakes (this project specifically)

- ❌ Hardcoding colors in public components — use theme tokens (`bg-background`, `text-foreground`, `border-border`). Dark mode is wired via `next-themes`.
- ❌ Using `import "dotenv/config"` in app code — Next.js loads `.env` automatically. Only `prisma.config.ts` needs it.
- ❌ Using `AWS_*` env var names — Amplify reserves that namespace. Use `APP_AWS_*`.
- ❌ Forgetting to `await` `rateLimit()` — it's async (Upstash-backed). Missing `await` → spurious 429s.
- ❌ Using `NEXT_PUBLIC_APP_URL` for public-facing URLs — resolves to localhost in dev. Hardcode `https://asakurayuta.dev/...` for share links, OG tags, etc.

## MCP Servers

- **context7** — Live docs for Next.js 16, Prisma 7, TailwindCSS 4. IMPORTANT: always consult before assuming post-cutoff library APIs.
- **aws-docs** — AWS service documentation. Use for Amplify, S3, SES, Cognito behavior questions before web search.
- **aws-api** — AWS API access for deploy verification and infra state checks. See [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md).
- **prisma-local** — Migration status, schema management. Run `migrate-status` before `migrate dev`. NEVER run `migrate-reset` without user confirmation.
- **playwright** — Browser automation for visual verification at `http://localhost:3000`.
- **github** — GitHub API for PR/issue management, code search.

## Available Agents

Agents: **orchestrator**, **feature-builder**, **db-agent**, **refactor-agent**, **code-reviewer**, **synthesizer**, **documentation-agent**. Definitions in [.claude/agents/](.claude/agents/). See Request Routing table above for when to use each.

Defaults: `model: sonnet` (except `code-reviewer` → `haiku`). Override to `opus` only when complexity warrants.

## Claude Hooks

Configured in `.claude/settings.json`. All hooks run in the project directory.

| Hook file                     | Trigger                     | Effect                                                                                                                          |
| ----------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pre-edit-branch-guard.sh`    | PreToolUse — `Edit\|Write`  | Blocks all file edits on `main` and `develop`. Prints instructions to create a feature branch. Exit 2.                          |
| `pre-commit-gate.sh`          | PreToolUse — `Bash`         | Intercepts `git commit` commands and runs `npm run type-check`. Blocks the commit if type-check fails.                          |
| `post-edit-format.sh`         | PostToolUse — `Write\|Edit` | Runs Prettier on the edited file after each Edit/Write (`.ts`, `.tsx`, `.json`, `.css`, `.md`).                                 |
| `post-commit-doc-reminder.sh` | PostToolUse — `Bash`        | After a `git commit`, scans changed files for schema/API/page/agent/rule patterns and suggests running the documentation-agent. |

## Git Commit Style

- **Subject line only.** Use `git commit -m "<subject>"` — no body, no extended description. The diff already shows what changed; the subject says why at a glance.
- **No heredoc messages.** Don't write `git commit -m "$(cat <<'EOF' ... EOF)"`. Single-line `-m` only.
- **No `Co-Authored-By` trailer.** Don't append `Co-Authored-By: Claude ...` or any other Claude attribution. The git author already records who ran the commit.
- Subject format: `<type>: <short imperative>` matching existing log style (`docs:`, `test:`, `setup:`, `fix:`, `feat:`).

## Environment Setup

Local dev needs a `.env` (not `.env.example` — it has drift; see [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md) §Environment Variables). Production env lives in Amplify Console and is materialized into `.env.production` at build time by [amplify.yml](amplify.yml).
