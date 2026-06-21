# Portfolio v2 — Architecture Audit Summary

Full codebase audit conducted 2026-06-15 via 8-agent parallel workflow (~623K tokens). This document captures the findings for use in documentation, wiki authoring, and diagram updates.

---

## Tech Stack

| Layer          | Technology                        | Version / Notes                                                                   |
| -------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| Framework      | Next.js (App Router)              | ^16.2.2, `proxy.ts` replaces middleware                                           |
| Language       | TypeScript                        | Strict mode, no `any`                                                             |
| React          | React 19                          | 19.2.3                                                                            |
| Database       | Prisma 7 + Neon Postgres          | PrismaNeon WebSocket adapter, `@prisma/adapter-neon`                              |
| Styling        | TailwindCSS 4                     | `@tailwindcss/postcss`, shadcn/ui (Radix primitives), CVA + clsx + tailwind-merge |
| Forms          | react-hook-form + Zod 4           | `@hookform/resolvers/zod`                                                         |
| Server State   | TanStack React Query 5            | No Zustand                                                                        |
| Auth           | AWS Cognito                       | OAuth code flow, Hosted UI, jose JWT verification, HTTP-only cookies              |
| Hosting        | AWS Amplify Gen 1 (SSR)           | Auto-deploy from GitHub                                                           |
| CDN            | AWS CloudFront                    | 2 distributions (assets + S3 origin)                                              |
| Storage        | AWS S3                            | Images by folder prefix, immutable 1yr cache headers                              |
| Email          | AWS SES                           | Contact form email notifications                                                  |
| Images         | Sharp                             | 4 size variants → WebP, served via CloudFront                                     |
| 3D / WebGL     | @react-three/fiber + drei + three | ^0.182.0 (pinned, Clock deprecation)                                              |
| Markdown       | remark + rehype                   | GFM, sanitize, slug, highlight                                                    |
| Rate Limiting  | Upstash Redis                     | @upstash/ratelimit, 7+ route groups                                               |
| Error Tracking | Sentry                            | ^10.56.0, 3-tier (client/server/edge), 10% trace sampling in prod                 |
| AI             | Anthropic Claude Haiku            | Translation + certification extraction, prompt caching enabled                    |
| Import/Export  | papaparse (CSV) + unified JSON    | entityConfigs, IMPORT_ORDER dependency ordering                                   |
| Icons          | lucide-react                      |                                                                                   |
| Fonts          | Geist                             |                                                                                   |
| Toasts         | Sonner                            |                                                                                   |
| Testing        | Vitest 4 + Testing Library        | @vitest/coverage-v8, 224+ tests across 11 files                                   |

---

## Folder Structure

```
portfolio-v2/
├── .claude/                    # Claude Code configuration
│   ├── agents/                 # 3 agent definitions (db, maintenance, code-reviewer)
│   ├── commands/               # Slash commands (check, new-route, pr-ready)
│   ├── docs/                   # Internal docs (infrastructure, feature-roadmap, feature-workflow)
│   ├── hooks/                  # Git hooks (pre-commit-gate, pre-edit-branch-guard, post-edit-format, post-commit-doc-reminder)
│   ├── plugins/                # context-mode, frontend-design
│   ├── rules/                  # Pattern-matched rules (api-routes, components, data-layer, prisma-schema, tests, validations)
│   ├── skills/                 # excalidraw-diagram, aws-architecture-diagram
│   └── settings.json           # Permission + hook configuration
├── .codex/                     # Codex backup agents (mirrors .claude/ for OpenAI models)
│   ├── agents/                 # 4 agents (gpt-5.4 / gpt-5.4-mini)
│   └── hooks.json
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint, type-check, build, test on PR to main/develop
│       ├── codeql.yml          # Static security analysis (weekly + PRs to main)
│       └── neon-reset-dev.yml  # Weekly dev branch restore from production
├── docs/
│   ├── diagrams/               # architecture.excalidraw, aws-architecture.drawio, agentic-workflow.excalidraw
│   └── screenshots/            # Playwright-captured PNGs (25 public + 17 admin pages)
├── mcp/
│   └── portfolio-server/       # 43-tool MCP server (stdio transport, dev + prod instances)
├── prisma/
│   ├── schema.prisma           # 15 models, 3 enums
│   ├── migrations/             # SQL migration history
│   └── seed.ts                 # Sample data (upsert-based, idempotent)
├── public/                     # Static assets
├── scripts/                    # neon-reset-dev.sh, mcp-setup.ts
├── src/
│   ├── app/
│   │   ├── (public)/           # Public site pages (ISR, Server Components)
│   │   │   ├── about/
│   │   │   ├── blog/
│   │   │   ├── contact/
│   │   │   └── projects/
│   │   ├── (admin)/admin/      # Admin CMS (auth-guarded shell)
│   │   ├── api/                # 61 API route files (see API Reference below)
│   │   ├── layout.tsx          # Root layout (providers, fonts, Sentry)
│   │   └── globals.css         # Theme tokens, TailwindCSS 4 @theme block
│   ├── components/
│   │   ├── admin/              # 28 admin components (forms, dashboard, tables)
│   │   ├── public/             # 25 public components (Server + Client)
│   │   ├── shared/             # Cross-layout components (ThemeToggle, LanguageToggle)
│   │   ├── providers/          # QueryProvider, ThemeProvider, LocaleProvider
│   │   └── ui/                 # shadcn primitives (do not hand-edit)
│   ├── hooks/                  # 10 custom hooks
│   ├── lib/
│   │   ├── aws/                # S3, SES, Cognito clients
│   │   ├── data/               # public-queries.ts (22 functions), types.ts (canonical)
│   │   ├── import-export/      # entity-configs, csv-utils, unified-import, validation-helpers
│   │   ├── validations/        # 12 Zod schema files (one per entity)
│   │   ├── utils/              # cn(), general utilities
│   │   ├── api-client.ts       # Singleton fetch wrapper with auto-401 refresh
│   │   ├── errors.ts           # ApiError + withErrorHandler
│   │   ├── i18n.ts             # t(), tArray(), tJson(), ui(), UI_STRINGS, localizeSkillCategory()
│   │   ├── locale.ts           # Locale type ("en" | "ja"), DEFAULT_LOCALE, LOCALES
│   │   ├── markdown.ts         # markdownToHtml(), extractHeadings()
│   │   ├── prisma-client.ts    # Singleton Prisma client (Neon WebSocket)
│   │   └── rate-limit.ts       # Upstash rate limiter factory
│   └── test/                   # Test setup, factories
├── amplify.yml                 # Amplify build config (.env.production generation, prisma migrate deploy)
├── CLAUDE.md                   # Primary project instructions
├── AGENTS.md                   # Codex backup mirror of CLAUDE.md
├── next.config.ts              # Sentry wrapper, serverExternalPackages, image remotePatterns
├── proxy.ts                    # JWT guard for /admin routes (Next.js 16 middleware replacement)
└── vitest.config.ts            # Vitest 4 config (jsdom, path aliases, coverage)
```

---

## Database Schema

15 models, 3 enums. All IDs are CUID strings. All non-singleton models have `createdAt`/`updatedAt`.

### Models

| Model              | Purpose                  | Key Fields                                                                                              | Notes                                                           |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Hero**           | Singleton hero section   | title, subtitle, ctaText, ctaLink, `*Ja` variants                                                       | One row                                                         |
| **Project**        | Portfolio projects       | slug, title, description, techTags[], thumbnailUrl, galleryUrls[], status, displayOrder, `*Ja` variants | `ProjectStatus` enum (DRAFT/PUBLISHED)                          |
| **BlogPost**       | Blog articles            | slug, title, content (@db.Text), excerpt, coverImageUrl, status, publishedAt, `*Ja` variants            | `PostStatus` enum (DRAFT/PUBLISHED)                             |
| **SkillCategory**  | Skill grouping           | name, displayOrder                                                                                      | Parent of Skill (1:N)                                           |
| **Skill**          | Individual skills        | name, proficiency, categoryId, displayOrder                                                             | `ProficiencyLevel` enum (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT) |
| **Experience**     | Work history             | company, role, startDate, endDate, description, techTags[], displayOrder, `*Ja` variants                | Nullable endDate = current                                      |
| **Education**      | Academic history         | institution, degree, field, startDate, endDate, displayOrder, `*Ja` variants                            |                                                                 |
| **Certification**  | Professional certs       | name, issuer, issueDate, expiryDate, credentialUrl, displayOrder                                        |                                                                 |
| **ContactMessage** | Contact form submissions | name, email, subject, message, isRead, isArchived                                                       | No delete — read/archive only                                   |
| **AboutPage**      | Singleton about content  | bio, profileImageUrl, resumeUrl, `*Ja` variants                                                         | One row                                                         |
| **SiteSettings**   | Singleton site config    | siteName, siteDescription, socialLinks (JSON), `*Ja` variants                                           | One row                                                         |
| **ApiKey**         | MCP/API authentication   | key (hashed), name, lastUsedAt                                                                          | Bearer token auth for API routes                                |

### Enums

- `ProjectStatus`: DRAFT, PUBLISHED
- `PostStatus`: DRAFT, PUBLISHED
- `ProficiencyLevel`: BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

### i18n Convention

Bilingual fields use nullable `*Ja` columns (e.g., `titleJa`, `descriptionJa`). The `t()` helper falls back to the EN value when JA is null. Skills and Certifications stay English (technical terms).

---

## API Reference

61 route files across 17 entity groups. All wrapped in `withErrorHandler`. Response shape: `{ data: T }` or `{ data: T[], meta: { total, page, limit, totalPages } }`.

### Auth Routes (`/api/auth/`)

| Method | Path                 | Auth     | Purpose                                                                    |
| ------ | -------------------- | -------- | -------------------------------------------------------------------------- |
| GET    | `/api/auth/callback` | None     | Cognito OAuth callback — exchanges code for tokens, sets HTTP-only cookies |
| GET    | `/api/auth/me`       | Optional | Returns current user from JWT                                              |
| POST   | `/api/auth/refresh`  | None     | Refreshes access token via Cognito                                         |
| POST   | `/api/auth/signout`  | None     | Clears auth cookies                                                        |

### Entity CRUD Routes

Each entity follows the same pattern. Auth = `requireAuthOrApiKey` (admin browser + MCP API key).

| Entity           | List/Create             | Get/Update/Delete          | Export                       | Import                       | Reorder                         |
| ---------------- | ----------------------- | -------------------------- | ---------------------------- | ---------------------------- | ------------------------------- |
| Projects         | `/api/projects`         | `/api/projects/[id]`       | `/api/projects/export`       | `/api/projects/import`       | `/api/projects/reorder`         |
| Blog             | `/api/blog`             | `/api/blog/[id]`           | `/api/blog/export`           | `/api/blog/import`           | —                               |
| Skills           | `/api/skills`           | `/api/skills/[id]`         | `/api/skills/export`         | `/api/skills/import`         | `/api/skills/reorder`           |
| Skill Categories | `/api/skill-categories` | —                          | —                            | —                            | `/api/skill-categories/reorder` |
| Experience       | `/api/experience`       | `/api/experience/[id]`     | `/api/experience/export`     | `/api/experience/import`     | `/api/experience/reorder`       |
| Education        | `/api/education`        | `/api/education/[id]`      | `/api/education/export`      | `/api/education/import`      | `/api/education/reorder`        |
| Certifications   | `/api/certifications`   | `/api/certifications/[id]` | `/api/certifications/export` | `/api/certifications/import` | `/api/certifications/reorder`   |
| Messages         | `/api/messages`         | `/api/messages/[id]`       | `/api/messages/export`       | —                            | —                               |

### Singleton Routes

| Entity   | Path            | Methods                  |
| -------- | --------------- | ------------------------ |
| Hero     | `/api/hero`     | GET, PUT + export/import |
| About    | `/api/about`    | GET, PUT + export/import |
| Settings | `/api/settings` | GET, PUT + export/import |

### Special Routes

| Method   | Path                                | Auth                | Purpose                                                              |
| -------- | ----------------------------------- | ------------------- | -------------------------------------------------------------------- |
| POST     | `/api/contact`                      | None (rate-limited) | Public contact form submission                                       |
| POST     | `/api/upload`                       | Required            | Image upload (7 folder paths), Sharp → WebP processing               |
| GET      | `/api/resume/download`              | None                | Proxies resume PDF from S3 with Content-Disposition                  |
| GET      | `/api/health`                       | None                | Health check                                                         |
| GET      | `/api/admin/dashboard-stats`        | Required            | Aggregate counts for admin dashboard                                 |
| GET      | `/api/admin/dashboard-external`     | Required            | Sentry issues, Amplify build status, site health, GA config          |
| GET/POST | `/api/admin/translate`              | Required            | GET = translation plan, POST = translate one entity via Claude Haiku |
| POST     | `/api/admin/certifications/extract` | Required            | Extract cert info from image via Claude Haiku                        |
| GET/POST | `/api/admin/api-keys`               | Required            | API key management                                                   |
| DELETE   | `/api/admin/api-keys/[id]`          | Required            | Delete API key                                                       |
| GET/POST | `/api/admin/export/unified`         | Required            | Full-site JSON backup                                                |
| POST     | `/api/admin/import/unified`         | Required            | Full-site JSON restore (IMPORT_ORDER dependency ordering)            |
| PUT      | `/api/messages/bulk`                | Required            | Bulk mark-read/archive messages                                      |

---

## Subsystem Details

### 1. Request Flow and Auth

```
Browser → proxy.ts (JWT guard for /admin/*) → Next.js App Router
  ├── (public)/ → Server Components (ISR) → public-queries.ts → Prisma → Neon
  └── (admin)/admin/ → Client Components → apiClient → API routes → Prisma → Neon
```

- `proxy.ts`: Next.js 16 middleware replacement. Checks `access_token` cookie against Cognito JWKS. Bypasses: `/admin/login`, `/api/auth/*`, static assets.
- Auth functions (`src/app/api/auth.ts`): `requireAuth` (browser-only), `requireAuthOrApiKey` (browser + API key), `optionalAuth` (conditional).
- API key auth: `ApiKey` model, hashed keys, Bearer token in Authorization header.

### 2. i18n System

- 2 locales: EN (default), JA
- DB-driven: nullable `*Ja` columns on content models
- `LocaleProvider`: React Context + `localStorage` persistence (mirrors next-themes pattern)
- `useLocale` hook: `useSyncExternalStore` for hydration safety
- Helpers: `t()` (strings), `tArray()` (string arrays), `tJson()` (JSON), `ui()` (static UI via `UI_STRINGS`)
- Translation API: Claude Haiku with prompt caching (`cache_control: {type: "ephemeral"}`), plan-based item-by-item workflow
- Admin UI: `/admin/translations` page with "Update Japanese" button + progress
- `LocalizedContent` components: `LocalizedText`, `LocalizedHtml`, `LocalizedUi` — client components receiving both EN+JA from Server Component props

### 3. Image Pipeline

```
Upload Route → Sharp (4 variants: thumb 400x300, med 800x600, lg 1600x1200, original) → WebP
  → S3 (PutObject, CacheControl immutable 1yr) → CloudFront CDN → next/image
```

- 7 folder prefixes: `projects/`, `blog/`, `profile/`, `logos/`, `certifications/`, `resume/`, `education/`
- MIME validation: `image/jpeg`, `image/png`, `image/webp` only
- All public image URLs use `NEXT_PUBLIC_CLOUDFRONT_URL`

### 4. External Services

| Service          | Connection                                 | Purpose                                   |
| ---------------- | ------------------------------------------ | ----------------------------------------- |
| AWS Cognito      | OAuth 2.0 code flow, JWKS JWT verification | Admin authentication                      |
| Neon Postgres    | PrismaNeon WebSocket adapter               | All data storage (2 branches: dev + prod) |
| AWS S3           | @aws-sdk/client-s3                         | Asset storage (images, PDFs)              |
| AWS CloudFront   | Origin pull from S3 + Amplify              | CDN for static assets + SSR               |
| AWS SES          | @aws-sdk/client-ses                        | Contact form email notifications          |
| Upstash Redis    | @upstash/ratelimit                         | Rate limiting (7+ route groups)           |
| Sentry           | @sentry/nextjs (3-tier)                    | Error tracking + performance monitoring   |
| Anthropic API    | Claude Haiku                               | Translation + certification extraction    |
| Google Analytics | GA4 (client-side)                          | Page analytics                            |
| AWS Amplify      | Hosting Gen 1 SSR                          | Build + deploy + runtime                  |

### 5. Observability

- **Sentry**: 3 config files (client, server, edge) + `instrumentation.ts` hook
  - Production: 10% trace sampling, `removeDebugLogging` via webpack treeshake
  - Dev: 100% sampling
  - Source maps uploaded at build via `SENTRY_AUTH_TOKEN`
- **Admin dashboard**: External services panel fetches Sentry issues, Amplify build status, site health, GA config in parallel

### 6. CI/CD Pipeline

| Workflow             | Trigger                             | Steps                                                                                    |
| -------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `ci.yml`             | Push/PR to main/develop             | npm ci → lint (ESLint+Prettier) → type-check → next build → 220MB size guard → vitest    |
| `codeql.yml`         | PRs to main + weekly (Mon 4:30 UTC) | Static security analysis (JavaScript/TypeScript)                                         |
| `neon-reset-dev.yml` | Weekly (Mon 6:00 UTC) + manual      | Restore dev Neon branch from production via Neon REST API                                |
| `amplify.yml`        | GitHub push (auto-deploy)           | Generate .env.production → npm ci → prisma generate → prisma migrate deploy → next build |

### 7. Import/Export System

- **Per-entity**: CSV (papaparse) + JSON export/import routes
- **Unified**: Full-site backup (`/api/admin/export/unified`) and restore (`/api/admin/import/unified`)
- **IMPORT_ORDER**: `hero → about → settings → skills → experience → education → certifications → projects → blog` (dependency ordering)
- **entityConfigs** (`src/lib/import-export/entity-configs.ts`): Maps each entity to its Zod schema, Prisma model, unique key, and import/export behavior
- **Admin UI**: `<ImportExportToolbar>` component bundles export buttons + import dialog per entity page

### 8. HeroBlob (WebGL)

- `@react-three/fiber` Canvas with custom GLSL vertex shader (simplex noise + mouse interaction)
- `WebGLErrorBoundary`: Class component catches WebGL init failures on old browsers (Mobile Safari 13)
- `IntersectionObserver` toggles `frameloop` between "always" and "never" for performance
- `three` pinned to `^0.182.0` — r183 deprecated `THREE.Clock` but r3f v9.6.1 still uses it
- Shader uniforms declared as module-level constants (React Compiler ESLint compatibility)

---

## Custom Hooks

| Hook                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `useAuth`                 | Cognito OAuth session, login/logout, token refresh             |
| `useLocale`               | Read/set locale from LocaleProvider (useSyncExternalStore)     |
| `useDashboardStats`       | TanStack Query for `/api/admin/dashboard-stats`                |
| `useDashboardExternal`    | TanStack Query for `/api/admin/dashboard-external`             |
| `useMessages`             | TanStack Query for messages list + mark-read/archive mutations |
| `useSettings`             | TanStack Query for site settings CRUD                          |
| `useReveal`               | IntersectionObserver-based scroll reveal animation             |
| `useDndReorder`           | @dnd-kit drag-and-drop with optimistic reorder + API sync      |
| `useBlogPostFormMutation` | TanStack mutation for blog post create/update                  |
| `useProjectFormMutation`  | TanStack mutation for project create/update                    |

---

## Agentic Workflow

> **Updated 2026-06-21:** The project adopted **superpowers** as the primary workflow methodology. The two-tier routing model described in the original 2026-06-15 audit was replaced by the superpowers spine, and `feature-builder` was retired. See [CLAUDE.md](../CLAUDE.md) §Development Workflow for the current authoritative description. The summary below reflects the post-adoption structure.

Primary methodology is the **superpowers** plugin (skills only — no agents/commands). Workflow spine: `brainstorming → using-git-worktrees → writing-plans → subagent-driven-development`/`executing-plans → test-driven-development → systematic-debugging → verification-before-completion → requesting-code-review → finishing-a-development-branch`. It dispatches fresh generic subagents per plan task; the project's three executor agents + skills + `.claude/rules/` supply domain context.

### Direct (no full spine)

Single-file edits, typo fixes, quick lookups. Uses built-in `Explore` subagent (haiku) for search.

### Domain-executor agents (dispatched within the spine)

| Agent             | Default Model | Codex Model           | Max Turns | Purpose                                  |
| ----------------- | ------------- | --------------------- | --------- | ---------------------------------------- |
| db-agent          | sonnet        | gpt-5.4 (high)        | 15        | Schema, migrations, seed, Neon branching |
| maintenance-agent | sonnet        | gpt-5.4 (high)        | 20        | Refactoring or doc sync                  |
| code-reviewer     | haiku         | gpt-5.4-mini (medium) | 15        | Read-only review + integration checks    |

### MCP Servers

| Server         | Transport | Target                 | Purpose                                           |
| -------------- | --------- | ---------------------- | ------------------------------------------------- |
| portfolio      | stdio     | localhost:3000 (dev)   | 43-tool content management                        |
| portfolio-prod | stdio     | asakurayuta.dev (prod) | Same 43 tools, production data                    |
| context7       | —         | —                      | Live docs for Next.js 16, Prisma 7, TailwindCSS 4 |
| aws-docs       | —         | —                      | AWS service documentation                         |
| aws-api        | —         | —                      | AWS API access for deploy verification            |
| prisma-local   | —         | —                      | Migration status, schema management               |
| playwright     | —         | —                      | Headless browser verification                     |
| github         | —         | —                      | PR/issue management, code search                  |
| sentry         | HTTP      | mcp.sentry.dev         | Query Sentry errors and issues                    |

---

## Architecture Diagrams

| Diagram             | Format      | Location                                    | Content                                                                                                                             |
| ------------------- | ----------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| System Architecture | .excalidraw | `docs/diagrams/architecture.excalidraw`     | 8-section, 144-element diagram covering request flow, auth, i18n, image pipeline, external services, CI/CD, import/export, HeroBlob |
| AWS Infrastructure  | .drawio     | `docs/diagrams/aws-architecture.drawio`     | AWS Cloud topology (CloudFront, WAF, Amplify, Cognito, S3, SES) + external services (Neon, Upstash, Sentry, Anthropic, GA)          |
| Agentic Workflow    | .excalidraw | `docs/diagrams/agentic-workflow.excalidraw` | Two-tier agent routing (Tier 1 direct, Tier 2 single/multi-domain), 4 agents, context-mode integration                              |

---

## Test Coverage

224+ tests across 11 files:

| File                                               | Tests                                                 | Covers                             |
| -------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- |
| `src/lib/errors.test.ts`                           | withErrorHandler, ApiError                            | Error handling wrapper             |
| `src/app/api/auth.test.ts`                         | requireAuth, optionalAuth, requireAuthOrApiKey        | Auth middleware                    |
| `src/lib/validations/contact.test.ts`              | Contact form schema                                   | Input validation                   |
| `src/lib/validations/project.test.ts`              | Project schemas                                       | Input validation                   |
| `src/lib/validations/blog.test.ts`                 | Blog schemas                                          | Input validation                   |
| `src/lib/i18n.test.ts`                             | t, tArray, tJson, ui, localizeSkillCategory           | i18n helpers                       |
| `src/lib/markdown.test.ts`                         | extractHeadings, markdownToHtml                       | Markdown pipeline                  |
| `src/lib/import-export/csv-utils.test.ts`          | flattenForCsv, unflattenFromCsv                       | CSV utilities                      |
| `src/app/api/contact/route.test.ts`                | Contact POST                                          | Public contact route               |
| `src/app/api/upload/route.test.ts`                 | Upload POST/DELETE                                    | Image upload (7 paths, MIME, size) |
| `src/proxy.test.ts`                                | JWT guard, bypass routes, redirect encoding           | Middleware proxy                   |
| `src/lib/import-export/validation-helpers.test.ts` | stripInternalFields, validateRows, getExportFilename  | Import helpers                     |
| `src/lib/import-export/unified-import.test.ts`     | IMPORT_ORDER, schema, validateUnifiedImport           | Unified import                     |
| `src/components/public/ContactForm.test.tsx`       | Field rendering, validation, submission, error states | Contact form UI                    |
| `src/app/api/admin/export/unified/route.test.ts`   | Unified export                                        | Full-site backup                   |
| `src/app/api/admin/import/unified/route.test.ts`   | Unified import                                        | Full-site restore                  |

---

## Environment Variables

### Required (all environments)

| Variable                     | Purpose                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `DATABASE_URL`               | Neon Postgres connection string (dev branch locally, prod branch in Amplify) |
| `APP_AWS_REGION`             | AWS region (Amplify reserves `AWS_*` namespace)                              |
| `APP_AWS_ACCESS_KEY_ID`      | AWS credentials for S3/SES/Cognito                                           |
| `APP_AWS_SECRET_ACCESS_KEY`  | AWS credentials                                                              |
| `APP_AWS_S3_BUCKET`          | S3 bucket name                                                               |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | CloudFront domain for public image URLs                                      |
| `COGNITO_CLIENT_ID`          | Cognito app client ID                                                        |
| `COGNITO_CLIENT_SECRET`      | Cognito app client secret                                                    |
| `COGNITO_DOMAIN`             | Cognito Hosted UI domain                                                     |
| `COGNITO_REDIRECT_URI`       | OAuth callback URL                                                           |
| `COGNITO_JWKS_URL`           | JWKS endpoint for JWT verification                                           |
| `JWT_SECRET`                 | JWT signing secret                                                           |
| `UPSTASH_REDIS_REST_URL`     | Upstash Redis endpoint                                                       |
| `UPSTASH_REDIS_REST_TOKEN`   | Upstash Redis auth token                                                     |
| `SES_FROM_EMAIL`             | SES verified sender email                                                    |
| `CONTACT_EMAIL`              | Contact form notification recipient                                          |
| `NEXT_PUBLIC_SENTRY_DSN`     | Sentry DSN (client + server)                                                 |
| `SENTRY_AUTH_TOKEN`          | Sentry auth (build-time source map upload)                                   |
| `ANTHROPIC_API_KEY`          | Claude Haiku for translation/extraction                                      |

### Optional (admin dashboard external services)

| Variable              | Purpose                    |
| --------------------- | -------------------------- |
| `SENTRY_ORG_SLUG`     | Sentry issues panel        |
| `SENTRY_PROJECT_SLUG` | Sentry issues panel        |
| `AMPLIFY_APP_ID`      | Amplify build-status card  |
| `GA_PROPERTY_ID`      | Google Analytics link card |

---

## Key Design Decisions

1. **PrismaNeon WebSocket over HTTP adapter** — HTTP adapter caused `NeonDbError: fetch failed` and `AbortError` on Lambda cold starts. WebSocket is proven stable.
2. **proxy.ts over Next.js middleware** — Next.js 16 middleware replacement pattern for JWT guard.
3. **No Zustand** — removed from project. Local state = useState/useReducer, server state = TanStack Query.
4. **DB-driven i18n over file-based** — only 2 locales, content changes frequently, admin needs to edit translations. Nullable `*Ja` columns avoid join tables.
5. **Unified import/export with dependency ordering** — `IMPORT_ORDER` ensures referential integrity during restore.
6. **three.js ^0.182.0 pin** — r183 deprecated `THREE.Clock` but r3f v9.6.1 still uses it internally. Upgrade only when r3f ships Timer-based update.
7. **Module-level shader uniforms** — React Compiler ESLint rules flag useMemo/useRef/useState on WebGL uniforms. Module-level constants avoid the issue.
8. **HTTP-only cookies for auth** — tokens never touch localStorage. Secure, SameSite=Lax.
9. **serverExternalPackages for Neon** — `@neondatabase/serverless` and `@prisma/adapter-neon` must not be bundled into Lambda (fetch polyfill conflicts).
10. **Fire-and-forget SES** — contact form email failure is logged but doesn't fail the HTTP response.
