# Feature Roadmap

Living document tracking planned features, improvements, and integrations for the portfolio project.

Last updated: 2026-05-25

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
- [x] GitHub CodeQL — static security analysis (free for public repos)
- [x] Dependabot — dependency vulnerability scanning
- [x] Vitest — unit/integration test framework (5 test files covering errors, auth, validations, contact route)
- [x] Playwright — E2E browser testing
- [x] Remove Zustand — removed from package.json, docs updated

---

## 3. SEO & Discoverability

- [ ] Improve SEO — meta tags, structured data, performance
- [ ] Custom Open Graph images — dynamic OG images per page/post
- [ ] Sitemap.xml generation
- [ ] JSON-LD structured data (Person, Article, Project schemas)
- [ ] RSS feed for blog posts
- [ ] Custom logo/favicon on navbar and browser tabs
- [ ] Blog reading time estimate
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

- [x] Neon prod-to-dev continuous replication — branch from prod so dev always has real data　
      NOTE: Done using Neon DB console's reset from parent
- [ ] Admin audit log — track who changed what, when (simple table)
- [ ] Content import/export from admin (JSON/CSV)

---

## 7. Blog Features

- [ ] LinkedIn post importer — pull existing LinkedIn posts and convert them into blog entries, preserving the original publish date
- [ ] Social share buttons — one-click sharing to LinkedIn, Facebook, Instagram, and other major platforms
- [ ] Blog reading time estimate (also listed under SEO)
- [ ] Auto-generated table of contents (also listed under SEO)

---

## 8. Portfolio Design & UX

- [ ] Complete portfolio redesign — research best practices, iterate incrementally
  - Research trending Claude Code skills/agents and AI design tools that can generate or redesign full websites with modern, polished UI (e.g. design-system generators, UI cloning agents, portfolio-specific skills). Evaluate which ones produce the best results before committing to an approach.
- [ ] Interactive 3D element on hero page (Three.js / React Three Fiber)
- [ ] Internationalization (i18n) — evaluate if multilingual audience justifies maintenance cost
- [ ] Dark mode refinements

---

## 9. Tooling & Developer Experience

### Skills & Agents

- [ ] Add new Claude Code skills — [10 must-have skills for Claude Code (2026)](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051)
- [ ] Prompt writer agent — refine prompts for better Claude Code output
- [ ] New skills/tools/agents derived from existing repos
- [ ] Excalidraw diagram generator — visual architecture diagrams
  - References: [Medium skill guide](https://medium.com/@unicodeveloper/10-must-have-skills-for-claude-and-any-coding-agent-in-2026-b5451b013051), [AWS architecture diagram skill](https://github.com/vidanov/aws-architecture-diagram-skill)

### MCP Servers

- [ ] Portfolio MCP — automate content creation and editing from Claude Code
- [x] GitHub MCP — PR/issue management from Claude Code
- [x] Google Chrome MCP — browser automation (already configured)
- [x] AWS MCP — AWS documentation access (already configured)

### Documentation

- [ ] GitHub wiki for project documentation
- [ ] Architecture diagram (Excalidraw or AWS diagram skill)

### Media & Demo

- [ ] Automated screenshots via agents for documentation/demos
- [ ] Demo video / screen capture automation (Remotion or similar)

---

## Suggested Priority Order

1. ~~**Bug fixes** — blurred image preview in admin education~~ (done)
2. ~~**CI/CD foundation** — GitHub Actions + CodeQL + Dependabot + GitHub MCP + remove Zustand~~ (done)
3. ~~**Vitest** — test framework wired, 5 test files covering critical paths~~ (done)
4. **Neon replication** — prod-to-dev branch so dev always has real data (blocker for dynamic OG images and other data-dependent features)
5. **SEO batch** — OG images, sitemap, JSON-LD, RSS, favicon
6. **Blog features** — social share buttons, LinkedIn importer
7. **Sentry** — error tracking before adding more features
8. **Admin improvements** — audit log, content export
9. **Observability** — CloudWatch, SNS, health check
10. **Design & UX** — hero 3D element, redesign iterations
11. **Tooling** — new skills, Portfolio MCP, diagram generator
