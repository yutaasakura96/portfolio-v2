# Codebase Audit Report

**Date:** 2025-05-05  
**Auditor:** Claude Code (Senior Architect)

---

## Tech Stack — Exact Versions

### Production Dependencies

| Package                        | Version          | Purpose                         |
| ------------------------------ | ---------------- | ------------------------------- |
| next                           | ^16.2.2          | App Router framework            |
| react / react-dom              | 19.2.3           | UI library                      |
| @prisma/client                 | ^7.4.1           | ORM client                      |
| @prisma/adapter-neon           | ^7.4.1           | Serverless Postgres adapter     |
| @neondatabase/serverless       | ^1.0.2           | Neon connection driver          |
| prisma                         | ^7.4.1           | CLI/schema tool                 |
| zod                            | ^4.3.6           | Schema validation               |
| react-hook-form                | ^7.71.2          | Form management                 |
| @hookform/resolvers            | ^5.2.2           | Zod integration for RHF         |
| @tanstack/react-query          | ^5.90.21         | Server state management         |
| @tanstack/react-query-devtools | ^5.91.3          | Devtools                        |
| zustand                        | ^5.0.11          | Client state (listed, NOT used) |
| jose                           | ^6.1.3           | JWT verification                |
| @aws-sdk/client-s3             | ^3.994.0         | S3 operations                   |
| @aws-sdk/client-ses            | ^3.994.0         | Email sending                   |
| @aws-sdk/s3-request-presigner  | ^3.994.0         | Pre-signed URLs                 |
| sharp                          | ^0.34.5          | Image processing                |
| tailwind-merge                 | ^3.5.0           | TW class merging                |
| class-variance-authority       | ^0.7.1           | Component variants              |
| clsx                           | ^2.1.1           | Class joining                   |
| radix-ui                       | ^1.4.3           | Primitives                      |
| sonner                         | ^2.0.7           | Toast notifications             |
| next-themes                    | ^0.4.6           | Dark mode (barely used)         |
| lucide-react                   | ^0.575.0         | Icons                           |
| geist                          | ^1.7.0           | Font family                     |
| nanoid                         | ^5.1.6           | ID generation                   |
| date-fns                       | ^4.1.0           | Date formatting                 |
| highlight.js                   | ^11.11.1         | Code syntax highlighting        |
| remark / remark-gfm            | ^15.0.1 / ^4.0.1 | Markdown parsing                |
| remark-rehype                  | ^11.1.2          | MD-to-HTML bridge               |
| rehype-sanitize                | ^6.0.0           | HTML sanitization               |
| rehype-slug                    | ^6.0.0           | Heading IDs                     |
| rehype-highlight               | ^7.0.2           | Code highlight                  |
| rehype-stringify               | ^10.0.1          | HTML serialization              |
| @dnd-kit/core                  | ^6.3.1           | Drag and drop                   |
| @dnd-kit/sortable              | ^10.0.0          | Sortable DnD                    |
| @dnd-kit/utilities             | ^3.2.2           | DnD helpers                     |
| @uiw/react-md-editor           | ^4.0.11          | Markdown editor                 |
| react-dropzone                 | ^15.0.0          | File upload UI                  |
| yet-another-react-lightbox     | ^3.29.1          | Image lightbox                  |
| dotenv                         | ^17.3.1          | Env var loading                 |
| @tailwindcss/typography        | ^0.5.19          | Prose styles                    |

### Dev Dependencies

| Package                       | Version | Purpose                |
| ----------------------------- | ------- | ---------------------- |
| typescript                    | ^5      | Type system            |
| tailwindcss                   | ^4      | Utility CSS            |
| @tailwindcss/postcss          | ^4      | PostCSS plugin         |
| eslint                        | ^9      | Linting                |
| eslint-config-next            | 16.1.6  | Next.js rules          |
| eslint-config-prettier        | ^10.1.8 | Prettier compat        |
| prettier                      | ^3.8.1  | Formatting             |
| @next/bundle-analyzer         | ^16.2.0 | Bundle analysis        |
| @tanstack/eslint-plugin-query | ^5.91.4 | Query linting          |
| shadcn                        | ^3.8.5  | Component CLI          |
| tsx                           | ^4.21.0 | TS execution (seeds)   |
| tw-animate-css                | ^1.4.0  | Animation utilities    |
| @types/node                   | ^20     | Node types             |
| @types/react                  | ^19     | React types            |
| @types/react-dom              | ^19     | ReactDOM types         |
| @types/sharp                  | ^0.31.1 | Sharp types (OUTDATED) |

---

## Directory Structure (Annotated)

```
portfolio-v2/
├── .claude/
│   ├── docs/                     # This audit
│   └── settings.local.json       # Permission allow-list
├── prisma/
│   ├── schema.prisma             # 10 models, all relational
│   ├── migrations/               # 9 migrations since 2026-02-20
│   ├── prisma.config.ts          # Datasource config
│   └── seed.ts                   # Seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (fonts, QueryProvider)
│   │   ├── globals.css           # Tailwind + shadcn theme vars
│   │   ├── not-found.tsx         # 404 page
│   │   ├── robots.ts / sitemap.ts / opengraph-image.tsx  # SEO
│   │   ├── (public)/             # Public-facing routes
│   │   │   ├── layout.tsx        # Header + Footer + GA
│   │   │   ├── page.tsx          # Homepage (SSR + ISR)
│   │   │   ├── projects/         # Project listing + [slug] detail
│   │   │   ├── blog/             # Blog listing + [slug] detail
│   │   │   ├── about/            # About page
│   │   │   └── contact/          # Contact form
│   │   ├── (admin)/admin/        # Admin CMS
│   │   │   ├── login/page.tsx    # Login page
│   │   │   └── (shell)/          # Auth-guarded admin shell
│   │   │       ├── layout.tsx    # Sidebar + Header + auth check
│   │   │       ├── page.tsx      # Dashboard (server component)
│   │   │       ├── projects/     # CRUD pages
│   │   │       ├── blog/         # CRUD pages
│   │   │       ├── experience/   # CRUD pages
│   │   │       ├── education/    # CRUD pages
│   │   │       ├── certifications/ # Manager page
│   │   │       ├── skills/       # Manager page
│   │   │       ├── hero/         # Editor page
│   │   │       ├── about/        # Editor page
│   │   │       ├── messages/     # Inbox management
│   │   │       └── settings/     # Site settings
│   │   └── api/                  # REST API routes
│   │       ├── auth.ts           # requireAuth / optionalAuth helpers
│   │       ├── auth/             # callback, me, refresh, signout
│   │       ├── projects/         # CRUD + reorder
│   │       ├── blog/             # CRUD
│   │       ├── experience/       # CRUD + reorder
│   │       ├── education/        # CRUD + reorder
│   │       ├── certifications/   # CRUD + reorder
│   │       ├── skills/           # CRUD + reorder
│   │       ├── skill-categories/ # CRUD + reorder
│   │       ├── hero/             # GET/PUT
│   │       ├── about/            # GET/PUT
│   │       ├── contact/          # POST (public)
│   │       ├── messages/         # CRUD + bulk
│   │       ├── settings/         # GET/PUT
│   │       ├── upload/           # POST/DELETE (images)
│   │       └── resume/           # Download route
│   ├── components/
│   │   ├── ui/                   # shadcn primitives (19 files)
│   │   ├── admin/                # Admin-specific components (17 files)
│   │   ├── public/               # Public-facing components (17 files)
│   │   └── providers/            # QueryProvider
│   ├── hooks/                    # Custom hooks (3 files)
│   │   ├── use-auth.ts
│   │   ├── use-messages.ts
│   │   └── use-settings.ts
│   ├── lib/
│   │   ├── api-client.ts         # Client-side API class
│   │   ├── errors.ts             # ApiError + withErrorHandler
│   │   ├── prismaClient.ts       # Singleton Prisma instance
│   │   ├── image-processor.ts    # Sharp pipeline
│   │   ├── markdown.ts           # Remark/rehype pipeline
│   │   ├── rate-limit.ts         # In-memory rate limiter
│   │   ├── utils.ts              # cn() helper
│   │   ├── utils/                # slug, date-format
│   │   ├── validations/          # Zod schemas (11 files)
│   │   ├── aws/                  # s3.ts, ses.ts, cognito.ts
│   │   └── data/                 # public-queries.ts, types.ts
│   ├── types/                    # Entity types (5 files)
│   └── proxy.ts                  # Middleware-like JWT check
├── CLAUDE.md                     # Project instructions
├── amplify.yml                   # AWS Amplify build config
├── customHttp.yml                # Security headers (CSP, HSTS)
├── next.config.ts                # Next.js config
├── tsconfig.json                 # TypeScript config (strict)
├── eslint.config.mjs             # ESLint flat config
├── components.json               # shadcn config
├── postcss.config.mjs            # PostCSS
├── prisma.config.ts              # Prisma config
└── package.json                  # Dependencies
```

---

## Current Good Patterns (KEEP)

### 1. Consistent API Route Pattern

Every API route uses `withErrorHandler` wrapper and `ApiError` for structured error responses. The response shape `{ data, meta }` is consistent across all endpoints.

- **Example:** [src/app/api/projects/route.ts](src/app/api/projects/route.ts)

### 2. Zod Validation on All Inputs

Every API route validates input with Zod schemas stored in `src/lib/validations/`. Export of both schema and inferred type is consistent.

- **Example:** [src/lib/validations/project.ts](src/lib/validations/project.ts)

### 3. Data Access Layer Separation

Public queries are centralized in `src/lib/data/public-queries.ts` with proper error handling and typed return values. Server components call these directly.

- **Example:** [src/lib/data/public-queries.ts](src/lib/data/public-queries.ts)

### 4. Image Processing Pipeline

Sharp-based multi-variant image processing with consistent S3 key patterns and CloudFront CDN delivery. Proper WebP conversion.

- **Example:** [src/lib/image-processor.ts](src/lib/image-processor.ts), [src/lib/aws/s3.ts](src/lib/aws/s3.ts)

### 5. Auth Architecture

JWT verification via jose + Cognito JWKS with proper cookie-based session management. Token refresh handled transparently by `api-client.ts`.

- **Example:** [src/app/api/auth.ts](src/app/api/auth.ts), [src/lib/aws/cognito.ts](src/lib/aws/cognito.ts)

### 6. Form Patterns (Admin)

Consistent use of react-hook-form + zodResolver + sonner toasts + TanStack Query mutations across all admin forms.

- **Example:** [src/components/admin/ProjectForm.tsx](src/components/admin/ProjectForm.tsx)

### 7. ISR + Server Components for Public Pages

Public pages use `revalidate = 3600` for ISR with `generateStaticParams` for static generation. Clean server component data fetching.

- **Example:** [src/app/(public)/page.tsx](<src/app/(public)/page.tsx>)

### 8. Security Measures

- Rate limiting on public endpoints (contact, upload)
- Honeypot spam protection
- CSP headers via customHttp.yml
- HTML sanitization in markdown pipeline
- HTTP-only secure cookies for tokens
- Token revocation on sign-out
- **Example:** [src/app/api/contact/route.ts](src/app/api/contact/route.ts)

### 9. SEO Implementation

JSON-LD structured data, dynamic OG images, sitemap, robots.txt, proper metadata cascading.

- **Example:** [src/app/(public)/projects/[slug]/page.tsx](<src/app/(public)/projects/[slug]/page.tsx>)

### 10. Admin Shell Architecture

Route groups `(admin)` and `(shell)` properly separate authenticated from public layouts. The shell provides sidebar + header + auth guard.

- **Example:** [src/app/(admin)/admin/(shell)/layout.tsx](<src/app/(admin)/admin/(shell)/layout.tsx>)

---

## Anti-Patterns Found

### ~~1. `src/proxy.ts` is NOT Actually Used as Middleware~~ (RETRACTED)

**File:** [src/proxy.ts](src/proxy.ts)  
**Correction:** `proxy.ts` is the official Next.js 16 convention that replaced `middleware.ts`. The exported `proxy` function and `config` with matchers is correctly wired and runs on the Node.js runtime. Admin routes DO have server-side JWT validation via this proxy before page rendering.

This is NOT an anti-pattern — it is correct and working.

### 2. Duplicate Type Definitions

**Files:** `src/types/` (5 files) vs `src/lib/data/types.ts`  
Two parallel type systems exist:

- `src/types/project.ts` imports from `generated/prisma/models` and defines `Project`, `ProjectListItem`
- `src/lib/data/types.ts` imports from `generated/prisma/client` and defines `PublicProject`, `FeaturedProject`, etc.

Components import from both locations inconsistently. Admin components use `@/types/project`, while data layer uses `@/lib/data/types`.

**Impact:** Confusion, potential drift between definitions.

### 3. Admin Dashboard is a Server Component Hitting DB Directly

**File:** [src/app/(admin)/admin/(shell)/page.tsx](<src/app/(admin)/admin/(shell)/page.tsx>)  
The admin dashboard page calls Prisma directly (`prisma.project.count()`, etc.) as a server component, yet the admin layout is `"use client"`. This creates a mismatch — the page is a server component nested inside a client component boundary.

**Impact:** This actually works in Next.js (server components can be children of client components if passed as `children` prop), but it's architecturally inconsistent with other admin pages which are all client-side with API calls.

### 4. In-Memory Rate Limiter Won't Work in Serverless

**File:** [src/lib/rate-limit.ts](src/lib/rate-limit.ts)  
Uses a `Map` in process memory. On Amplify (Lambda-based SSR), each invocation may spin up a new instance, making the rate limiter ineffective.

**Impact:** Rate limiting is essentially non-functional in production.

### 5. `setInterval` in Rate Limiter (Serverless Anti-Pattern)

**File:** [src/lib/rate-limit.ts:9](src/lib/rate-limit.ts#L9)  
`setInterval` at module scope will leak in serverless environments or prevent clean shutdown.

### 6. Environment Variable Mismatch

**Files:** `.env.example` vs `amplify.yml` vs `src/lib/aws/s3.ts`

- `.env.example` uses `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `amplify.yml` and actual code use `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY`
- `.env.example` is outdated and would confuse new setup

### 7. `dotenv` Import in Prisma Client

**File:** [src/lib/prismaClient.ts:2](src/lib/prismaClient.ts#L2)  
`import "dotenv/config"` is unnecessary in Next.js (which loads `.env` automatically) and adds overhead. It's only needed for the Prisma CLI (which is handled by `prisma.config.ts`).

---

## Inconsistencies

### 1. Pagination Parameter Naming

- Projects API uses `limit` (and returns `meta.limit`)
- Blog API uses `pageSize` (and returns `meta.pageSize`)
- Messages API uses `pageSize`

Should standardize to one name.

### 2. API Response Shapes

- Most endpoints return `{ data: T }` or `{ data: T[], meta }`
- Contact route returns `{ data: { success: true, message: "..." } }`
- Sign-out returns `{ data: { success: true } }`

The `success` pattern is inconsistent with the rest.

### 3. Query Parameter Parsing

- Projects: `request.nextUrl.searchParams`
- Blog: `new URL(request.url)` then `.searchParams`

Both work identically but are inconsistent in style.

### 4. Where Clause Typing

- Projects API uses `Prisma.ProjectWhereInput` (proper typing)
- Blog API uses `Record<string, unknown>` (loose typing)

### 5. Auth Import Path

- CLAUDE.md says: "Auth middleware: requireAuth from src/lib/auth"
- Actual path: `src/app/api/auth.ts` (imported as `@/app/api/auth`)

### 6. Dark Mode Setup

- `next-themes` is installed, `globals.css` has full `.dark` theme variables
- `sonner.tsx` uses `useTheme()` from next-themes
- But the root layout does NOT wrap in `ThemeProvider`
- The Header has no theme toggle
- The public site is hardcoded light (gray-900, white, bg-gray-50 etc.)

Dark mode is half-implemented / unused.

### 7. Admin Page Rendering Strategy

- Dashboard page: Server component (direct Prisma calls)
- All other admin pages: Client components (`"use client"`) with TanStack Query

---

## Missing Fundamentals

### 1. No Test Suite

Zero test files exist. No testing framework configured (no Jest, Vitest, Playwright, or Cypress). Package.json has `"test": "npm test"` but no test script defined.

### ~~2. No Middleware File~~ (RETRACTED)

`src/proxy.ts` IS the official Next.js 16 middleware replacement. It is correctly wired and provides server-side JWT validation for admin routes.

### 3. No Loading States for Most Public Pages

Only `src/app/(public)/about/loading.tsx` exists. Projects list, blog list, blog detail, and contact page have no loading.tsx files.

### 4. No Global Error Boundary

`src/app/error.tsx` does not exist (only `(public)/error.tsx` and `(admin)/.../error.tsx`).

### 5. No Not-Found for Nested Routes

Only root `not-found.tsx` exists. No `(public)/not-found.tsx` for styled 404 within the public layout.

### 6. No CSRF Protection

Form submissions (contact, admin mutations) rely on same-origin cookie policy but have no CSRF token mechanism. For a cookie-based auth system, this is a gap (mitigated somewhat by `SameSite=Lax`).

### 7. No Input Sanitization on Admin Write Operations

While markdown output is sanitized via rehype-sanitize, there is no sanitization on content going INTO the database from admin forms. XSS stored in the DB would be rendered raw in admin views.

### 8. No API Versioning or OpenAPI Spec

API routes have no versioning and no generated documentation.

### 9. No Monitoring / Error Reporting

No Sentry, no structured logging, no health check endpoint. `console.error` is the only error reporting.

---

## Recommended Conventions (Target State)

| Area                | Current                             | Target                                                          |
| ------------------- | ----------------------------------- | --------------------------------------------------------------- |
| Pagination          | Mixed `limit`/`pageSize`            | Standardize on `limit` + `page` everywhere                      |
| Types               | Two parallel systems                | Single source: `src/lib/data/types.ts` re-exporting from Prisma |
| Rate limiting       | In-memory Map                       | External store (Upstash Redis already in CSP allowlist!)        |
| Middleware          | `proxy.ts` (correct for Next.js 16) | Already correct                                                 |
| Testing             | None                                | Vitest for unit/integration, Playwright for E2E                 |
| Admin data fetching | Mixed server/client                 | All client-side with API calls (or all server with proper RSC)  |
| Dark mode           | Half-installed                      | Either fully implement or remove                                |
| Error reporting     | console.error                       | Sentry or similar                                               |
| Loading states      | Only 1 exists                       | All route segments should have loading.tsx                      |

---

## Dependency Health

### Unused Dependencies

| Package        | Evidence                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| `zustand`      | Zero imports of `zustand` anywhere in `src/`                             |
| `next-themes`  | Only imported in auto-generated `sonner.tsx`; no ThemeProvider in layout |
| `@types/sharp` | This package is deprecated; Sharp ships its own types since v0.33        |

### Potentially Outdated

| Package              | Note                                                          |
| -------------------- | ------------------------------------------------------------- |
| `eslint-config-next` | Pinned to `16.1.6` while `next` is `^16.2.2` (minor mismatch) |
| `@types/sharp`       | Deprecated package, should be removed                         |

### Security Notes

- No `npm audit` vulnerabilities checked in build pipeline
- AWS credentials use long-lived IAM keys (acceptable for Amplify but ideally use IAM roles)
- `COGNITO_CLIENT_SECRET` in environment is expected for confidential client flow

---

## Claude Code Setup Assessment

### Current Setup Files

#### `CLAUDE.md` (root)

**Assessment:** Mostly accurate but has issues:

- **Correct:** Tech stack list, key conventions, commands
- **Incorrect:** Says "Auth middleware: requireAuth from src/lib/auth" — actual path is `src/app/api/auth.ts`
- **Missing:** No mention of the data layer (`src/lib/data/`), no mention of `src/types/`, no project structure overview, no testing guidance
- **Outdated:** Lists `next-themes` as part of the stack (barely used), lists Zustand (not used at all)
- **Size:** 42 lines — well within limits, not bloated

#### `.claude/settings.local.json`

**Assessment:** Minimal. Only allows reading scripts that don't exist (`scripts/*` directory). The permission is a no-op.

### What to Keep

- CLAUDE.md tech stack section (after corrections)
- CLAUDE.md key conventions (core patterns are accurate)
- CLAUDE.md commands section

### What to Replace

- Fix auth import path in CLAUDE.md
- Remove references to unused deps (Zustand, next-themes)

### What to Remove

- `.claude/settings.local.json` permission for non-existent `scripts/` directory

### What's Missing

1. **No `.claude/agents/` directory** — No specialized agents configured
2. **No `.claude/rules/` directory** — No scoped rules for areas like API routes or components
3. ~~**No `.mcp.json`** — No MCP servers configured (could benefit from a Prisma or DB tool)~~ (RESOLVED 2026-05-23 — Phase 5 complete; see MCP Server Assessment below)
4. **No area-specific instructions** — The admin, public, and API areas have different patterns that could benefit from scoped CLAUDE.md files
5. **No testing conventions** — CLAUDE.md should document testing strategy (once one exists)
6. **No deployment/environment docs** — How to set up locally, what env vars are needed
7. **No PR/commit conventions** — No guidance on branch strategy or commit format

### MCP Server Assessment

**Status (updated 2026-05-23):** Phase 5 complete. Five MCP servers installed and verified — see [CLAUDE.md §MCP Servers](../../CLAUDE.md#mcp-servers) for usage guidance.

Installed:

- **context7** (user scope) — Live docs for Next.js 16, Prisma 7, Tailwind 4
- **aws-docs** (user scope) — `awslabs.aws-documentation-mcp-server`
- **aws-iac** (user scope) — `awslabs.aws-iac-mcp-server` (low value for this project; infra is Amplify Console-managed)
- **prisma-local** (local scope) — `npx -y prisma mcp` (migrate-status, migrate-dev, etc.) Verified against Neon `neondb` — 10 migrations applied, schema up to date.
- **aws-api** (local scope) — `awslabs.aws-api-mcp-server` (S3, SES, Cognito, Amplify API access). Verified by listing project buckets (`portfolio-v2-images-1771574702` returned).

No project-shared `.mcp.json` — single-author project, local-scope installs are appropriate.

Deferred / not installed:

- Dedicated Neon/Postgres query MCP — Prisma MCP covers migration needs; ad-hoc SQL goes through `npx prisma studio`.
- GitHub MCP — `gh` CLI via Bash is sufficient for PR management at current scale.

---

## Summary of Priority Actions

### Critical (Blocks correctness)

1. ~~Wire `proxy.ts` as proper `middleware.ts`~~ (RETRACTED — proxy.ts is correct for Next.js 16)
2. Fix `.env.example` to match actual env var names used in code
3. Remove `@types/sharp` (deprecated, causes type conflicts)

### High (Impacts quality)

4. Add testing framework (Vitest recommended)
5. Replace in-memory rate limiter with Upstash Redis (already in CSP)
6. Standardize pagination parameters across all APIs
7. Consolidate type definitions into single location
8. Remove unused `zustand` dependency

### Medium (Improves DX)

9. Add loading.tsx to all public route segments
10. Add root `error.tsx` boundary
11. Either implement dark mode fully or strip `next-themes`
12. Update CLAUDE.md with correct paths and remove stale references
13. Add structured error reporting (Sentry)

### Low (Nice-to-have)

14. Remove `dotenv` import from prismaClient.ts
15. Standardize query param parsing style in API routes
16. Add OpenAPI spec generation
17. Configure Claude Code agents/rules for different codebase areas

---

## Post-Refactor Status

**Date:** 2026-05-14
**Source:** [.claude/docs/refactor-log.md](refactor-log.md) + final review in [.claude/docs/refactor-final-review.md](refactor-final-review.md).

The refactor plan in [.claude/docs/refactor-plan.md](refactor-plan.md) executed across 13 sessions. All actionable items closed; one item (9.4 — remove `next-themes`) was made obsolete when §7.1 took the "wire dark mode fully" path.

### Anti-patterns — closed

| #   | Audit anti-pattern                                       | Closed by                                                                     |
| --- | -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 2   | Duplicate type definitions (`src/types/` vs data layer)  | §3.x — `src/types/` deleted; `@/lib/data/types` is canonical                  |
| 3   | Admin dashboard server-component / client-shell mismatch | §4.1 — dashboard is now `"use client"` consuming `/api/admin/dashboard-stats` |
| 4   | In-memory rate limiter doesn't survive Lambda            | §8.5 — replaced with Upstash sliding window                                   |
| 5   | `setInterval` at module scope in rate limiter            | §8.5 — Upstash handles TTL server-side; interval gone                         |
| 6   | `.env.example` env-name mismatch                         | §1.3 — renamed to `APP_AWS_*`; now matches `amplify.yml`                      |
| 7   | `dotenv` import in runtime Prisma client                 | §1.1 — removed; §9.3 moved `dotenv` to devDeps                                |

### Inconsistencies — closed

| #   | Audit inconsistency                              | Closed by                                                                |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | Pagination `limit` vs `pageSize`                 | §5.1, §5.2 — blog + messages now use `limit`                             |
| 2   | API response shape `{ data: { success: true } }` | §5.3, §5.4 — stripped from 10 routes                                     |
| 4   | Where-clause typing `Record<string, unknown>`    | §2.1, §2.2 — both occurrences typed as `Prisma.<Model>WhereInput`        |
| 5   | CLAUDE.md auth import path lie                   | Closed during the rules-file rewrite (path is now `@/app/api/auth`)      |
| 6   | Half-installed dark mode                         | §7.1, §7.2 — fully wired; ~25 public files swept to tokens               |
| 7   | Mixed admin page rendering strategy              | §4.1 — dashboard converted to client; admin is now uniformly client-side |

### Inconsistencies — partial

| #   | Item                                               | Status                                                                                                                                  |
| --- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | Query param parsing style (`new URL` vs `nextUrl`) | 6 of 8 routes use `nextUrl.searchParams`; blog + messages still use `new URL(request.url)`. Flagged in `refactor-final-review.md` §4.2. |

### Missing fundamentals — closed

| #   | Audit gap                            | Closed by                                                                        |
| --- | ------------------------------------ | -------------------------------------------------------------------------------- |
| 1   | No test suite                        | §10.1, §10.2, §10.3 — Vitest scaffold + 76 tests + GitHub Actions CI             |
| 3   | Loading states for most public pages | §8.3 — added for `projects`, `projects/[slug]`, `blog`, `blog/[slug]`, `contact` |
| 4   | No global error boundary             | §8.1 — root `src/app/error.tsx` added                                            |
| 5   | No nested not-found                  | §8.2 — `src/app/(public)/not-found.tsx` added                                    |

### Missing fundamentals — explicitly deferred

| #   | Item                                 | Decision                                                              |
| --- | ------------------------------------ | --------------------------------------------------------------------- |
| 6   | No CSRF protection                   | Out-of-scope per plan; SameSite=Lax + same-origin is acceptable here. |
| 7   | No input sanitization on admin write | Out-of-scope per plan; separate security pass.                        |
| 8   | No API versioning / OpenAPI          | Out-of-scope per plan; premature.                                     |
| 9   | No monitoring / Sentry               | Out-of-scope per plan (§8.6); separate initiative.                    |

### Dependency health — closed

| Package        | Action                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `zustand`      | Removed in §9.1 (zero imports — guard rule remains in CLAUDE.md).                                     |
| `@types/sharp` | Removed in §9.2 (sharp ≥ 0.33 ships its own types).                                                   |
| `dotenv`       | Moved from `dependencies` → `devDependencies` in §9.3 (only used by Prisma CLI + ad-hoc tsx scripts). |
| `next-themes`  | **Retained** — became load-bearing in §7.1 (Path B).                                                  |

### Schema drift — closed

| Item                         | Action                                                              |
| ---------------------------- | ------------------------------------------------------------------- |
| `BlogPost.title` unbounded   | Migration `tighten_blog_post_varchar_caps` adds `@db.VarChar(200)`. |
| `BlogPost.excerpt` unbounded | Same migration adds `@db.VarChar(500)`.                             |

Migration is applied locally; Amplify pipeline (`prisma migrate deploy`) handles production on next merge to `main`.

### What changed in `.claude/` setup as a side-effect

- Added rules: `api-routes.md`, `components.md`, `data-layer.md`, `prisma-schema.md`, `tests.md`, `validations.md` (under `.claude/rules/`).
- Added agents: `refactor-agent`, `code-reviewer`, `db-agent`, `feature-builder`.
- Added skills: `nextjs-app-router`, `tailwind-v4`, `aws-deploy`, `prisma-neon`, plus the standard set.
- Added docs: `infrastructure.md` (canonical AWS environment snapshot).

These were created as part of the refactor and are now the canonical source for area-specific rules; the root `CLAUDE.md` references them.

### Net codebase state

- **Build / lint / type-check / tests:** all clean.
- **Routes:** 65 (3 blog + 11 project SSG slugs preserved).
- **Test coverage:** 100% statements/funcs/lines on the four target modules.
- **Public site:** dark-mode-aware throughout; theme toggle in the header.
- **Production rate limiting:** functional on Lambda (Upstash-backed, fail-open).

### Outstanding follow-ups (small, non-blocking)

See `refactor-final-review.md` §4 for detail. Summary:

1. `NextResponse.json` → `Response.json` in 4–6 routes where cookies aren't being set.
2. `new URL(request.url)` → `request.nextUrl.searchParams` in `blog` and `messages` routes.
3. Admin dashboard hardcoded gray classes (rule scope is public-only today; revisit when admin gets a theme).
4. Manual browser verification flagged in log §6.x, §4.1, §7.x, §8.5.
