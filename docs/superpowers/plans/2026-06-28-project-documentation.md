# Project Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a showcase root `README.md` plus five focused `docs/*.md` reference documents that accurately document portfolio-v2's architecture, API surface, setup, tech stack, and features.

**Architecture:** Hand-written Markdown only. README is the recruiter/collaborator surface; the five `docs/*.md` files carry developer depth. Every fact is verified against source files (schema, route files, `package.json`, `amplify.yml`, `.env.example`, `.claude/docs/infrastructure.md`), never copied from the roadmap. Diagrams and screenshots already in `docs/` are embedded, not recreated.

**Tech Stack:** Markdown. Source-of-truth files: `prisma/schema.prisma`, `src/app/api/**/route.ts`, `src/app/api/auth.ts`, `package.json`, `amplify.yml`, `.env.example`, `.claude/docs/infrastructure.md`, `mcp/portfolio-server/`, `docs/diagrams/`, `docs/screenshots/`.

## Global Constraints

- Documentation only — **do not edit any application code**.
- **No secrets.** Environment docs list variable NAMES + purpose only, never values.
- Verify every API route's method + auth by reading its `route.ts` — do not trust prior scans.
- Source all facts from actual files, not `.claude/docs/feature-roadmap.md`.
- Embed existing assets in `docs/diagrams/` and `docs/screenshots/`; create no new diagrams.
- Live demo URL is `https://asakurayuta.dev`. Use it verbatim — not `NEXT_PUBLIC_APP_URL`.
- Markdown must survive `npm run lint` (Prettier) unchanged after formatting.
- Work happens on a feature branch (see Task 0) — `README.md` at root is NOT covered by the `develop` edit guard.
- Each doc commits separately. Commit style: subject line only, no body, no `Co-Authored-By`. Do NOT push or open a PR without explicit user permission.

---

### Task 0: Feature branch

**Files:** none (git only).

- [ ] **Step 1: Create and switch to the feature branch**

REQUIRED SUB-SKILL: Use superpowers:using-git-worktrees to isolate this work. If using a plain branch instead of a worktree:

Run: `git checkout -b docs/project-documentation`
Expected: `Switched to a new branch 'docs/project-documentation'`

- [ ] **Step 2: Confirm not on develop/main**

Run: `git branch --show-current`
Expected: `docs/project-documentation`

---

### Task 1: docs/architecture.md

**Files:**

- Create: `docs/architecture.md`
- Read for facts: `src/app/(public)/`, `src/app/(admin)/admin/`, `src/lib/data/public-queries.ts`, `src/lib/data/db-resilience.ts`, `src/lib/data/types.ts`, `src/proxy.ts`, `prisma/schema.prisma`, `CLAUDE.md` (Architecture table), `docs/diagrams/architecture.excalidraw`, `docs/diagrams/aws-architecture.png`

**Interfaces:**

- Produces: a heading `## Architecture` and anchor links other docs/README reference. Section anchors: `#directory-structure`, `#requestrendering-model`, `#data-layer`, `#dual-database`.

- [ ] **Step 1: Gather structural facts**

Read the source dirs/files above. Confirm the actual route segments under `src/app/(public)` and `src/app/(admin)/admin` by listing their folders. Confirm the data-layer pattern (`withDbRetry`) by reading `db-resilience.ts` and one consumer in `public-queries.ts`. Confirm `proxy.ts` is the JWT guard.

- [ ] **Step 2: Write docs/architecture.md**

Sections, in order:

1. **Overview** — 2–3 sentences: Next.js 16 App Router, public ISR site + auth-guarded admin CMS, Neon Postgres via Prisma.
2. **Directory structure** — annotated tree of `src/` (3 levels) with one-line purpose per significant folder (`app/(public)`, `app/(admin)`, `app/api`, `components/{ui,public,admin,shared,providers}`, `lib/{data,validations,import-export,aws}`, `hooks`, plus top-level `prisma/`, `mcp/`, `scripts/`, `docs/`, `.claude/`).
3. **Route groups** — table of public routes and admin routes (paths only; methods/auth live in api-reference.md).
4. **Request / rendering model** — ISR for public pages, Server Components by default, `proxy.ts` JWT guard for `/admin`, client islands via TanStack Query.
5. **Data layer** — `src/lib/data/public-queries.ts` as the only path for public Server Component reads, canonical types in `types.ts`, and the `withDbRetry` ISR-safety rule (rethrow vs degrade).
6. **Dual database** — production vs dev Neon branches, where each is used, that MCP/localhost hit dev.
7. **Diagrams** — embed `docs/diagrams/aws-architecture.png`; link `docs/diagrams/architecture.excalidraw` (and embed an exported PNG if one exists).

- [ ] **Step 3: Verify**

Run: `ls "src/app/(public)" "src/app/(admin)/admin"`
Expected: the folder list matches the route tables written in the doc. Fix any mismatch.

Confirm the embedded image path resolves:
Run: `ls docs/diagrams/aws-architecture.png`
Expected: file exists.

- [ ] **Step 4: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: add architecture reference"
```

---

### Task 2: docs/api-reference.md

**Files:**

- Create: `docs/api-reference.md`
- Read for facts: every `src/app/api/**/route.ts`, `src/app/api/auth.ts`, `src/lib/errors.ts`, `mcp/portfolio-server/src/tools/*.ts`, `mcp/portfolio-server/README.md`

**Interfaces:**

- Produces: heading `## API Reference` with section anchors `#public`, `#admin--cms`, `#auth`, `#importexport`, `#translation`, `#health`, `#mcp-server`.

- [ ] **Step 1: Enumerate every route**

Run: `find "src/app/api" -name route.ts | sort`
Expected: the complete list of route files. This is the authoritative route inventory — the table must match it 1:1.

- [ ] **Step 2: Determine method + auth per route**

For each `route.ts`, read it and record: exported HTTP methods (`export async function GET/POST/PATCH/DELETE`), the auth helper imported from `@/app/api/auth` (`requireAuth` | `requireAuthOrApiKey` | `optionalAuth` | none), and whether `rateLimit()` is called. **Do not trust earlier scans** — reorder/export/import verbs especially must be read from source.

- [ ] **Step 3: Write docs/api-reference.md**

Sections:

1. **Conventions** — response envelope `{ data }` / `{ data, meta }`, error shape via `ApiError` + `withErrorHandler`, pagination `page`/`limit` → `meta: { total, page, limit, totalPages }`, export routes return raw file (no envelope).
2. **Route tables**, grouped Public / Admin-CMS / Auth / Import-Export / Translation / Health. Each row: `Method` · `Path` · `Auth` · `Rate-limited`.
3. **MCP server** — intro (stdio transport, Bearer auth, targets dev by default, `portfolio-prod` for production), then a table of the tool domains and tool counts (projects, experience, education, skills, certifications, messages, blog, content, dashboard), and the no-delete-on-messages security note. Confirm the total tool count by reading the `tools/*.ts` files rather than asserting 43.

- [ ] **Step 4: Verify**

Cross-check: the number of route rows equals the line count of the `find` output (accounting for multi-method rows). Spot-check 5 rows against their `route.ts` for correct method + auth.

Run: `find "src/app/api" -name route.ts | wc -l`
Expected: matches the count of distinct route paths documented.

- [ ] **Step 5: Commit**

```bash
git add docs/api-reference.md
git commit -m "docs: add API reference"
```

---

### Task 3: docs/setup.md

**Files:**

- Create: `docs/setup.md`
- Read for facts: `.env.example`, `.claude/docs/infrastructure.md`, `package.json` (scripts), `scripts/`, `prisma/CLAUDE.md`, `CLAUDE.md` (Environment Setup, Commands)

**Interfaces:**

- Produces: heading `## Setup & Development` with anchors `#prerequisites`, `#environment-variables`, `#local-setup`, `#database-workflow`, `#scripts`, `#testing`.

- [ ] **Step 1: Gather env + script facts**

Read `.env.example` and `.claude/docs/infrastructure.md` §Environment Variables for the full variable list. Read the `scripts` block in `package.json`. Note `.env.example` has known drift — annotate variables as needed but list names from both sources.

- [ ] **Step 2: Write docs/setup.md**

Sections:

1. **Prerequisites** — Node (LTS), a Neon Postgres project, AWS account (S3/CloudFront/SES/Cognito), optional Upstash + Sentry + Anthropic keys.
2. **Environment variables** — grouped table (Database, AWS, Cognito, SES, Upstash, Sentry, Anthropic, Analytics, MCP, Neon mgmt). Columns: `Variable` · `Purpose`. **Names + purpose only — no values.** Note the `APP_AWS_*` (not `AWS_*`) convention.
3. **Local setup** — `git clone`, `npm install`, create `.env`, `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run dev` → `http://localhost:3000`.
4. **Database workflow** — dev vs prod Neon branches, `npm run db:reset-dev`, migrate-status before migrate-dev.
5. **Scripts** — full table of every npm script with one-line purpose.
6. **Testing** — `npm test` (watch), `npm run test:ci` (coverage), the `/check` gate (lint + type-check + test).

- [ ] **Step 3: Verify no secrets leaked**

Run: `grep -nE '=(.+)' docs/setup.md | grep -vE '\|' || echo "no KEY=value lines"`
Expected: no lines that assign real values to variables (table cells using `|` are fine). Manually confirm every env entry is name + description only.

Confirm the scripts table matches source:
Run: `node -e "console.log(Object.keys(require('./package.json').scripts).join('\n'))"`
Expected: every listed script appears in the doc's scripts table.

- [ ] **Step 4: Commit**

```bash
git add docs/setup.md
git commit -m "docs: add setup and development guide"
```

---

### Task 4: docs/tech-stack.md

**Files:**

- Create: `docs/tech-stack.md`
- Read for facts: `package.json` (dependencies + versions), `CLAUDE.md` (Tech Stack section + Common Mistakes), `amplify.yml`, `next.config.ts`, `.claude/docs/infrastructure.md`

**Interfaces:**

- Produces: heading `## Tech Stack` with anchors `#stack-rationale`, `#deployment`, `#aws-topology`.

- [ ] **Step 1: Gather version + rationale facts**

Read `package.json` for exact versions. Read `CLAUDE.md` Tech Stack + Common Mistakes for the documented "why" behind key pins (`three@^0.182`, `PrismaNeon` WebSocket adapter, `serverExternalPackages`, Sentry `webpack.treeshake`). Read `amplify.yml` for the build pipeline phases.

- [ ] **Step 2: Write docs/tech-stack.md**

Sections:

1. **Stack rationale** — table or bullets per choice with the _why_: Next.js 16 App Router, React 19, Prisma 7 + `PrismaNeon` WebSocket adapter (and why not HTTP adapter), `@neondatabase/serverless`, Tailwind v4 (`@theme`, no JS config), shadcn/Radix, TanStack Query (no Zustand), react-hook-form + Zod 4, Cognito + jose, Sentry, `three@^0.182` pin, Sharp/WebP, remark/rehype markdown.
2. **Deployment** — Amplify Hosting Gen 1 build pipeline (preBuild → build → postBuild) summarized from `amplify.yml`, including `.env.production` materialization and source-map stripping.
3. **AWS topology** — S3 (images) → CloudFront (CDN), SES (email), Cognito (auth), Neon (DB). One line each. Reference `docs/diagrams/aws-architecture.png`.

- [ ] **Step 3: Verify versions match source**

Run: `node -e "const p=require('./package.json'); console.log(p.dependencies.next, p.dependencies['@prisma/client'], p.dependencies.three)"`
Expected: the next/prisma/three versions in the doc match this output.

- [ ] **Step 4: Commit**

```bash
git add docs/tech-stack.md
git commit -m "docs: add tech stack and deployment overview"
```

---

### Task 5: docs/features.md

**Files:**

- Create: `docs/features.md`
- Read for facts: `src/components/public/`, `src/components/admin/`, `docs/screenshots/public/`, `docs/screenshots/admin/`, `CLAUDE.md` (feature descriptions)

**Interfaces:**

- Produces: heading `## Features` with anchors `#public-site`, `#admin-cms`.

- [ ] **Step 1: Confirm available screenshots**

Run: `ls docs/screenshots/public docs/screenshots/admin`
Expected: the screenshot filenames to embed. Use only filenames that actually exist.

- [ ] **Step 2: Write docs/features.md**

Sections:

1. **Public site** — hero + 3D blob, projects (grid/detail/gallery), blog (markdown, TOC, reading time, social share), about (experience/education/skills/certifications), contact form, EN/JA toggle, dark mode, SEO (JSON-LD, OG images, sitemap, RSS pending). Embed 3–5 relevant public screenshots.
2. **Admin CMS** — dashboard (stat cards, external services, translation status, completeness, recent activity), per-entity managers, drag-reorder, markdown editors, unified import/export, translations page, AI certificate extraction (Haiku vision). Embed 3–5 relevant admin screenshots.

- [ ] **Step 3: Verify embedded image paths resolve**

For each `![...](path)` in the doc, confirm the file exists:
Run: `grep -oE '\]\(([^)]+\.(png|jpg|jpeg))\)' docs/features.md | sed -E 's/\]\((.*)\)/\1/' | while read f; do test -f "$f" && echo "OK $f" || echo "MISSING $f"; done`
Expected: every line prints `OK`. Fix any `MISSING`.

- [ ] **Step 4: Commit**

```bash
git add docs/features.md
git commit -m "docs: add feature catalog"
```

---

### Task 6: README.md

**Files:**

- Create/overwrite: `README.md` (read existing first if present)
- Read for facts: all five `docs/*.md` (for link targets + summaries), `docs/screenshots/public/`, `docs/diagrams/aws-architecture.png`, `package.json`, `.github/workflows/` (for CI badge slug), `LICENSE` (if present)

**Interfaces:**

- Consumes: the five `docs/*.md` files (Tasks 1–5) and their heading anchors for the documentation index.

- [ ] **Step 1: Check existing README + badge sources**

Run: `test -f README.md && echo EXISTS || echo NONE`
Run: `ls .github/workflows 2>/dev/null; test -f LICENSE && echo "LICENSE present" || echo "no LICENSE"`
Use the workflow filename for the CI badge; omit the license badge if no `LICENSE` file exists.

- [ ] **Step 2: Write README.md**

Sections, in order (per spec):

1. **Hero block** — title, one-line pitch, badge row (CI status from the actual workflow, Next.js version, TypeScript, deploy/live), live demo link → `https://asakurayuta.dev`.
2. **Screenshot** — one public hero shot from `docs/screenshots/public/`.
3. **Highlights** — GLSL 3D hero blob, DB-driven EN/JA i18n via Claude Haiku, 43-tool MCP server, AI cert extraction, dual Neon branches, full admin CMS.
4. **Tech stack** — compact badge row / short table; link to `docs/tech-stack.md`.
5. **Architecture at a glance** — embed `docs/diagrams/aws-architecture.png` + 2–3 sentences; link `docs/architecture.md`.
6. **Quick start** — clone → `npm install` → `.env` → `npm run dev`; framed honestly (needs your own AWS/Neon/Cognito creds); link `docs/setup.md`.
7. **Documentation index** — links to all five `docs/*.md`.
8. **Project structure** — condensed top-level tree.
9. **License / contact.**

- [ ] **Step 3: Verify all internal links resolve**

Run: `grep -oE '\]\(([^)]+)\)' README.md | sed -E 's/\]\((.*)\)/\1/' | grep -vE '^https?://' | sed -E 's/#.*$//' | while read f; do [ -z "$f" ] && continue; test -e "$f" && echo "OK $f" || echo "MISSING $f"; done`
Expected: every local link prints `OK`. Fix any `MISSING`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add showcase README"
```

---

### Task 7: Final verification

**Files:** none (validation only).

- [ ] **Step 1: Lint Markdown**

Run: `npx prettier --check "README.md" "docs/*.md"`
Expected: `All matched files use Prettier code style!` If it reports issues, run `npx prettier --write` on those files and re-commit with `docs: format documentation`.

- [ ] **Step 2: Validate every local link across all docs**

Run: `for doc in README.md docs/architecture.md docs/api-reference.md docs/setup.md docs/tech-stack.md docs/features.md; do grep -oE '\]\(([^)]+)\)' "$doc" | sed -E 's/\]\((.*)\)/\1/' | grep -vE '^https?://' | sed -E 's/#.*$//' | while read f; do [ -z "$f" ] && continue; case "$f" in /*) p="${f#/}";; *) p="$(dirname "$doc")/$f";; esac; test -e "$p" && echo "OK $doc -> $f" || echo "MISSING $doc -> $f"; done; done`
Expected: no `MISSING` lines. Fix any that appear.

- [ ] **Step 3: Confirm no secrets in env docs**

Run: `grep -RnE '(SECRET|TOKEN|KEY|PASSWORD|DSN)\s*=\s*\S' docs/setup.md || echo "clean"`
Expected: `clean` (no assigned values).

- [ ] **Step 4: Report**

Summarize: files created, route count documented vs `find` count, screenshot count embedded, any drift found and fixed. Do NOT push or open a PR — await user permission.

---

## Self-Review

**Spec coverage:**

- README showcase (badges, demo, highlights, diagram, quick start, doc index) → Task 6 ✓
- architecture.md → Task 1 ✓
- api-reference.md (routes + MCP) → Task 2 ✓
- setup.md (env, scripts, Neon, tests) → Task 3 ✓
- tech-stack.md (rationale + deployment) → Task 4 ✓
- features.md (public + admin + screenshots) → Task 5 ✓
- Accuracy: verify methods from source → Task 2 Step 2 ✓; source from code → per-task reads ✓; reconcile counts → Tasks 1/2 verify steps ✓; no secrets → Tasks 3/7 ✓; diagram embedding → Tasks 1/4/6 ✓
- Branch note (README not guard-exempt) → Task 0 ✓

**Placeholder scan:** No TBD/TODO; each task names exact files, exact verification commands, and concrete section content.

**Type consistency:** Section anchors referenced by README (Task 6) match the anchors produced in Tasks 1–5. Route inventory source (`find src/app/api -name route.ts`) used consistently in Task 2 Steps 1/4 and Task 7 Step 2.

No gaps found.
