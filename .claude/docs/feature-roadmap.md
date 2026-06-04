# Feature Roadmap

Living document tracking planned features, improvements, and integrations for the portfolio project.

Last updated: 2026-06-04

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
- [x] Update GitHub Actions to Node.js 24 — `actions/checkout@v6`, `actions/setup-node@v6`, `github/codeql-action@v4` (all Node.js 24)
- [x] GitHub CodeQL — static security analysis (free for public repos)
- [x] Dependabot — dependency vulnerability scanning
- [x] Vitest — unit/integration test framework (5 test files covering errors, auth, validations, contact route)
- [x] Playwright — E2E browser testing
- [x] Remove Zustand — removed from package.json, docs updated

---

## 3. SEO & Discoverability

- [x] Blog reading time estimate
- [ ] Improve SEO — meta tags, structured data, performance
- [ ] Custom Open Graph images — dynamic OG images per page/post
- [ ] Sitemap.xml generation
- [ ] JSON-LD structured data (Person, Article, Project schemas)
- [ ] RSS feed for blog posts
- [ ] Custom logo/favicon on navbar and browser tabs
- [ ] Auto-generated table of contents for blog posts

---

## 4. Observability & Monitoring

- [ ] Sentry integration — error tracking and performance monitoring
- [ ] Sentry MCP server — query errors from Claude Code
- [ ] Health check endpoint (`/api/health`) — ping DB, check S3/SES connectivity
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
- [ ] Auto-generated table of contents (also listed under SEO)

---

## 8. Portfolio Design & UX

- [ ] Admin theme toggle — add light/dark mode switcher to the admin layout (public site already has one)
- admin pages doesnt look like public pages. admin should look like publc pages for consistency.
- [ ] Admin dashboard — surface key metrics (page visits, countries from Google Analytics, errors from Sentry, and other important figures)
- [ ] Categorize certifications — add category field, render with tab UI similar to skills (azure, aws, anthropic, language, etc.)
- [ ] Complete portfolio redesign — research best practices, iterate incrementally
  - UI skills are installed and ready: `shadcn` (component composition), `emil-design-eng` (design engineering + animations), `frontend-design` (visual design direction + distinctive aesthetics), `web-design-guidelines` (Vercel interface guidelines, pre-PR quality gate). Skills live in `.agents/skills/` with symlinks in `.claude/skills/`; `frontend-design` is installed as a plugin.
- [ ] Interactive 3D element on hero page (Three.js / React Three Fiber)
- [ ] Internationalization (i18n) — evaluate if multilingual audience justifies maintenance cost
- [ ] Dark mode refinements
- [ ] Add micro-interactions and animation polish — use `emil-design-eng` skill for transitions, spring physics, and interaction choreography
- [ ] Improve UI/UX quality — use `shadcn` skill for component composition patterns and `web-design-guidelines` skill as a pre-PR quality gate
- Drag and drop functionality for certificates that will auto populate form.
- [x] Hamburger menu drop down design — active item now uses orange left-border accent (`border-l-2 border-l-[var(--accent-signature)]`) with subtle background tint, matching the public nav design language. Inactive items have a transparent left border for layout stability.
- [x] Skills section tabs micro-interactions — active tab indicator changed from black (`after:bg-foreground`) to orange (`after:bg-[var(--accent-signature)]`), using width-based expansion from center (matching the `.nav-link::after` pattern). Hover preview underline added. Tab content transitions use `animate-in fade-in-0 duration-200`.
- [x] Background color for public pages — changed from pure white (`oklch(1 0 0)`) to warm cream (`oklch(0.98 0.005 90)`), matching Anthropic's rgb(250,249,245). Card and popover tokens updated to `oklch(0.995 0.003 90)` for subtle separation. Dark mode unchanged.

---

## 9. Tooling & Developer Experience

### Skills & Agents

- [x] Documentation agent — standalone agent that reads codebase, diffs against docs, and updates CLAUDE.md files, roadmap, and rules
- [x] Post-commit doc reminder hook — PostToolUse hook on `Bash` that detects significant commits and suggests running the documentation-agent
- [x] Orchestrator auto-routing — implemented as a Request Routing decision-tree table in `CLAUDE.md`
- [x] Pre-edit branch guard hook — PreToolUse hook on `Edit|Write` that blocks file edits on `main`/`develop`
- [-] Prompt writer agent — deferred. Better to improve CLAUDE.md rules directly. Revisit if improvements aren't enough.
- [x] Install UI skills — researched 7 candidates (Impeccable, UI UX Pro Max, Emil Kowalski, shadcn/ui, interaction-design, interface-design, web-design-guidelines); installed 3: `shadcn` (auto-triggers on component work), `emil-design-eng` (selective for animations/transitions), `web-design-guidelines` (pre-PR quality gate). Wired into `CLAUDE.md` UI Skills section and `.claude/rules/components.md`.
- [~] Add new Claude Code skills — [10 must-have skills for Claude Code (2026)](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051)
- [~] New plugins/skills installed and evaluated:
  INSTALLED: - [x] `skill-creator@claude-plugins-official` — create, eval, improve, and benchmark skills (4 modes: Create, Eval, Improve, Benchmark) - [x] `context-mode@context-mode` (v1.0.162) — sandboxes tool output for ~98% context window savings, SQLite session tracking, 6 sandbox tools + lifecycle hooks - [x] `frontend-design@claude-plugins-official` — production-grade UI design with distinctive aesthetics (complements `emil-design-eng` for animation + `shadcn` for composition + `web-design-guidelines` for quality gate)
  EVALUATED & SKIPPED: - [-] `superpowers@claude-plugins-official` — structured TDD/debug methodology. Skipped: overlaps with existing CLAUDE.md workflow, hooks, and orchestrator routing. - [-] `get-shit-done-cc` — meta-prompting + spec-driven dev. Skipped: installs its own CLAUDE.md/hooks, would conflict with existing setup. - [-] `claude-mem` (thedotmack) — persistent memory across sessions. Skipped: HIGH security risk (unauthenticated HTTP API on port 37777), and built-in `.claude/projects/` memory already covers this.
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
- full audit agentic workflow findout token optimization needs
- use draw.io skill to create a diagram of current agentic workflow/orchestration.

### MCP Servers

- [x] GitHub MCP — PR/issue management from Claude Code
- [x] Google Chrome MCP — browser automation (already configured)
- [x] AWS MCP — AWS documentation access (already configured)
- [ ] Portfolio MCP — automate content creation and editing from Claude Code

### Documentation

- [ ] GitHub wiki for project documentation
- [x] Architecture diagram — `architecture.excalidraw` (app architecture) and `docs/aws-architecture.drawio` (AWS infrastructure) generated using installed diagram skills
- [ ] Comprehensive project documentation — folder structure, features, API reference, tech stack, setup guide

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
7. **SEO batch** — OG images, sitemap, JSON-LD, RSS, favicon
8. **Blog features** — LinkedIn importer, table of contents
9. **Sentry** — error tracking before adding more features
10. **Admin improvements** — audit log, certification categories, admin theme toggle, dashboard
11. **Observability** — CloudWatch, SNS, health check
12. **Design & UX** — hero 3D element, redesign iterations
13. **Tooling** — new skills, Portfolio MCP, diagram generator
