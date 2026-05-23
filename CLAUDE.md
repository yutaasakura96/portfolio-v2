# Portfolio v2

Personal portfolio + admin CMS. Public-facing Next.js site backed by an admin dashboard, deployed to AWS Amplify with Neon Postgres.

## Tech Stack

- **Framework:** Next.js 16.2.2 (App Router, `proxy.ts` middleware), React 19.2.3, TypeScript 5 (strict)
- **Database:** Prisma 7.4.1 + Neon Postgres via `@prisma/adapter-neon` + `@neondatabase/serverless`
- **Styling:** TailwindCSS 4 + `@tailwindcss/postcss`, shadcn (Radix UI primitives), CVA + clsx + `tailwind-merge`
- **Forms:** react-hook-form + `@hookform/resolvers` + Zod 4
- **Server state:** TanStack React Query 5 (no Zustand — listed but unused, do not add)
- **Auth:** AWS Cognito (Hosted UI, OAuth code flow) + jose for JWT verification, HTTP-only cookies
- **AWS runtime:** Amplify Hosting Gen 1 (SSR), S3 (images), CloudFront (assets CDN), SES (email)
- **Images:** Sharp → WebP, served via CloudFront
- **Markdown:** remark + rehype (`remark-gfm`, `rehype-sanitize`, `rehype-slug`, `rehype-highlight`)
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

No test framework is wired yet. When tests are added, use Vitest (see [.claude/rules/tests.md](.claude/rules/tests.md)).

## Architecture

| Path                                               | Purpose                                                        |
| -------------------------------------------------- | -------------------------------------------------------------- |
| [src/app/(public)/](<src/app/(public)/>)           | Public site (ISR pages, Server Components by default)          |
| [src/app/(admin)/admin/](<src/app/(admin)/admin/>) | Admin CMS — login + auth-guarded shell                         |
| [src/app/api/](src/app/api/)                       | REST API routes (admin mutations + public reads)               |
| [src/app/api/auth.ts](src/app/api/auth.ts)         | `requireAuth` / `optionalAuth` helpers (NOT `src/lib/auth`)    |
| [src/proxy.ts](src/proxy.ts)                       | Next.js 16 middleware replacement — JWT guard for admin routes |
| [src/components/ui/](src/components/ui/)           | shadcn primitives (do not edit by hand — use `npx shadcn add`) |
| [src/components/admin/](src/components/admin/)     | Admin-only components                                          |
| [src/components/public/](src/components/public/)   | Public site components                                         |
| [src/lib/data/](src/lib/data/)                     | Server-side query layer for public pages + canonical types     |
| [src/lib/validations/](src/lib/validations/)       | Zod schemas (one file per entity)                              |
| [src/lib/aws/](src/lib/aws/)                       | S3, SES, Cognito clients                                       |
| [src/lib/errors.ts](src/lib/errors.ts)             | `ApiError` + `withErrorHandler`                                |
| [src/lib/prismaClient.ts](src/lib/prismaClient.ts) | Singleton Prisma client (Neon adapter)                         |
| [prisma/](prisma/)                                 | Schema + migrations + seed                                     |

Scoped instructions: [src/CLAUDE.md](src/CLAUDE.md), [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md), [prisma/CLAUDE.md](prisma/CLAUDE.md).

## Critical Rules (apply everywhere)

1. **Validate at the boundary with Zod 4.** Every API route input, every form. Schemas live in [src/lib/validations/](src/lib/validations/). Export both schema and inferred type.
2. **Wrap every API handler in `withErrorHandler`** and throw `ApiError` for known errors. Never return raw 500s.
3. **Auth import is `@/app/api/auth`** — `requireAuth` for protected routes, `optionalAuth` when behavior differs by login state.
4. **Use the singleton Prisma client** from `@/lib/prismaClient`. Never instantiate `PrismaClient` directly.
5. **Types come from [src/lib/data/types.ts](src/lib/data/types.ts).** Do NOT add new files under `src/types/` — that directory is being phased out (see audit, anti-pattern #2).
6. **Public pages are Server Components with ISR** (`export const revalidate = 3600`). Admin pages are Client Components with TanStack Query. Do not mix.
7. **Server-side Prisma queries for public reads go through [src/lib/data/public-queries.ts](src/lib/data/public-queries.ts)** — do not call Prisma from page components directly.
8. **All images: Sharp → WebP**, uploaded via [src/app/api/upload](src/app/api/upload), keyed `{folder}/{entityId}/{variant}_{fileId}.webp`, served from `NEXT_PUBLIC_CLOUDFRONT_URL`.
9. **Forms: react-hook-form + zodResolver + Sonner toasts + TanStack Query mutations.** No exceptions.
10. **Cookies are HTTP-only, Secure, SameSite=Lax.** Tokens never touch `localStorage`.

## Common Mistakes (this project specifically)

- ❌ Importing `requireAuth` from `@/lib/auth` — that path doesn't exist. Use `@/app/api/auth`.
- ❌ Adding Zustand stores — the dep is listed but unused; do not introduce it.
- ❌ Hardcoding `gray-*` / `white` / `black` in public components — dark mode is wired (`<ThemeProvider attribute="class">` in the root layout, toggle in the public Header). Prefer theme tokens (`bg-background`, `text-foreground`, `border-border`, etc.) which adapt automatically. Use `dark:` variants only when a token can't express the contrast you need (e.g. status banners that don't have a token equivalent).
- ❌ Using `import "dotenv/config"` in app code — Next.js loads `.env` automatically. Only `prisma.config.ts` needs it.
- ❌ Using `AWS_*` env var names — Amplify reserves that namespace. Use `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` / `APP_AWS_REGION`.
- ❌ Forgetting to `await` `rateLimit()` from [src/lib/rate-limit.ts](src/lib/rate-limit.ts) — it became async with the Upstash swap. Missing `await` leaves `result.success` undefined, which the standard `if (!result.success)` check reads as truthy → spurious 429 on every call. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in `.env` locally and wired through [amplify.yml](amplify.yml) for production.
- ❌ Using `pageSize` for new endpoints — standardize on `page` + `limit`.
- ❌ Returning `{ data: { success: true } }` — use `{ data: T }` or `{ data: T[], meta }`. No `success` envelope.

## MCP Servers

Prefer these over manual lookups:

- **context7** (user scope) — Live docs for Next.js 16, Prisma 7, TailwindCSS 4. Use for any library API question.
- **aws-docs** (user scope) — AWS service documentation (`awslabs.aws-documentation-mcp-server`). Use for Amplify, S3, SES, Cognito behavior questions.
- **aws-iac** (user scope) — CloudFormation/CDK references (`awslabs.aws-iac-mcp-server`). Low value here since infra is Amplify Console-managed, not IaC.
- **prisma-local** (local scope) — Migration status, schema management. Use before running `prisma migrate dev`. Local only — there is no remote Prisma MCP for Neon.
- **aws-api** (local scope) — AWS API access for S3, SES, Cognito, Amplify (`awslabs.aws-api-mcp-server`). Use for deploy verification and infra state checks. Reads standard AWS SDK creds (`AWS_PROFILE` / `~/.aws/credentials`).

### MCP Usage Rules

- Always consult **context7** before assuming library API details for Next.js 16, Prisma 7, or TailwindCSS 4 — these are post-cutoff versions.
- Run **prisma-local** `migrate-status` before any `prisma migrate dev`. NEVER run `migrate-reset` without explicit, typed user confirmation (per `prisma/CLAUDE.md`).
- Use **aws-api** to verify Amplify deploy state and S3/SES/Cognito config before and after deploys — see `.claude/docs/infrastructure.md` for the canonical resource names.
- Use **aws-docs** for behavior questions (SES sandbox limits, Cognito token TTLs, Amplify SSR caveats) before web search.
- Treat **aws-iac** as low-priority here — infra is Amplify Console-managed, not CloudFormation/CDK.

Full AWS infrastructure details: [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md).

## Available Agents

- **refactor-agent** — Improves existing code to match conventions in this setup. File-by-file, runs lint/build, logs to `.claude/docs/refactor-log.md`.
- **code-reviewer** — Read-only review against conventions. Reports issues by severity, cites CLAUDE.md rules.
- **db-agent** — Prisma + Neon operations. Migrations, schema, seed. Knows Neon branching. Never resets without confirmation.
- **feature-builder** — Builds new features following all conventions. Reads all CLAUDE.md files before starting.

## Environment Setup

Local dev needs a `.env` (not `.env.example` — it has drift; see [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md) §Environment Variables). Production env lives in Amplify Console and is materialized into `.env.production` at build time by [amplify.yml](amplify.yml).
