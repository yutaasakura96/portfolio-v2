# Project Documentation — Design Spec

**Date:** 2026-06-28
**Roadmap item:** §9 Tooling & DX → Documentation → "Comprehensive project documentation or Hero doc — folder structure, features, API reference, tech stack, setup guide" (`.claude/docs/feature-roadmap.md:160`)
**Status:** Approved, ready for plan

---

## Goal

Produce professional, detailed, accurate documentation for the portfolio-v2 project: a showcase
`README.md` at the repo root that links into a focused `docs/` set of five reference documents.
The README is the recruiter/collaborator-facing surface; the `docs/*.md` files carry the depth a
developer needs.

**Primary audiences (both):** recruiters/collaborators skimming the GitHub repo, AND developers
who clone and want to understand or run the project.

## Non-goals (YAGNI)

- No docs-site generator (Docusaurus / Nextra / VitePress). Plain Markdown only.
- No `CONTRIBUTING.md`, issue templates, or code-of-conduct.
- No auto-generated API docs from source (e.g. TypeDoc). Hand-written tables.
- No new diagrams — embed the existing ones in `docs/diagrams/`.
- Do not edit application code. Documentation only.

---

## Deliverables

```
README.md                  ← top-level showcase
docs/
  architecture.md          ← folder tree, public/admin split, data flow, ISR, proxy.ts, diagrams
  api-reference.md         ← all API routes + 43 MCP tools, grouped, with auth + rate-limit
  setup.md                 ← prerequisites, .env, Neon dev/prod, migrations, scripts, tests
  tech-stack.md            ← stack rationale (the "why") + Amplify/AWS deployment overview
  features.md              ← public + admin feature catalog, illustrated with screenshots
```

The README links to all five docs; each doc is single-purpose so it stays easy to keep accurate.

---

## README.md outline

1. **Hero block** — project name, one-line pitch, badge row (CI status, license, Next.js version,
   TypeScript, deploy/live), live demo link → `https://asakurayuta.dev`.
2. **Screenshot** — one hero shot of the public site from `docs/screenshots/public/`.
3. **Highlights ("why it's technically interesting")** — GLSL 3D hero blob (`@react-three/fiber`),
   DB-driven EN/JA i18n translated via Claude Haiku, 43-tool MCP content server, AI certificate
   extraction (Haiku vision), dual Neon branches (prod/dev), full admin CMS with import/export.
4. **Tech stack** — compact badge row / table.
5. **Architecture at a glance** — embedded `docs/diagrams/aws-architecture.png` + 2–3 sentence summary.
6. **Quick start** — concise clone → install → env → dev sequence; links to `docs/setup.md`. Framed
   honestly: a full run requires the author's own AWS/Neon/Cognito credentials.
7. **Documentation index** — links to the five `docs/*.md`.
8. **Project structure** — condensed top-level tree.
9. **License / contact.**

---

## The five docs

### architecture.md

- Annotated `src/` directory tree (3 levels) with one-line purpose per significant folder.
- Route-group split: `src/app/(public)` (ISR, Server Components) vs `src/app/(admin)/admin`
  (auth-guarded shell + login).
- Data layer: `src/lib/data/public-queries.ts`, the canonical types in `types.ts`, and the
  `withDbRetry` / `db-resilience.ts` ISR-safety pattern.
- Rendering model: ISR for public pages, the `proxy.ts` JWT guard (Next 16 middleware replacement).
- Dual-database model: production vs dev Neon branches.
- Embed `docs/diagrams/architecture.excalidraw` (exported) and the AWS diagram.

### api-reference.md

- Every `route.ts` under `src/app/api/`, grouped: Public / Admin-CMS / Auth / Import-Export /
  Translation / Health-misc.
- Columns per route: path, HTTP method(s), auth (`requireAuth` | `requireAuthOrApiKey` |
  `optionalAuth` | public), rate-limited (yes/no).
- Standard response envelope (`{ data }` / `{ data, meta }`) and error shape (`ApiError`).
- MCP server section: the 43 tools by domain (projects, experience, education, skills,
  certifications, messages, blog, content, dashboard), noting the no-delete-on-messages boundary.

### setup.md

- Prerequisites: Node, a Neon Postgres project, AWS account (S3/CloudFront/SES/Cognito), optional
  Upstash + Sentry + Anthropic keys.
- Full environment-variable reference: **variable NAMES + purpose only, never values**, grouped by
  concern (database, AWS, Cognito, SES, Upstash, Sentry, Anthropic, analytics, MCP, Neon mgmt).
- Local setup steps: clone, `npm install`, `.env`, `prisma migrate dev`, `npm run dev`.
- Neon dev-vs-prod branch workflow + `db:reset-dev`.
- All npm scripts table.
- Running tests (Vitest) and the `/check` quality gate.

### tech-stack.md

- Each major choice with the _why_: Next.js 16 App Router, React 19, Prisma 7 + `PrismaNeon`
  WebSocket adapter (and why not the HTTP adapter), Tailwind v4, shadcn, TanStack Query,
  Cognito + jose, Sentry, `three@^0.182` pin rationale, Sharp/WebP image pipeline.
- Deployment: Amplify Hosting Gen 1 build pipeline (preBuild/build/postBuild from `amplify.yml`)
  and AWS topology (S3 + CloudFront + SES + Cognito + Neon).

### features.md

- Public features: hero + 3D blob, projects (grid + detail + gallery), blog (markdown, TOC, reading
  time, social share), about (experience/education/skills/certifications), contact form, EN/JA
  toggle, dark mode, SEO (JSON-LD, OG images, sitemap).
- Admin features: dashboard (8 widgets), per-entity managers, drag-reorder, markdown editors,
  unified import/export, translations page, AI certificate extraction.
- Illustrated with screenshots from `docs/screenshots/{public,admin}/`.

---

## Accuracy requirements

1. **Verify API methods from source.** The exploratory scan reported some verbs loosely (reorder /
   export / import showing as `GET`). When writing `api-reference.md`, read each `route.ts` to
   confirm the real exported methods and response shapes. Wrong docs are worse than none.
2. **Source from code, not the roadmap.** Pull every fact from actual files
   (`schema.prisma`, route files, `package.json`, `amplify.yml`, `.env.example`,
   `.claude/docs/infrastructure.md`), so docs reflect reality, not aspirations.
3. **Reconcile model/route counts** against `prisma/schema.prisma` and a fresh glob of
   `src/app/api/**/route.ts` rather than trusting a single scan.
4. **No secrets.** Environment docs list variable names and purposes only — never values.
5. **Diagram embedding.** Use the existing PNG (`docs/diagrams/aws-architecture.png`). For the
   `.excalidraw` app diagram, embed an exported image if one exists; otherwise link the file.

---

## Branch / workflow note

The deliverables include `README.md` at the repo root, which is **not** under the `docs/**`
guard-exemption. Implementation must therefore happen on a feature branch / worktree, not directly
on `develop`. The `docs/*.md` files and this spec are guard-exempt.

---

## Verification

- All internal links resolve (README → docs, docs → diagrams/screenshots).
- Markdown renders cleanly (lint / preview).
- Spot-check 5+ API rows against their `route.ts` for correct method + auth.
- Env-var list contains no values.
- `npm run lint` (Prettier) leaves the Markdown unchanged or formats it consistently.
