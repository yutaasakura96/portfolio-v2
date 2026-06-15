# Portfolio v2

Personal portfolio + admin CMS. Public-facing Next.js site backed by an admin dashboard, deployed to AWS Amplify with Neon Postgres.

## Tech Stack

- **Framework:** Next.js (App Router, `proxy.ts` middleware), React, TypeScript (strict) — see @package.json for exact versions
- **Database:** Prisma + Neon Postgres via `@prisma/adapter-neon` + `@neondatabase/serverless`. **Two Neon branches with separate data:** `production` (`ep-wandering-butterfly`) used by Amplify/production, and `dev` (`ep-royal-resonance`) used by `localhost:3000`. Content changes made via localhost or the MCP server only affect the dev database, not production.
- **Styling:** TailwindCSS 4 + `@tailwindcss/postcss`, shadcn (Radix UI primitives), CVA + clsx + `tailwind-merge`
- **Forms:** react-hook-form + `@hookform/resolvers` + Zod 4
- **Server state:** TanStack React Query 5 (no Zustand — do not add)
- **Auth:** AWS Cognito (Hosted UI, OAuth code flow) + jose for JWT verification, HTTP-only cookies
- **AWS runtime:** Amplify Hosting Gen 1 (SSR), S3 (images), CloudFront (assets CDN), SES (email), `@aws-sdk/client-amplify` (dashboard build-status polling, dynamically imported)
- **Images:** Sharp → WebP, served via CloudFront
- **3D / WebGL:** `@react-three/fiber` + `@react-three/drei` + `three` — `HeroBlob.tsx` renders a morphing GLSL shader blob in the hero section with mouse interaction. `three` is pinned to `^0.182.0` (not `^0.184.x`) because r183 deprecated `THREE.Clock` but r3f v9.6.1 still uses it internally — upgrade only when r3f ships a Timer-based update. `HeroBlob` wraps the `Canvas` in a `WebGLErrorBoundary` class component to silently catch WebGL initialization failures on old browsers (Mobile Safari 13 / iOS 13) instead of crashing the page.
- **Markdown:** remark + rehype (`remark-gfm`, `rehype-sanitize`, `rehype-slug`, `rehype-highlight`)
- **Import/Export:** papaparse (CSV), unified JSON export/import (`/api/admin/export/unified`, `/api/admin/import/unified`) for full-site backup/restore
- **i18n:** DB-driven bilingual support (EN + JA). `src/lib/locale.ts` defines `Locale = "en" | "ja"`. `src/lib/i18n.ts` exports `t()`, `tArray()`, `tJson()`, `ui()` (via `UI_STRINGS`), and `localizeSkillCategory()`. `LocaleProvider` (`src/components/providers/LocaleProvider.tsx`) persists locale to `localStorage`. `LanguageToggle` in `src/components/shared/LanguageToggle.tsx`. Translation API at `GET/POST /api/admin/translate` uses Claude Haiku with a plan-based, item-by-item workflow to stay under Amplify SSR timeouts. Admin UI at `/admin/translations`. Only 2 locales — do not add more without discussion.
- **Toasts:** Sonner. **Icons:** lucide-react. **Fonts:** Geist.
- **Error tracking:** `@sentry/nextjs` `^10.56.0` — three config files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) + `instrumentation.ts` (Next.js hook; exports `onRequestError = Sentry.captureRequestError`). `next.config.ts` is wrapped with `withSentryConfig`. DSN read from `NEXT_PUBLIC_SENTRY_DSN`; source-map uploads use `SENTRY_AUTH_TOKEN` (build-time only). The deprecated `disableLogger: true` option is replaced by `webpack: { treeshake: { removeDebugLogging: true } }` in `withSentryConfig`.

## Commands

All scripts are in @package.json. Key commands: `npm run dev`, `npm run build`, `npm run lint`, `npm run type-check`, `npm test`, `npm run prisma:generate`, `npm run prisma:migrate:dev`, `npm run db:reset-dev`.

Tests use **Vitest** with **@testing-library/react**. See [.claude/rules/tests.md](.claude/rules/tests.md) for conventions.

## Architecture

| Path                                                                                                         | Purpose                                                                                                               |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| [src/app/(public)/](<src/app/(public)/>)                                                                     | Public site (ISR, Server Components by default)                                                                       |
| [src/app/(admin)/admin/](<src/app/(admin)/admin/>)                                                           | Admin CMS — login + auth-guarded shell                                                                                |
| [src/app/api/auth.ts](src/app/api/auth.ts)                                                                   | `requireAuth`, `requireAuthOrApiKey`, `optionalAuth` (NOT `src/lib/auth`)                                             |
| [src/proxy.ts](src/proxy.ts)                                                                                 | Next.js 16 middleware replacement — JWT guard for admin routes                                                        |
| [src/components/shared/](src/components/shared/)                                                             | Components shared across public + admin (e.g. `ThemeToggle`)                                                          |
| [src/components/ui/](src/components/ui/)                                                                     | shadcn primitives (use `npx shadcn add`, don't hand-edit)                                                             |
| [src/lib/data/](src/lib/data/)                                                                               | Server-side query layer + canonical types                                                                             |
| [src/lib/validations/](src/lib/validations/)                                                                 | Zod schemas (one file per entity)                                                                                     |
| [src/lib/errors.ts](src/lib/errors.ts)                                                                       | `ApiError` + `withErrorHandler`                                                                                       |
| [src/lib/prisma-client.ts](src/lib/prisma-client.ts)                                                         | Singleton Prisma client (Neon WebSocket adapter)                                                                      |
| [src/lib/locale.ts](src/lib/locale.ts)                                                                       | `Locale` type (`"en" \| "ja"`) + locale helpers                                                                       |
| [src/lib/i18n.ts](src/lib/i18n.ts)                                                                           | `t()`, `tArray()`, `tJson()`, `ui()`, `UI_STRINGS`, `localizeSkillCategory()`                                         |
| [src/hooks/use-locale.ts](src/hooks/use-locale.ts)                                                           | `useLocale()` hook — reads/sets locale from `LocaleProvider`                                                          |
| [src/components/providers/LocaleProvider.tsx](src/components/providers/LocaleProvider.tsx)                   | Locale React Context with `localStorage` persistence                                                                  |
| [src/components/shared/LanguageToggle.tsx](src/components/shared/LanguageToggle.tsx)                         | EN/JA toggle button (rendered in public `Header`)                                                                     |
| [src/components/public/LocalizedContent.tsx](src/components/public/LocalizedContent.tsx)                     | `LocalizedText`, `LocalizedHtml`, `LocalizedUi` client components                                                     |
| [src/app/api/admin/translate/route.ts](src/app/api/admin/translate/route.ts)                                 | GET plan + POST target — translates content to Japanese via Claude Haiku (prompt caching enabled)                     |
| [src/app/(admin)/admin/(shell)/translations/](<src/app/(admin)/admin/(shell)/translations/>)                 | Admin translations page ("Update Japanese" button + progress)                                                         |
| [src/app/api/admin/dashboard-external/route.ts](src/app/api/admin/dashboard-external/route.ts)               | Parallel-fetches Sentry issues, Amplify build status, site health, GA config; degrades gracefully on missing env vars |
| [src/components/admin/dashboard/ExternalServices.tsx](src/components/admin/dashboard/ExternalServices.tsx)   | 4 service cards (Sentry, Amplify, Site Health, GA) on the admin dashboard                                             |
| [src/components/admin/dashboard/TranslationStatus.tsx](src/components/admin/dashboard/TranslationStatus.tsx) | Per-entity JA translation coverage widget on the admin dashboard                                                      |
| [src/hooks/use-dashboard-external.ts](src/hooks/use-dashboard-external.ts)                                   | TanStack Query hook for external services data (`/api/admin/dashboard-external`)                                      |

Scoped instructions currently live in [src/CLAUDE.md](src/CLAUDE.md), [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md), and [prisma/CLAUDE.md](prisma/CLAUDE.md).

## Request Routing

Two-tier model. The main session coordinates directly — no orchestrator agent.

### Tier 1 — main session handles directly (no agent spawn)

| Signal                                         | Action                                  |
| ---------------------------------------------- | --------------------------------------- |
| Single-file edit, typo fix, quick lookup       | Edit directly                           |
| 1-2 domain task where you already have context | Build directly                          |
| Explore / search / "where is X"                | Use built-in `Explore` subagent (haiku) |

### Tier 2 — single agent spawn

| Signal                                                  | Agent                                  |
| ------------------------------------------------------- | -------------------------------------- |
| Schema-only change (migration, new model, field change) | **db-agent**                           |
| Single entity end-to-end (schema through UI)            | **feature-builder**                    |
| Convention alignment of existing code                   | **maintenance-agent** (mode: refactor) |
| Documentation update (docs out of sync, roadmap update) | **maintenance-agent** (mode: docs)     |
| Review or audit                                         | **code-reviewer**                      |

### Tier 2 — parallel fan-out (multi-domain, 3+ areas)

For requests touching 3+ domains (schema + API + UI), the main session coordinates directly. Pattern:

1. Spawn **db-agent** for schema/migration work. Verify: `git diff --stat`, `npm run type-check`.
2. Spawn **feature-builder** with the migration context. Verify: type-check + lint.
3. Spawn **code-reviewer** with "include integration review" in the prompt.
4. Report findings to user.

Steps 1-2 are sequential (feature-builder depends on db-agent). Step 3 can begin immediately after step 2.
If the user says "orchestrate" or "full pipeline", follow this pattern.

### Model selection

Claude Code uses Anthropic model families for its built-in agent routing. Codex custom agents do **not** use this table; they use the explicit OpenAI model IDs pinned in `.codex/agents/*.toml`.

| Agent              | Default | Override to opus when                               |
| ------------------ | ------- | --------------------------------------------------- |
| db-agent           | sonnet  | Tricky migration (cross-table backfill, custom SQL) |
| feature-builder    | sonnet  | High-stakes feature, one-pass quality matters       |
| code-reviewer      | haiku   | Security-sensitive diff (auth, payment, PII)        |
| maintenance-agent  | sonnet  | Bulk rewrite touching cross-cutting abstractions    |
| Explore (built-in) | haiku   | Search requires synthesizing many unrelated files   |

## UI Skills

Four design-quality skills are installed and should be used during UI work:

| Skill                     | Trigger                                                               | When to use                                                                                                                                                                 |
| ------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **shadcn**                | Auto-triggers on `components.json` detection, shadcn component work   | Adding/composing shadcn components, using the CLI (`npx shadcn@latest add/search/docs`), styling with semantic tokens, form layout with `FieldGroup`/`Field`                |
| **emil-design-eng**       | Invoke when adding animations, transitions, or micro-interactions     | Review animation code, add `:active` states, set `transform-origin` on popovers, choose easing curves. Use selectively — not every component needs it                       |
| **frontend-design**       | Auto-triggers when building web components, pages, or applications    | Overall visual design direction — typography, color palettes, layout composition, distinctive aesthetics. Complements `emil-design-eng` (motion) and `shadcn` (composition) |
| **web-design-guidelines** | Invoke for UI review/audit, accessibility checks, pre-PR quality gate | Run `/web-design-guidelines <file-or-pattern>` before merging any UI PR. Checks a11y, focus states, dark mode, hydration safety, forms, animation, touch                    |

### Skill integration points

- **Building a new component or page**: use `frontend-design` for visual direction + `shadcn` skill for composition patterns + semantic colors. If the component has motion, consult `emil-design-eng` for animation decisions.
- **Before merging UI changes**: run `web-design-guidelines` on changed `.tsx` files as a quality gate.
- **Animation/transition work**: always consult `emil-design-eng` — it provides specific duration/easing/transform-origin guidance that matches our Radix UI + Sonner stack.

## Diagram Skills

Two architecture diagram skills are installed for generating visual documentation:

| Skill                        | Location                                   | Output format     | When to use                                                                        |
| ---------------------------- | ------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------- |
| **excalidraw-diagram**       | `.agents/skills/excalidraw-diagram/`       | `.excalidraw`     | App architecture diagrams, component flow diagrams, system overviews               |
| **aws-architecture-diagram** | `.agents/skills/aws-architecture-diagram/` | `.drawio` + `.md` | AWS infrastructure diagrams (Amplify, S3, CloudFront, Cognito, Neon, SES topology) |

Generated artifacts live in `docs/diagrams/`: `architecture.excalidraw`, `agentic-workflow.excalidraw`, `aws-architecture.drawio` + `.md` + `.png`.

## UI Verification

After UI changes, agents must verify visually using **Playwright MCP** (`mcp__playwright__*`) against the dev server at `http://localhost:3000`.

| Step | Tool                       | Purpose                         |
| ---- | -------------------------- | ------------------------------- |
| 1    | `browser_navigate`         | Load the changed page           |
| 2    | `browser_snapshot`         | Check DOM structure and content |
| 3    | `browser_take_screenshot`  | Visual verification             |
| 4    | `browser_console_messages` | Check for runtime errors        |

**Do not use Chrome MCP** for agent verification — Playwright MCP is headless, reliable, and requires no external browser window. Chrome MCP is available for manual user-driven sessions only.

## Plugins

Three plugins extend the backup Codex workflow and mirror the Claude Code tooling where possible:

| Plugin                                       | Purpose                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **skill-creator** (Codex-plugins-official)   | Create, eval, improve, and benchmark skills. Use to iterate on existing project skills with data. |
| **context-mode** (mksglu, v1.0.162)          | Sandboxes tool output for ~98% context window savings. SQLite session tracking + lifecycle hooks. |
| **frontend-design** (Codex-plugins-official) | Production-grade UI design with distinctive aesthetics. Listed above under UI Skills.             |

For multi-domain requests (3+ areas), follow the parallel fan-out pattern in Request Routing — no orchestrator agent needed.

## Critical Rules (universal — domain-specific rules live in [.claude/rules/](.claude/rules/))

1. **Auth import is `@/app/api/auth`** — `requireAuthOrApiKey(request)` for CMS/API-key routes, `requireAuth` for browser-admin-only routes, `optionalAuth` when behavior differs by login state.
2. **Use the singleton Prisma client** from `@/lib/prisma-client`. Never instantiate `PrismaClient` directly.
3. **Types come from [src/lib/data/types.ts](src/lib/data/types.ts).** Do NOT add new files under `src/types/` — that directory is being phased out.
4. **Cookies are HTTP-only, Secure, SameSite=Lax.** Tokens never touch `localStorage`.

Domain rules (Zod validation, `withErrorHandler`, ISR/client split, image pipeline, forms, data layer) are enforced by the rule files in [.claude/rules/](.claude/rules/). Read the matching rule file before editing those areas.

## Common Mistakes (this project specifically)

- ❌ Hardcoding colors in public components — use theme tokens (`bg-background`, `text-foreground`, `border-border`). Dark mode is wired via `next-themes`. For the brand orange accent (active indicators, underlines), use `var(--accent-signature)` — never hardcode the color value.
- ❌ Using `import "dotenv/config"` in app code — Next.js loads `.env` automatically. Only `prisma.config.ts` needs it.
- ❌ Using `AWS_*` env var names — Amplify reserves that namespace. Use `APP_AWS_*`.
- ❌ Forgetting to `await` `rateLimit()` — it's async (Upstash-backed). Missing `await` → spurious 429s.
- ❌ Using `NEXT_PUBLIC_APP_URL` for public-facing URLs — resolves to localhost in dev. Hardcode `https://asakurayuta.dev/...` for share links, OG tags, etc.
- ❌ Setting `tracesSampleRate: 1` in production Sentry config — use `0.1` (10 %) in production, `1` only in dev. The three Sentry config files already handle this via `process.env.NODE_ENV === "production"` guard.
- ❌ Using `disableLogger: true` in `withSentryConfig` options — this option is deprecated. Use `webpack: { treeshake: { removeDebugLogging: true } }` instead.
- ❌ Passing r3f shader uniforms via `useMemo`, `useRef`, or `useState` — React Compiler ESLint rules flag all three patterns on hook return values used as WebGL uniforms. Declare the uniforms object as a **module-level constant** outside the component (e.g. `const blobUniforms = { ... }` at the top of the file). This is safe because uniform values are mutated in-place by the GLSL pipeline, not replaced.
- ❌ Typing icon props as `icon: React.ElementType` in React 19 — `ElementType` was narrowed in React 19 types such that passing `className` resolves to `never`. Use `icon: React.ComponentType<{ className?: string }>` instead (see `AdminSidebar.tsx`).
- ❌ Assuming `portfolio` (dev) MCP tools affect production — the `portfolio` server hits `localhost:3000` (dev Neon branch). For production changes, use the `portfolio-prod` MCP tools instead (`mcp__portfolio-prod__*`), which target `https://asakurayuta.dev`. Always confirm which environment the user intends.

## MCP Servers

- **context7** — Live docs for Next.js 16, Prisma 7, TailwindCSS 4. IMPORTANT: always consult before assuming post-cutoff library APIs.
- **aws-docs** — AWS service documentation. Use for Amplify, S3, SES, Cognito behavior questions before web search.
- **aws-api** — AWS API access for deploy verification and infra state checks. See [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md).
- **prisma-local** — Migration status, schema management. Run `migrate-status` before `migrate dev`. NEVER run `migrate-reset` without user confirmation.
- **playwright** — Browser automation for visual verification at `http://localhost:3000`.
- **github** — GitHub API for PR/issue management, code search.
- **portfolio** (`mcp__portfolio__*`) — 43-tool MCP server for portfolio content management (projects, experience, education, skills, certifications, blog, messages, site content, dashboard). Stdio transport, API-key auth via Bearer token. Call `get-dashboard-stats` for overview; use `list-*` before `update-*`/`delete-*`. Messages are read/archive only (no delete). Setup: `npm run mcp:setup`. See [mcp/portfolio-server/README.md](mcp/portfolio-server/README.md). **Targets `localhost:3000` (dev Neon branch) only.**
- **portfolio-prod** (`mcp__portfolio-prod__*`) — Same 43 tools as `portfolio`, but targeting **production** at `https://asakurayuta.dev` (production Neon branch). Use when the user explicitly asks to read or modify production content. Same API key, same source code — only `PORTFOLIO_BASE_URL` differs. **Mutations via these tools directly affect the live site.**
- **sentry** (`mcp__sentry__*`) — Query Sentry errors, issues, and performance data from Claude Code and Codex backup sessions. Added via `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`; mirrored in [.codex/config.toml](.codex/config.toml) for Codex backup sessions.

## Available Agents

Four primary Claude Code agents in [.claude/agents/](.claude/agents/), mirrored for Codex custom agents in [.codex/agents/](.codex/agents/):

| Agent                 | Claude Code model | Codex model                                          | Purpose                                               |
| --------------------- | ----------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| **db-agent**          | sonnet            | `gpt-5.4` (`model_reasoning_effort = "high"`)        | Schema, migrations, seed, Neon branching              |
| **feature-builder**   | sonnet            | `gpt-5.4` (`model_reasoning_effort = "high"`)        | End-to-end feature (model + migration + API + UI)     |
| **code-reviewer**     | haiku             | `gpt-5.4-mini` (`model_reasoning_effort = "medium"`) | Read-only review + cross-domain integration checks    |
| **maintenance-agent** | sonnet            | `gpt-5.4` (`model_reasoning_effort = "high"`)        | Refactoring (mode: refactor) or doc sync (mode: docs) |

See Request Routing above for when to spawn each. The Claude-side `sonnet` / `haiku` labels do not apply inside Codex; Codex uses the TOML-pinned OpenAI models above. Built-in subagents (`Explore`/haiku, `Plan`/sonnet) are Claude Code-only.

## Codex Backup Hooks

Codex backup hooks are configured in [.codex/hooks.json](.codex/hooks.json) with scripts in [.codex/hooks/](.codex/hooks/). Claude Code remains the primary workflow and uses [.claude/settings.json](.claude/settings.json) with scripts in [.claude/hooks/](.claude/hooks/). Key gates: branch guard blocks edits on `main`/`develop`, full build + tests gate commits, Prettier auto-formats after edits.

## Codex Operating Protocol

This section applies **only when running under OpenAI Codex**. Claude Code ignores it.

### Project trust

The `.codex/config.toml` file (MCP servers, hooks, doc settings) only loads when the project is trusted. On first clone, run `codex --trust-project` or approve the trust prompt. Without trust, Codex falls back to user-level config and none of the project-specific MCP servers, hooks, or doc settings apply.

### Reading scoped docs before editing

Codex does not auto-load `.claude/rules/*.md` by file-pattern match (that is a Claude Code feature). Before editing domain-specific code, **always read the relevant scoped docs first**:

| Area you are editing                 | Read these files before starting                       |
| ------------------------------------ | ------------------------------------------------------ |
| Anything under `src/`                | `src/CLAUDE.md`                                        |
| API routes (`src/app/api/`)          | `src/app/api/CLAUDE.md`, `.claude/rules/api-routes.md` |
| Components (`src/components/`)       | `.claude/rules/components.md`                          |
| Data layer (`src/lib/data/`)         | `.claude/rules/data-layer.md`                          |
| Validations (`src/lib/validations/`) | `.claude/rules/validations.md`                         |
| Prisma schema or migrations          | `prisma/CLAUDE.md`, `.claude/rules/prisma-schema.md`   |
| Tests (`*.test.ts`, `*.test.tsx`)    | `.claude/rules/tests.md`                               |

Use `cat <file>` to read each before making changes. These files contain critical project-specific rules that override general knowledge.

### Agent routing

Codex custom agents are defined in `.codex/agents/*.toml`. Unlike Claude Code, Codex does **not** automatically spawn agents based on the Request Routing table. Agents must be explicitly invoked by the user, and their model choice comes from the TOML file rather than the Claude Code model-selection table above.

**Trigger phrases** that indicate the user wants agent delegation:

- "orchestrate" or "full pipeline" → follow the parallel fan-out pattern (db-agent → feature-builder → code-reviewer)
- "delegate to db-agent" or "use db-agent" → spawn db-agent
- "spawn feature-builder" → spawn feature-builder
- "review with code-reviewer" → spawn code-reviewer
- "run maintenance-agent (mode: docs)" or "run maintenance-agent (mode: refactor)" → spawn maintenance-agent

**Fallback:** If Codex cannot spawn the requested agent (tool unavailable, threading limits, etc.), the main session should:

1. State that the agent could not be spawned.
2. Read that agent's `.codex/agents/<name>.toml` to load its `developer_instructions`.
3. Follow those instructions manually within the main session.

### Features not available in Codex

These Claude Code features have no direct Codex equivalent:

| Claude Code feature                                    | Codex alternative                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------- |
| `Explore` / `Plan` built-in subagents                  | Use Bash search commands (`grep`, `find`, `git log`) directly             |
| Slash commands (`/check`, `/new-route`, `/pr-ready`)   | Run equivalent steps manually (see `.claude/commands/*.md` for the steps) |
| Plugin auto-triggering (shadcn, frontend-design, etc.) | Read the skill instructions manually if needed                            |
| `${CLAUDE_PROJECT_DIR}` env var                        | Use `$(git rev-parse --show-toplevel)`                                    |
| Pattern-matched `.claude/rules/*.md` loading           | Read relevant rule files explicitly (see table above)                     |

### context-mode dependency

All four agent TOML files reference `ctx_batch_execute` from the context-mode plugin. If context-mode is not installed in your Codex environment, agents should fall back to reading files directly with `cat` via Bash. The instructions still apply — only the reading mechanism changes.

### Verification workflow

After any code change, verify the same way Claude Code does:

1. **Type safety:** `npm run type-check`
2. **Lint:** `npm run lint`
3. **Tests:** `npm test` (if touching tested code)
4. **UI changes:** Use Playwright MCP (`browser_navigate` → `browser_snapshot` → `browser_take_screenshot` → `browser_console_messages`) against `http://localhost:3000`
5. **Build:** `npm run build` before final PR

## Git Commit Style

- **Subject line only.** Use `git commit -m "<subject>"` — no body, no extended description. The diff already shows what changed; the subject says why at a glance.
- **No heredoc messages.** Don't write `git commit -m "$(cat <<'EOF' ... EOF)"`. Single-line `-m` only.
- **No `Co-Authored-By` trailer.** Don't append `Co-Authored-By: Codex ...` or any other Codex attribution. The git author already records who ran the commit.
- Subject format: `<type>: <short imperative>` matching existing log style (`docs:`, `test:`, `setup:`, `fix:`, `feat:`).

## Environment Setup

Local dev needs a `.env` (not `.env.example` — it has drift; see [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md) §Environment Variables). Production env lives in Amplify Console and is materialized into `.env.production` at build time by [amplify.yml](amplify.yml).

Dashboard external services require four additional env vars (optional — the route degrades gracefully when absent):

- `SENTRY_ORG_SLUG`, `SENTRY_PROJECT_SLUG` — Sentry issues panel on the admin dashboard
- `AMPLIFY_APP_ID` — Amplify build-status card on the admin dashboard
- `GA_PROPERTY_ID` — Google Analytics link card on the admin dashboard

## Compaction

When compacting, always preserve:

- The full list of files modified in the current task
- The current git branch name and any in-progress PR
- Which agent workflow step we are on (if multi-agent fan-out is running)
- Any user decisions or preferences stated in this session
- Error messages from failed builds/tests that haven't been resolved yet
