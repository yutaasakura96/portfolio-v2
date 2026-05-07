# Refactor Plan

**Source audit:** [audit.md](audit.md) (2025-05-05)
**Plan drafted:** 2026-05-06
**Owner:** yuta

This plan converts the audit findings into ordered, scoped, reviewable work. Items are numbered `<group>.<item>` and referenced by ID in [refactor-log.md](refactor-log.md) (created at first execution).

## Legend

| Symbol | Meaning                                                |
| ------ | ------------------------------------------------------ |
| 🟢     | Low risk — safe to auto-fix                            |
| 🟡     | Medium risk — review the diff after, OK to proceed     |
| 🔴     | High risk — show plan before changes (auto-flagged 🔍) |
| ⚠️     | Could break existing functionality — test thoroughly   |
| 🔍     | Needs review before execution                          |
| ⏳     | Large enough to be its own session                     |
| 🔒     | Security-sensitive                                     |
| 💾     | Commit point — commit before continuing                |

---

## Status snapshot (verified 2026-05-06)

The audit is ~12 months old; Sprint 7 (recent commits `c4fe5ab`, `ddcfd4f`, `8cb453f`, `67ca293`) closed several items:

- ✅ JWT validation in `src/proxy.ts`
- ✅ Token revocation on sign-out
- ✅ CSP/security headers
- ✅ Next.js 16.2.2 upgrade
- ✅ rehype-sanitize wired
- ✅ CLAUDE.md and `.claude/rules/` written

Still outstanding (verified by spot-check today):

- 13 files still import from `@/types/`
- `pageSize` still used in `blog` + `messages` routes
- `success: true` envelope still in: 6 reorder routes, contact (2 returns), upload, signout, refresh
- `Record<string, unknown>` still in `blog` route's `where` clause
- No `src/app/error.tsx`, no `(public)/not-found.tsx`, no loading states for projects/blog/contact
- `import "dotenv/config"` still in [src/lib/prismaClient.ts:2](../../src/lib/prismaClient.ts#L2)
- Unused deps still installed: `zustand`, `@types/sharp`, `next-themes` (barely)
- Empty `src/app/test-data/` directory
- No test framework

---

## Session plan summary

| Session | Items     | Est. time | Risk     | Notes                                                         |
| ------- | --------- | --------- | -------- | ------------------------------------------------------------- |
| 1       | 1.1–1.4   | 30 min    | 🟢       | Critical fixes, mostly deletions                              |
| 2       | 2.1–2.3   | 45 min    | 🟡       | `Record<string, unknown>` cleanup + small typing wins         |
| 3       | 3.1–3.3   | 60 min    | 🟡 ⏳    | Type-system consolidation (`src/types/` → `@/lib/data/types`) |
| 4       | 5.1–5.2   | 45 min    | 🟡 ⏳    | `pageSize` → `limit` migration (blog + messages, end-to-end)  |
| 5       | 5.3–5.4   | 60 min    | 🟡 ⏳    | `success: true` envelope removal across 10 routes             |
| 6       | 4.1–4.3   | 60 min    | 🔴 ⏳    | Admin dashboard pattern + form file splits                    |
| 7       | 6.1–6.2   | 30 min    | 🟢       | Data-layer + Prisma schema audit (likely confirm-only)        |
| 8       | 7.1–7.2   | 30 min    | 🟡       | Dark-mode decision + Tailwind cleanup                         |
| 9       | 8.1–8.4   | 45 min    | 🟢       | Loading/error/not-found scaffolding                           |
| 10      | 8.5       | 60 min    | 🔴 ⏳ 🔒 | Upstash rate limiter rewrite                                  |
| 11      | 9.1–9.4   | 30 min    | 🟢       | Dead-code + dependency cleanup                                |
| 12      | 10.1–10.3 | 60 min    | 🟡 ⏳    | Vitest scaffold + first critical tests                        |
| 13      | 11.1–11.2 | 30 min    | 🟢       | Docs                                                          |

Total: ~9.5 hours of focused work, distributed across 13 sessions.

---

## 1. Critical / Breaking

> Things that are wrong **right now** and cheap to fix. No dependencies. Run first.

### 1.1 — Remove `dotenv/config` from runtime Prisma client 🟢

- **Where:** [src/lib/prismaClient.ts:2](../../src/lib/prismaClient.ts#L2)
- **Wrong:** `import "dotenv/config";` runs at every import in the Next.js runtime. Next loads `.env` automatically; this is dead overhead and contradicts CLAUDE.md "Common Mistakes #4".
- **Target:** delete the import entirely. `prisma.config.ts` (CLI scope) keeps its dotenv usage.
- **Scope:** 1 file
- **Deps:** none
- **Risk:** 🟢

### 1.2 — Delete empty `src/app/test-data/` directory 🟢

- **Where:** [src/app/test-data/](../../src/app/test-data/)
- **Wrong:** empty leftover directory; Next 16 will treat any future `page.tsx` here as a public route.
- **Target:** `rmdir`.
- **Scope:** 1 directory
- **Deps:** none
- **Risk:** 🟢

### 1.3 — Sync `.env.example` with actual env var names 🟢

- **Where:** `.env.example` (root)
- **Wrong:** uses reserved `AWS_*` namespace; Amplify rejects these. Real code uses `APP_AWS_*` (CLAUDE.md "Common Mistakes #5").
- **Target:** rename the four AWS keys, add a header comment pointing at `.claude/docs/infrastructure.md` for the canonical list.
- **Scope:** 1 file
- **Deps:** none
- **Risk:** 🟢

### 1.4 — 💾 Commit point: "chore: critical cleanup (remove dead dotenv import, empty test-data dir, sync .env.example)"

---

## 2. Type Safety

> Tighten types where the audit named specific loose spots. Type-system consolidation is its own group (§3).

### 2.1 — Replace `Record<string, unknown>` in blog `where` clause 🟢

- **Where:** [src/app/api/blog/route.ts:23](../../src/app/api/blog/route.ts#L23)
- **Wrong:** loose typing diverges from the projects route's `Prisma.ProjectWhereInput` pattern (api-routes.md rule).
- **Target:**
  ```ts
  import { Prisma } from "@/generated/prisma/client";
  const where: Prisma.BlogPostWhereInput = {};
  ```
- **Scope:** 1 file
- **Deps:** none
- **Risk:** 🟢

### 2.2 — Audit other `where: Record<string, unknown>` instances 🟢

- **Where:** all of [src/app/api/](../../src/app/api/)
- **Wrong:** unknown until grepped — drive-by check while in the API tree.
- **Target:** convert each to `Prisma.<Model>WhereInput`. If none found, skip.
- **Scope:** ≤ ~5 files (estimated)
- **Deps:** 2.1 (sets the pattern)
- **Risk:** 🟢

### 2.3 — 💾 Commit point: "refactor(api): tighten Prisma where-clause typing"

---

## 3. Project Structure ⏳

> Big-impact directory move. Drives §4 (component refactor) since admin components import from `@/types/`.

### 3.1 — Inventory `src/types/*` vs `src/lib/data/types.ts` 🔍

- **Where:** [src/types/](../../src/types/) (5 files), [src/lib/data/types.ts](../../src/lib/data/types.ts)
- **Wrong:** two parallel type systems (audit anti-pattern #2). 13 files still import from `@/types/`.
- **Target:** for each `src/types/<entity>.ts`, decide:
  - if the type is admin-only (includes `DRAFT`, draft-only fields) → move into `@/lib/data/types.ts` under an `Admin*` prefix
  - if it's a duplicate of a public type → delete and update imports
- **Scope:** read-only diff; produce a mapping table and post here before touching code
- **Deps:** none
- **Risk:** 🔴 ⚠️ ⏳ 🔍

### 3.2 — Migrate imports from `@/types/*` to `@/lib/data/types` 🟡

- **Where:** the 13 files listed below + `src/types/` itself
  - [src/app/(admin)/admin/(shell)/experience/[id]/edit/page.tsx](<../../src/app/(admin)/admin/(shell)/experience/[id]/edit/page.tsx>)
  - [src/app/(admin)/admin/(shell)/projects/[id]/edit/page.tsx](<../../src/app/(admin)/admin/(shell)/projects/[id]/edit/page.tsx>)
  - [src/app/(admin)/admin/(shell)/projects/page.tsx](<../../src/app/(admin)/admin/(shell)/projects/page.tsx>)
  - [src/app/(admin)/admin/(shell)/education/[id]/edit/page.tsx](<../../src/app/(admin)/admin/(shell)/education/[id]/edit/page.tsx>)
  - [src/components/admin/ProjectForm.tsx](../../src/components/admin/ProjectForm.tsx)
  - [src/components/admin/BlogPostForm.tsx](../../src/components/admin/BlogPostForm.tsx) (if applicable)
  - [src/components/admin/EducationForm.tsx](../../src/components/admin/EducationForm.tsx)
  - [src/components/admin/ExperienceForm.tsx](../../src/components/admin/ExperienceForm.tsx)
  - [src/components/admin/SkillFormDialog.tsx](../../src/components/admin/SkillFormDialog.tsx)
  - [src/components/admin/CertificationFormDialog.tsx](../../src/components/admin/CertificationFormDialog.tsx)
  - [src/components/admin/SkillsManagerSection.tsx](../../src/components/admin/SkillsManagerSection.tsx)
  - [src/components/admin/EducationManagerSection.tsx](../../src/components/admin/EducationManagerSection.tsx)
  - [src/components/admin/ExperienceManagerSection.tsx](../../src/components/admin/ExperienceManagerSection.tsx)
  - [src/components/admin/CertificationsManagerSection.tsx](../../src/components/admin/CertificationsManagerSection.tsx)
- **Target:**
  ```ts
  // before
  import type { Project } from "@/types/project";
  // after
  import type { AdminProject } from "@/lib/data/types"; // or PublicProject, depending on usage
  ```
  After every file is migrated, `rm -r src/types`.
- **Scope:** 13–14 files
- **Deps:** 3.1
- **Risk:** 🟡 ⚠️ — mismatched shapes will surface as TS errors; run `npm run type-check` after each file
- **Verification:** `npm run type-check` && `npm run build` clean

### 3.3 — 💾 Commit point: "refactor: consolidate type system into @/lib/data/types, remove src/types/"

---

## 4. Component Refactoring ⏳

> Two large components plus the dashboard hybrid. High-touch — needs review.

### 4.1 — Decide admin dashboard rendering pattern 🔴 🔍

- **Where:** [src/app/(admin)/admin/(shell)/page.tsx](<../../src/app/(admin)/admin/(shell)/page.tsx>) (134 LOC, server component) + [src/app/(admin)/admin/(shell)/layout.tsx](<../../src/app/(admin)/admin/(shell)/layout.tsx>) (`"use client"`)
- **Wrong:** mismatch — server component nested in a client layout; inconsistent with all other admin pages (which are client + TanStack Query). Audit anti-pattern #3.
- **Target options:**
  - **A.** Convert dashboard to client component, fetch via `apiClient` + TanStack Query (consistent with rest of admin)
  - **B.** Keep dashboard as RSC, build a tiny `/api/admin/dashboard-stats` route, but keep current direct-Prisma — accept the inconsistency, document why
- **Recommendation:** A. Stats are cheap, no SEO need, and consistency wins.
- **Scope:** 1 page + 1 new API route + 1 new hook
- **Deps:** none
- **Risk:** 🔴 🔍 — pattern decision should be approved before code

### 4.2 — Split `ProjectForm.tsx` (461 LOC) 🟡 ⚠️

- **Where:** [src/components/admin/ProjectForm.tsx](../../src/components/admin/ProjectForm.tsx)
- **Wrong:** single file owns: form schema wiring, gallery upload UX, tag input, CRUD mutation. Hard to navigate; reuse with `BlogPostForm` is impossible.
- **Target:** extract subcomponents into the same directory:
  ```
  src/components/admin/project-form/
    ProjectForm.tsx          (orchestrator, ≤ 200 LOC)
    ProjectMetaFields.tsx    (title, slug, status, dates)
    ProjectTagInput.tsx      (techTags array editor)
    ProjectGallerySection.tsx (uses existing GalleryUpload)
    useProjectFormMutation.ts (TanStack mutation + revalidation)
  ```
  Default export `ProjectForm` from `ProjectForm.tsx`.
- **Scope:** 1 file → ~5 files
- **Deps:** 3.2 (so types are stable)
- **Risk:** 🟡 ⚠️ — visual regression test by editing/creating a project end-to-end after merge

### 4.3 — Split `BlogPostForm.tsx` (346 LOC) 🟡 ⚠️

- **Where:** [src/components/admin/BlogPostForm.tsx](../../src/components/admin/BlogPostForm.tsx)
- **Wrong:** same shape as 4.2 — markdown editor, cover image, tag input, mutation all in one file.
- **Target:** mirror 4.2 layout: `blog-post-form/` directory with orchestrator + meta fields + cover-image + markdown-editor wrapper + mutation hook.
- **Scope:** 1 → ~5 files
- **Deps:** 4.2 (proves the pattern first)
- **Risk:** 🟡 ⚠️

### 4.4 — 💾 Commit point per item (4.1, 4.2, 4.3 separately so blame stays clean)

---

## 5. API Standardization ⏳

> Single biggest source of inconsistency. Two campaigns: `pageSize` and `success: true`.

### 5.1 — Migrate `pageSize` → `limit` in blog API 🟡 ⚠️

- **Where:** [src/app/api/blog/route.ts](../../src/app/api/blog/route.ts) (lines 16, 56–57, 81–82)
- **Wrong:** uses `pageSize`; api-routes.md mandates `limit` + `page`.
- **Target:**
  ```ts
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  // ...
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  ```
- **Consumers to update:**
  - any blog admin page or hook that reads `meta.pageSize`
  - any public blog query that passes `?pageSize=`
  - grep `pageSize` site-wide before declaring done
- **Scope:** 1 route + ~2 consumers
- **Deps:** none
- **Risk:** 🟡 ⚠️ — silent breakage if a consumer keeps reading `meta.pageSize`

### 5.2 — Migrate `pageSize` → `limit` in messages API 🟡 ⚠️

- **Where:** [src/app/api/messages/route.ts](../../src/app/api/messages/route.ts) (lines 15, 34, 41, 54–55)
- **Target:** same as 5.1.
- **Consumers to update:**
  - [src/hooks/use-messages.ts](../../src/hooks/use-messages.ts)
  - [src/app/(admin)/admin/(shell)/messages/](<../../src/app/(admin)/admin/(shell)/messages/>) pages
- **Scope:** 1 route + ~2 consumers
- **Deps:** 5.1 (proves the pattern)
- **Risk:** 🟡 ⚠️

### 5.3 — Strip `{ success: true }` envelope from reorder routes 🟡

- **Where:** all 6 reorder routes:
  - [src/app/api/projects/reorder/route.ts:36](../../src/app/api/projects/reorder/route.ts#L36)
  - [src/app/api/experience/reorder/route.ts:32](../../src/app/api/experience/reorder/route.ts#L32)
  - [src/app/api/education/reorder/route.ts:32](../../src/app/api/education/reorder/route.ts#L32)
  - [src/app/api/certifications/reorder/route.ts:32](../../src/app/api/certifications/reorder/route.ts#L32)
  - [src/app/api/skills/reorder/route.ts:32](../../src/app/api/skills/reorder/route.ts#L32)
  - [src/app/api/skill-categories/reorder/route.ts:32](../../src/app/api/skill-categories/reorder/route.ts#L32)
- **Target:** return `{ data: { count: parsed.data.orderedIds.length } }` (drop `success`). The drag-and-drop client only needs the count for optimistic-update reconciliation; check the consumer.
- **Scope:** 6 route files + corresponding manager-section components (consumers)
- **Deps:** none
- **Risk:** 🟡 ⚠️ — front-end may destructure `success`

### 5.4 — Strip `{ success: true }` from one-off routes 🟡

- **Where:**
  - [src/app/api/contact/route.ts:14, 66](../../src/app/api/contact/route.ts) (returns `{ data: { success, message } }`)
  - [src/app/api/auth/refresh/route.ts:19](../../src/app/api/auth/refresh/route.ts#L19)
  - [src/app/api/auth/signout/route.ts:17](../../src/app/api/auth/signout/route.ts#L17)
  - [src/app/api/upload/route.ts:268](../../src/app/api/upload/route.ts#L268) (DELETE handler)
- **Target:**
  - contact: `Response.json({ data: { message: "..." } }, { status: 200 })` — drop `success`
  - auth/refresh, auth/signout: `204 No Content` (no body) per api-routes.md "delete returns 204"
  - upload DELETE: `204 No Content`
- **Consumers to update:**
  - api-client.ts (any `success` checks)
  - signout/refresh callers (currently rely on JSON response — switch to `res.ok`)
- **Scope:** 4 routes + api-client + ~2 callers
- **Deps:** 5.3
- **Risk:** 🟡 ⚠️ 🔒 — auth flows; verify signout still revokes server-side and clears cookies after the change

### 5.5 — 💾 Commit per sub-section: 5.1+5.2 (pagination), 5.3+5.4 (envelope)

---

## 6. Database Layer

> Audit didn't flag specific schema bugs. This group is mostly verification.

### 6.1 — Confirm Prisma schema matches `prisma-schema.md` rules 🟢

- **Where:** [prisma/schema.prisma](../../prisma/schema.prisma)
- **Action:** read each model; flag any that violate:
  - missing `@@index([slug])` on slug-bearing models
  - missing `@@index([status, displayOrder])` on ordered+statused models
  - unbounded `String` where a `VarChar(N)` cap fits the rule (titles ≤ 200 etc.)
  - missing explicit `onDelete` on FKs
- **Target:** report findings here; if drift exists, file as 6.2.
- **Scope:** read-only audit
- **Deps:** none
- **Risk:** 🟢

### 6.2 — (Conditional) fix any drift found in 6.1 🟡

- **Target:** one migration per logical change, reversible (no destructive drops on already-applied migrations — see prisma-schema.md).
- **Deps:** 6.1
- **Risk:** 🟡 ⚠️ — schema migrations require Neon branch testing per `prisma-neon` skill rules. Use **db-agent** for this work.

### 6.3 — Standardize Prisma `select` vs `include` in public-queries 🟢

- **Where:** [src/lib/data/public-queries.ts](../../src/lib/data/public-queries.ts)
- **Action:** ensure each query uses `select` (not `include`) so over-fetching can't sneak in. The audit didn't flag this; do a drive-by.
- **Risk:** 🟢

### 6.4 — 💾 Commit point: "chore(db): schema audit pass" (only if 6.2 ran)

---

## 7. Styling Cleanup

### 7.1 — Decide on `next-themes` / dark mode 🔴 🔍

- **Where:** [src/components/ui/sonner.tsx](../../src/components/ui/sonner.tsx) is the only `next-themes` import; `globals.css` has full `.dark` variables; no `<ThemeProvider>` in root layout; public pages use hardcoded `gray-900`/`white`.
- **Two paths:**
  - **A. Remove:** uninstall `next-themes`, drop `.dark` block from `globals.css`, change Sonner to use a static theme. Smallest blast radius.
  - **B. Implement:** add `<ThemeProvider attribute="class">` to root layout, add toggle to public Header, replace hardcoded color classes with theme tokens.
- **Recommendation:** A unless you've already decided to ship dark mode. B is multi-day and out-of-scope for "refactor."
- **Scope:** A → ~3 files. B → ~30+ files.
- **Deps:** none (but 9.4 depends on the decision)
- **Risk:** 🔴 🔍 — user decision required before execution

### 7.2 — Replace hardcoded colors with theme tokens (only if 7.1 = B) 🟡

- **Where:** all of [src/components/public/](../../src/components/public/) and [src/app/(public)/](<../../src/app/(public)/>)
- **Target:** `bg-gray-50` → `bg-background`, `text-gray-900` → `text-foreground`, etc.
- **Scope:** ~25 files
- **Deps:** 7.1 = B
- **Risk:** 🟡 ⚠️ ⏳

---

## 8. Missing Infrastructure

### 8.1 — Add root `error.tsx` 🟢

- **Where:** create [src/app/error.tsx](../../src/app/error.tsx)
- **Target:** client-component error boundary mirroring the public/admin variants (logs, retry button, friendly copy).
  ```tsx
  "use client";
  export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
    // log error to monitoring (TODO until 8.6 lands)
    return ( /* minimal UI */ );
  }
  ```
- **Scope:** 1 new file
- **Deps:** none
- **Risk:** 🟢

### 8.2 — Add `(public)/not-found.tsx` 🟢

- **Where:** create [src/app/(public)/not-found.tsx](<../../src/app/(public)/not-found.tsx>)
- **Target:** styled 404 wrapped in the public layout (Header/Footer present). Replaces falling-through to root `not-found.tsx`.
- **Scope:** 1 new file
- **Deps:** none
- **Risk:** 🟢

### 8.3 — Add `loading.tsx` to public route segments 🟢

- **Where:** create:
  - [src/app/(public)/projects/loading.tsx](<../../src/app/(public)/projects/loading.tsx>)
  - [src/app/(public)/projects/[slug]/loading.tsx](<../../src/app/(public)/projects/[slug]/loading.tsx>)
  - [src/app/(public)/blog/loading.tsx](<../../src/app/(public)/blog/loading.tsx>)
  - [src/app/(public)/blog/[slug]/loading.tsx](<../../src/app/(public)/blog/[slug]/loading.tsx>)
  - [src/app/(public)/contact/loading.tsx](<../../src/app/(public)/contact/loading.tsx>)
- **Target:** server component returning a skeleton matching the page shape. Use the existing [src/app/(public)/about/loading.tsx](<../../src/app/(public)/about/loading.tsx>) as the reference pattern.
- **Scope:** 5 new files
- **Deps:** none
- **Risk:** 🟢

### 8.4 — 💾 Commit point: "feat: add error boundary, public 404, loading states"

### 8.5 — Replace in-memory rate limiter with Upstash Redis 🔴 🔒 ⏳ ⚠️

- **Where:** [src/lib/rate-limit.ts](../../src/lib/rate-limit.ts) and consumers ([contact](../../src/app/api/contact/route.ts), [upload](../../src/app/api/upload/route.ts))
- **Wrong:** in-memory `Map` doesn't survive Lambda cold starts (audit anti-pattern #4); `setInterval` at module scope leaks (#5). CSP already allow-lists Upstash.
- **Target:** install `@upstash/ratelimit` + `@upstash/redis`; create `src/lib/rate-limit-upstash.ts` with the same `consume(identifier, max, windowSec)` signature; swap call sites; add env vars to `.env.example` + Amplify Console.
- **Scope:** 1 new lib + 2 route updates + env setup + delete old `rate-limit.ts`
- **Deps:** none, but **needs an Upstash account/db provisioned first** — ask user before starting
- **Risk:** 🔴 🔍 🔒 ⚠️ ⏳ — affects production rate limiting; needs end-to-end test in dev with real Upstash before deploy

### 8.6 — (Out of scope here) Sentry / structured logging

- Audit calls this out (Missing Fundamentals #9). It's a separate initiative — not part of this refactor. Note for later.

---

## 9. Dead Code Removal

### 9.1 — Remove `zustand` 🟢

- **Where:** `package.json`
- **Action:** `npm uninstall zustand`. Confirm zero imports first (`grep -r "zustand" src/`).
- **Risk:** 🟢

### 9.2 — Remove `@types/sharp` 🟢

- **Where:** `package.json` (devDependencies)
- **Why:** deprecated; Sharp ≥ 0.33 ships its own types. Audit dependency-health table.
- **Action:** `npm uninstall @types/sharp`, run `npm run type-check` to confirm no breakage.
- **Risk:** 🟢

### 9.3 — Move `dotenv` from prod deps to dev deps (or remove) 🟢

- **Where:** `package.json`
- **Why:** after 1.1, runtime no longer imports `dotenv`. Only `prisma.config.ts` (CLI) needs it.
- **Action:** `npm uninstall dotenv && npm install -D dotenv` (or remove entirely if `prisma.config.ts` works without — verify).
- **Deps:** 1.1
- **Risk:** 🟢

### 9.4 — ~~Remove `next-themes`~~ — **OBSOLETE** (Session 8 took 7.1 Path B)

- Dark mode was fully implemented in Session 8 (2026-05-07). `next-themes` is now load-bearing — do not remove.

### 9.5 — 💾 Commit point: "chore: remove unused dependencies"

---

## 10. Testing ⏳

> Greenfield — `tests.md` already specifies Vitest + Playwright but nothing is wired.

### 10.1 — Scaffold Vitest 🟡

- **Action:**
  - install: `vitest`, `@vitest/ui` (optional), `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - create `vitest.config.ts` at repo root (jsdom env, path aliases matching tsconfig)
  - update `package.json` scripts: `"test": "vitest"`, `"test:ci": "vitest run --coverage"`
  - add `src/test/setup.ts` for `@testing-library/jest-dom` extensions
- **Scope:** ~3 new files + package.json
- **Deps:** none
- **Risk:** 🟡 — verify `npm run test` runs (zero tests = `vitest` exits 0)

### 10.2 — First critical-path tests (per tests.md priority) 🟡

- **Targets in priority order:**
  1. [src/lib/errors.ts](../../src/lib/errors.ts) — `withErrorHandler` happy / `ApiError` / unknown-error paths
  2. [src/app/api/auth.ts](../../src/app/api/auth.ts) — `requireAuth` token present / absent / invalid
  3. [src/lib/validations/project.ts](../../src/lib/validations/project.ts), [contact.ts](../../src/lib/validations/contact.ts) — boundary cases
  4. [src/app/api/contact/route.ts](../../src/app/api/contact/route.ts) — rate limit + honeypot + happy path
- **Scope:** 4 test files
- **Deps:** 10.1
- **Risk:** 🟡 ⚠️ — tests against the contact route need to mock SES (or hit a sandbox)

### 10.3 — CI workflow (GitHub Actions) 🟡

- **Where:** create `.github/workflows/ci.yml`
- **Target:** runs `npm ci`, `npm run lint`, `npm run type-check`, `npm run test:ci` on PR. (E2E + Neon-branch DB out of scope here.)
- **Scope:** 1 new file
- **Deps:** 10.1, 10.2
- **Risk:** 🟡 — first CI run will reveal latent issues; budget time for fix-forward

### 10.4 — 💾 Commit point: "test: add Vitest scaffold and first critical-path tests"

---

## 11. Documentation

### 11.1 — README rewrite 🟢

- **Where:** [README.md](../../README.md)
- **Wrong:** likely default Next.js boilerplate (verify).
- **Target:** sections: project intro, setup (env from `infrastructure.md`), commands table, architecture pointer to `CLAUDE.md`, deployment note (Amplify).
- **Scope:** 1 file
- **Risk:** 🟢

### 11.2 — Inline JSDoc on public API of `src/lib/data/public-queries.ts` and `src/lib/errors.ts` 🟢

- **Target:** one-line `/** */` per exported function. Keep it minimal — names already tell the story.
- **Scope:** 2 files
- **Risk:** 🟢

### 11.3 — 💾 Commit point: "docs: README + lib doc-comments"

---

## Out-of-scope (won't do here, noted for follow-up)

- **Sentry / structured logging** — its own initiative
- **OpenAPI / API spec generation** — premature; revisit if a public API consumer appears
- **CSRF tokens** — not trivial; SameSite=Lax + same-origin gets us most of the way; revisit if cookie policy changes
- **Admin write-side input sanitization (XSS-in-DB)** — separate security pass; markdown render is already sanitized
- **IAM-role-based AWS access (vs long-lived keys)** — Amplify ops change

---

## Execution rules

1. **Sessions are independent.** Stop at every 💾 commit point. `npm run lint && npm run build` must pass before commit.
2. **Log every action to `refactor-log.md`** (will be created on first execution). Format: ID, files touched, command run, outcome.
3. **Never proceed past a 🔴 🔍 item without explicit approval.**
4. **If a step blows up beyond expected scope, stop and report.** Do not patch around it.
5. **No new patterns introduced during refactor.** This is consolidation, not redesign. New abstractions need their own discussion.
