# Feature Roadmap

Living document tracking planned features, improvements, and integrations for the portfolio project.

Last updated: 2026-06-10 (SEO batch: sitemap, OG images, JSON-LD, meta tags marked done — already implemented)

---

## Status Legend

| Symbol | Meaning     |
| ------ | ----------- |
| -      | Not started |
| ~      | In progress |
| x      | Done        |

---

## 1. Bug Fixes (Priority)

- [x] Education credential view on about page is not working correctly
- [x] Image preview on credential upload in admin education section is blurred

---

## 2. CI/CD & Code Quality

- [x] GitHub MCP for agentic Github administration
- [x] GitHub Actions CI pipeline (lint, type-check, build, test on every PR)
- [x] Update GitHub Actions actions to current major versions — `actions/checkout@v6`, `actions/setup-node@v6`, `github/codeql-action@v4`; CI currently runs Node.js 22
- [x] GitHub CodeQL — static security analysis (free for public repos)
- [x] Dependabot — dependency vulnerability scanning
- [x] Vitest — unit/integration test framework (5 test files covering errors, auth, validations, contact route)
- [x] Playwright MCP — headless browser verification for agents
- [x] Remove Zustand — removed from package.json, docs updated
- [ ] Vitest - Additional tests before final audit.

---

## 3. SEO & Discoverability

- [x] Blog reading time estimate
- [x] Improve SEO — meta tags, structured data, performance (`generateMetadata` on all 7 public pages, `robots.ts`, `metadataBase`, Twitter cards)
- [x] Custom Open Graph images — dynamic OG images per page/post (root `opengraph-image.tsx` + per-slug routes for blog and projects)
- [x] Sitemap.xml generation (`src/app/sitemap.ts` — static pages + all published projects/blog posts)
- [x] JSON-LD structured data (Person + WebSite on homepage, Article on blog, CreativeWork on projects, BreadcrumbList on detail pages)
- [ ] RSS feed for blog posts
- [x] Custom logo/favicon on navbar and browser tabs
- [x] Auto-generated table of contents for blog posts

---

## 4. Observability & Monitoring

- [x] Sentry integration — `@sentry/nextjs` `^10.56.0` (now properly declared in `package.json`); three runtime configs (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`), `instrumentation.ts` hook, `withSentryConfig` wrapper in `next.config.ts` (uses `webpack: { treeshake: { removeDebugLogging: true } }` — deprecated `disableLogger: true` removed), `NEXT_PUBLIC_SENTRY_DSN` + `SENTRY_AUTH_TOKEN` env vars wired through `amplify.yml`
- [x] Sentry MCP server — `mcp__sentry__*` added via `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`
- [x] Health check endpoint (`/api/health`) — public GET, pings DB with `prisma.$queryRaw\`SELECT 1\``, returns `{ data: { status, timestamp, database } }` (200 ok / 503 degraded)
- [ ] CloudWatch Alarms — monitor Amplify build failures, error rates (free tier)
- [ ] SNS notifications — alert on build failures or errors via email (first 1M free)
- [ ] Privacy-friendly analytics (Plausible or Umami self-hosted, no cookie banners)

---

## 5. AWS Integrations (Free Tier)

- [x] S3 (images), CloudFront (CDN), SES (email), Cognito (auth) — already in use
- [x] AWS MCP for documentation — already configured
- [ ] CloudWatch Alarms — basic monitoring (free tier)
- [ ] SNS — notification delivery for alerts (first 1M free)
- [ ] SSM Parameter Store — free standard parameters, better secret management
  - Previously attempted but difficult with Amplify's env var setup. Only pursue if a safe migration path exists that doesn't risk the current working configuration.
- [ ] EventBridge — scheduled tasks
  - Primary use case: trigger LinkedIn-to-blog import on a schedule. Open to other use cases if they emerge.
- [ ] CloudFront Functions — lightweight edge compute (free tier included)
- [ ] Explore other free-tier services as needs arise

---

## 6. Database & Data

- [x] Neon prod-to-dev continuous replication — branch from prod so dev always has real data (done using Neon DB console's reset from parent)
- [x] Content import/export from admin (JSON/CSV) — JSON+CSV export for all entities, JSON+CSV import with preview/validation for all except messages. Two import modes (create-only, upsert). Rate-limited, CSV injection-safe, date-validated.
- [x] Admin dark mode theming pass — replaced hardcoded colors with theme tokens across ~38 admin files
- [x] Drag-and-drop reordering for certifications (and other entities with `displayOrder`) — `use-dnd-reorder.ts` generic hook + `CertificationsManagerSection` Edit Order mode
- [ ] Admin audit log — track who changed what, when (simple table)
- [x] Unified JSON import/export — export all entities to a single JSON file and import them back; admin "Import / Export" page at `/admin/import`

---

## 7. Blog Features

- [x] Social share buttons — one-click sharing to LinkedIn, Facebook, and X/Twitter via native share URLs (no third-party SDKs); copy-link button via clipboard API + Sonner toast
- [x] Blog reading time estimate (also listed under SEO)
- [ ] LinkedIn post importer — pull existing LinkedIn posts and convert them into blog entries, preserving the original publish date
      LinkedIn lets you export your own data: Settings → Data Privacy → Get a copy of your data → Posts. You get a ZIP with a Shares.csv or Posts.csv that includes the post text and publish date. You could build a one-time import UI in the admin that accepts that CSV and converts rows to draft blog entries — original dates preserved via createdAt override.
- [x] Auto-generated table of contents (also listed under SEO)

---

## 8. Portfolio Design & UX

- [x] Admin theme toggle — `ThemeToggle` moved to `src/components/shared/ThemeToggle.tsx` and rendered in both the public `Header` and `AdminHeader`
- admin pages doesnt look like public pages. admin should look like publc pages for consistency.
- [x] Admin dashboard — expanded to full dashboard: 4 stat cards (projects, posts, messages, skills) with published/draft breakdowns, quick actions, certification expiry alerts, recent unread messages preview, merged recent activity timeline, and content completeness checklist. 6 sub-components in `src/components/admin/dashboard/`. New `src/lib/time-ago.ts` utility. Expanded `GET /api/admin/dashboard-stats` endpoint.
- [ ] Categorize certifications — add category field, render with tab UI similar to skills or something unique (azure, aws, anthropic, language, etc.)
- [x] Complete portfolio redesign — research best practices, iterate incrementally
  - UI skills are installed and ready: `shadcn` (component composition), `emil-design-eng` (design engineering + animations), `frontend-design` (visual design direction + distinctive aesthetics), `web-design-guidelines` (Vercel interface guidelines, pre-PR quality gate). Skills live in `.agents/skills/` with symlinks in `.claude/skills/`; `frontend-design` is installed as a plugin.
- [x] Interactive 3D element on hero page (Three.js / React Three Fiber) — `HeroBlob.tsx` using `@react-three/fiber` + `three`; morphing GLSL shader blob with mouse/hover interaction. `three` pinned to `^0.182.0` (r183 deprecated `THREE.Clock` which r3f v9.6.1 still uses). `WebGLErrorBoundary` class component wraps `Canvas` to silently catch WebGL init failures on old browsers (Mobile Safari 13 / iOS 13) instead of crashing the page. Shader uniforms declared as a module-level constant to satisfy React Compiler ESLint rules.
- [ ] Internationalization (i18n) — evaluate if multilingual audience justifies maintenance cost
- [x] Dark mode refinements
- [ ] Add micro-interactions and animation polish — use `emil-design-eng` skill for transitions, spring physics, and interaction choreography
- [x] Improve UI/UX quality — use `shadcn` skill for component composition patterns and `web-design-guidelines` skill as a pre-PR quality gate
- Drag and drop functionality for certificates that will auto populate form.
- [x] Hamburger menu drop down design — active item now uses orange left-border accent (`border-l-2 border-l-[var(--accent-signature)]`) with subtle background tint, matching the public nav design language. Inactive items have a transparent left border for layout stability.
- [x] Skills section tabs micro-interactions — active tab indicator changed from black (`after:bg-foreground`) to orange (`after:bg-[var(--accent-signature)]`), using width-based expansion from center (matching the `.nav-link::after` pattern). Hover preview underline added. Tab content transitions use `animate-in fade-in-0 duration-200`.
- [x] Background color for public pages — changed from pure white (`oklch(1 0 0)`) to warm cream (`oklch(0.98 0.005 90)`), matching Anthropic's rgb(250,249,245). Card and popover tokens updated to `oklch(0.995 0.003 90)` for subtle separation. Dark mode unchanged.

---

## 9. Tooling & Developer Experience

### Skills & Agents

- [x] Documentation agent — standalone agent that reads codebase, diffs against docs, and updates CLAUDE.md files, roadmap, and rules → **merged into maintenance-agent (mode: docs)**
- [x] Post-commit doc reminder hook — PostToolUse hook on `Bash` that detects significant commits and suggests running maintenance-agent (mode: docs)
- [x] Orchestrator auto-routing → **replaced with 2-tier routing model** (main session handles directly or spawns single agent; no orchestrator layer)
- [x] Pre-edit branch guard hook — PreToolUse hook on `Edit|Write` that blocks file edits on `main`/`develop`
- [-] Prompt writer agent — deferred. Better to improve CLAUDE.md rules directly. Revisit if improvements aren't enough.
- [x] Install UI skills — researched 7 candidates (Impeccable, UI UX Pro Max, Emil Kowalski, shadcn/ui, interaction-design, interface-design, web-design-guidelines); installed 3: `shadcn` (auto-triggers on component work), `emil-design-eng` (selective for animations/transitions), `web-design-guidelines` (pre-PR quality gate). Wired into `CLAUDE.md` UI Skills section and `.claude/rules/components.md`.
- [~] Add new agent skills — [10 must-have skills for Claude Code (2026)](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051)
- [~] New plugins/skills installed and evaluated:
  INSTALLED: - [x] `skill-creator` — create, eval, improve, and benchmark skills (4 modes: Create, Eval, Improve, Benchmark) - [x] `context-mode@context-mode` (v1.0.162) — sandboxes tool output for ~98% context window savings, SQLite session tracking, sandbox tools + lifecycle hooks - [x] `frontend-design` — production-grade UI design with distinctive aesthetics (complements `emil-design-eng` for animation + `shadcn` for composition + `web-design-guidelines` for quality gate)
  EVALUATED & SKIPPED: - [-] `superpowers@claude-plugins-official` — structured TDD/debug methodology. Skipped: overlaps with existing CLAUDE.md workflow, hooks, and 2-tier routing. - [-] `get-shit-done-cc` — meta-prompting + spec-driven dev. Skipped: installs its own CLAUDE.md/hooks, would conflict with existing setup. - [-] `claude-mem` (thedotmack) — persistent memory across sessions. Skipped: HIGH security risk (unauthenticated HTTP API on port 37777), and built-in `.claude/projects/` memory already covers this.
  ALREADY AVAILABLE (built-in): - [x] /review (fast) — built-in skill, no install needed - [x] /ultrareview — built-in cloud review (Pro/Max only, 3 runs/5-20 USD)

- [x] Excalidraw diagram generator — visual architecture diagrams; installed to `.agents/skills/excalidraw-diagram`; generated `architecture.excalidraw` at repo root
  - References: npx skills add https://github.com/coleam00/excalidraw-diagram-skill --skill excalidraw-diagram
    - https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051
- [x] AWS architecture diagram skill — installed to `.agents/skills/aws-architecture-diagram`; generated `docs/aws-architecture.drawio` + `docs/aws-architecture.md`
  - References: https://github.com/vidanov/aws-architecture-diagram-skill
  - npx skills add vidanov/aws-architecture-diagram-skill

- [x] remove all unused branches except main and develop branch.
- [x] UI verification tool decision — Playwright MCP chosen as default for agents (headless, reliable, no external deps). Documented in CLAUDE.md § UI Verification and .claude/rules/components.md.
- [x] Cache revalidation fix — unified import now revalidates detail pages (`/projects/[slug]`, `/blog/[slug]`) via `detailPathPrefix` in entity configs. Blog import also revalidates homepage.
- [x] full audit agentic workflow findout token optimization needs — cleaned settings.local.json (64 → 24 entries), added frontmatter fields to all 7 agents (`maxTurns`, `memory`, `skills`, `mcpServers`), added `async: true` to post-commit hook, created 3 slash commands (`/check`, `/new-route`, `/pr-ready`)
- [x] Agentic workflow redesign — 7 agents → 4 (deleted orchestrator, synthesizer, documentation-agent; merged refactor-agent + documentation-agent → maintenance-agent). 2-tier routing (main session direct or single agent spawn). All agents use context-mode `ctx_batch_execute` for doc reads (~98% context savings). maxTurns capped on all 4. Updated `agentic-workflow.excalidraw` diagram.
- [x] Slash commands — `/check` (lint + type-check + test), `/new-route` (API route scaffold), `/pr-ready` (pre-PR quality gate + draft) created in `.claude/commands/`
- use /excalidraw-diagram skill to to create a diagram of current agentic workflow/orchestration. skill to create a diagram of current agentic workflow/orchestration.
- codebase full audit. check type safety, type system, warnings, bugs, errors in code and bad practices. use /ultrareview or whatever agent or skill that is best.

### MCP Servers

- [x] GitHub MCP — PR/issue management from agent sessions
- [x] Google Chrome MCP — browser automation (already configured)
- [x] AWS MCP — AWS documentation access (already configured)
- [x] Codex backup setup — `.codex/agents/`, `.codex/hooks.json`, and `.codex/config.toml` mirror the main Claude Code workflow where possible. Claude Code remains the primary agent environment; Codex is configured as a backup.
- [x] Portfolio MCP — registered as the primary Claude Code MCP server in `.mcp.json` and mirrored for Codex backup in `.codex/config.toml`; local server in `mcp/portfolio-server` registers project, experience, education, skill, certification, message, blog, content, and dashboard tools.

### Documentation

- [ ] GitHub wiki for project documentation
- [x] Architecture diagram — `architecture.excalidraw` (app architecture) and `docs/aws-architecture.drawio` (AWS infrastructure) generated using installed diagram skills
- [ ] Comprehensive project documentation or Hero doc — folder structure, features, API reference, tech stack, setup guide

### Media & Demo

- [ ] Automated screenshots via agents for documentation/demos
- [ ] Demo video / screen capture automation (Remotion or similar)

---

## Suggested Priority Order

1. ~~**Bug fixes** — education credential view + blurred image preview~~ (done)
2. ~~**CI/CD foundation** — GitHub Actions + CodeQL + Dependabot + GitHub MCP + Vitest + Playwright~~ (done)
3. ~~**Neon replication** — prod-to-dev branch so dev always has real data~~ (done)
4. ~~**Content import/export** — JSON+CSV bulk import/export for all entities~~ (done)
5. ~~**Admin dark mode** — theme token pass across all admin files~~ (done)
6. ~~**Blog enhancements** — social share buttons + reading time~~ (done)
7. ~~**SEO batch** — OG images, sitemap, JSON-LD~~ (done) — RSS feed still pending
8. **Blog features** — LinkedIn importer
9. ~~**Sentry** — error tracking before adding more features~~ (done)
10. **Admin improvements** — audit log, certification categories
11. **Observability** — CloudWatch, SNS
12. **Design & UX** — redesign iterations, micro-interactions, dark mode refinements
13. **Tooling** — new skills, Portfolio MCP, diagram generator
