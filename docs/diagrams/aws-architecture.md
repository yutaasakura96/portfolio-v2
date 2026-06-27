# Portfolio v2 — AWS Infrastructure Diagram

**File:** `docs/diagrams/aws-architecture.drawio` (single page)
**Export:** `aws-architecture.png` (embeds the diagram XML — re-editable in draw.io)
**Last updated:** June 2026

The diagram is a single page with two stacked sections — **① CI/CD** (build, test, deploy) on top and **② Runtime** (request & data flow) below — joined by the orange "deploys SSR app" arrow.

---

## Section ① — Runtime Architecture

### AWS Services

| Service                       | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| **Amazon CloudFront**         | 2 distributions — Amplify-managed CDN for SSR pages + standalone CDN for S3 images/assets |
| **AWS WAF v2**                | Web ACL attached to the assets CloudFront distribution                                    |
| **AWS Amplify Hosting Gen 1** | SSR hosting for the Next.js 16 application, auto-deploys from GitHub                      |
| **Amazon S3**                 | Image storage — uploads are processed via Sharp → WebP, served through CloudFront (OAC)   |
| **Amazon Cognito**            | Admin authentication — Hosted UI with OAuth code flow, issues JWTs                        |
| **Amazon SES**                | Transactional email for the contact form (fire-and-forget)                                |

### External Services (non-AWS)

| Service              | Purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| **Neon Postgres**    | Managed database (2 branches: prod + dev), PrismaNeon WebSocket adapter           |
| **Upstash Redis**    | Rate limiting for API routes (`@upstash/ratelimit`)                               |
| **Sentry**           | Error tracking — 3-tier setup (client SDK, server, edge), 10% trace sampling prod |
| **Google Analytics** | GA4 client-side analytics                                                         |
| **Anthropic Claude** | Haiku model for EN→JA content translation and certificate field extraction        |
| **MCP Server**       | 43-tool content management server (stdio transport, dev + prod instances)         |

### Flows

1. **Public page request** — User → WAF v2 → CloudFront → Amplify (SSR) → Neon Postgres (Prisma WebSocket)
2. **Static asset / image** — User → WAF v2 → CloudFront (assets dist.) → S3 (WebP, immutable 1yr cache)
3. **Admin auth** — Admin → Cognito Hosted UI (OAuth code) → Amplify callback → HTTP-only JWT cookie
4. **Image upload** — Admin → Amplify API route → Sharp (thumb/med/lg/original → WebP) → S3 → CloudFront
5. **Contact email** — User submits form → Amplify API route → rate-limit (Upstash) → SES → recipient inbox
6. **Error tracking (3-tier)** — client SDK (browser → Sentry), server + edge (Amplify → Sentry)
7. **Content translation** — Admin → Amplify API route → Anthropic Claude Haiku → Neon
8. **Client analytics** — Public user browser → Google Analytics (GA4)
9. **MCP content management** — MCP Server (stdio) → Amplify API routes (dev + prod) → Neon

### Edge styles

- **Solid `#232F3E`** — primary request / data flow
- **Dashed `#232F3E`** — async / telemetry / service-to-service call
- **Red `#DD344C`** — authentication flow (Cognito OAuth)
- **Server icon** — external (non-AWS) service · **Client icon** — user / browser / recipient

---

## Section ② — CI/CD Pipeline

### GitHub Actions (`.github/workflows/`)

| Workflow             | File                 | Trigger                                        | What it does                                                        |
| -------------------- | -------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| **CI**               | `ci.yml`             | PR / push → `main`, `develop`                  | Lint → type-check → `next build` → build-size gate (≤220 MB) → test |
| **CodeQL**           | `codeql.yml`         | PR → `main` + weekly (Mon 04:30 UTC)           | `security-and-quality` static analysis, JS/TS                       |
| **Reset Dev Branch** | `neon-reset-dev.yml` | schedule (Mon 06:00 UTC) + `workflow_dispatch` | Calls Neon API to restore the `dev` branch from `prod`              |

### Amplify auto-deploy (`amplify.yml`)

Amplify Hosting watches the `main` branch directly (separate from GitHub Actions). On every push to `main`:

```
preBuild  → generate .env.production from Console env vars → npm ci → prisma generate
build     → prisma migrate deploy (→ Neon prod) → next build → strip source maps
postBuild → report build output size
```

The deployed artifacts are released to the Amplify-managed CloudFront distribution, which serves `asakurayuta.dev` to users over HTTPS.

### Flows

1. **Verification** — Developer → `git push` / PR → GitHub → CI + CodeQL run; status checks report back to the PR
2. **Deploy** — push to `main` → Amplify build pipeline (`npm ci → prisma generate → prisma migrate deploy → next build → deploy`) → CloudFront (SSR) → Users
3. **Migrations** — the `prisma migrate deploy` build step applies migrations to the Neon **prod** branch
4. **Dev branch maintenance** — weekly cron (or manual dispatch) restores the Neon **dev** branch from **prod**

### Edge styles

- **Solid `#232F3E`** — triggered flow (push / PR)
- **Dashed `#232F3E`** — scheduled / feedback (status checks, cron)
- **Orange `#ED7100`** — Amplify auto-deploy trigger

---

## Regenerating the exports

```bash
CLI="/Applications/draw.io.app/Contents/MacOS/draw.io"
"$CLI" -x -f png -e -b 10 -o docs/diagrams/aws-architecture.png docs/diagrams/aws-architecture.drawio
```

`-e` embeds the diagram XML in the PNG so it stays editable in draw.io.

### Brand icons for non-AWS services

AWS services use the built-in `mxgraph.aws4` stencils. The non-AWS services (GitHub, GitHub Actions, Neon, Sentry, Upstash, Google Analytics, Anthropic, MCP) use their real brand marks, embedded as PNG images inside each node's style.

Two gotchas if you ever re-embed them:

- draw.io's headless CLI export does **not** rasterize SVG data-URIs — embed **PNG** instead (rasterize the SVG first, e.g. `magick -background none -density 384 logo.svg -resize 256x256 logo.png`; for SVGs ImageMagick can't parse, `qlmanage -t -s 256 -o . logo.svg` works).
- The image must use draw.io's own data-URI format `image=data:image/png,<base64>` — **not** the W3C `data:image/png;base64,<base64>`, which renders as a broken-image placeholder in CLI export.
