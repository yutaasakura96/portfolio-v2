# Portfolio v2 — AWS Infrastructure Diagram

**File:** `docs/diagrams/aws-architecture.drawio`
**Last updated:** June 2026

## AWS Services

| Service                       | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| **Amazon CloudFront**         | 2 distributions — Amplify-managed CDN for SSR pages + standalone CDN for S3 images/assets |
| **AWS WAF v2**                | Web ACL attached to the assets CloudFront distribution                                    |
| **AWS Amplify Hosting Gen 1** | SSR hosting for the Next.js 16 application, auto-deploys from GitHub                      |
| **Amazon S3**                 | Image storage — uploads are processed via Sharp → WebP before storage                     |
| **Amazon Cognito**            | Admin authentication — Hosted UI with OAuth code flow, issues JWTs                        |
| **Amazon SES**                | Transactional email for the contact form (fire-and-forget)                                |

## External Services

| Service              | Purpose                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| **GitHub**           | Source repository — pushes trigger Amplify auto-deploy                            |
| **Neon Postgres**    | Managed database (2 branches: dev + prod), PrismaNeon WebSocket adapter           |
| **Upstash Redis**    | Rate limiting for API routes (7+ route groups via @upstash/ratelimit)             |
| **Sentry**           | Error tracking — 3-tier setup (client SDK, server, edge), 10% trace sampling prod |
| **Google Analytics** | GA4 client-side analytics                                                         |
| **Anthropic Claude** | Haiku model for EN→JA content translation and certificate field extraction        |
| **MCP Server**       | 43-tool content management server (stdio transport, dev + prod instances)         |

## Flows

### 1. Public page request

User → WAF v2 (filter) → CloudFront → Amplify (SSR) → Neon Postgres (via Prisma WebSocket)

### 2. Static asset / image request

User → WAF v2 → CloudFront (assets distribution) → S3 (WebP images, immutable 1yr cache)

### 3. Admin authentication

Admin → Cognito Hosted UI → OAuth code flow → Amplify callback → HTTP-only JWT cookie set

### 4. Database access

Amplify → Neon Postgres via `@prisma/adapter-neon` (PrismaNeon WebSocket adapter, not HTTP)

### 5. Contact form email

User submits form → Amplify API route → rate limit check (Upstash) → SES → recipient inbox

### 6. Image upload (admin)

Admin uploads → Amplify API route → Sharp (4 variants: thumb/med/lg/original → WebP) → S3 → CloudFront

### 7. Error tracking (3-tier)

- Client: browser SDK → Sentry (client errors via `@sentry/nextjs`)
- Server: Amplify SSR → Sentry (server errors)
- Edge: proxy.ts → Sentry (edge errors)

### 8. Content translation (admin)

Admin triggers → Amplify API route → Anthropic Claude Haiku (prompt caching enabled) → translated content → Neon

### 9. Client analytics

Public User browser → Google Analytics (GA4)

### 10. CI/CD pipeline

GitHub push → Amplify auto-deploy (npm ci → prisma generate → prisma migrate deploy → next build)

### 11. MCP content management

MCP Server (stdio) → Amplify API routes (dev: localhost:3000, prod: asakurayuta.dev) → Neon Postgres

## Diagram changes (June 2026)

- Added GitHub as deploy trigger for Amplify
- Added MCP Server as external service with API connection
- WAF sized to full 78x78 icon, properly connected in front of CloudFront
- Neon label updated to show WebSocket adapter
- Sentry label updated to show 3-tier setup (client, server, edge)
- Split Sentry edges: client errors (from user) + server/edge errors (from Amplify)
- Standardized all font colors to `#232F3E`
- Added legend entries for external server and user/browser icons

## Edge styles in diagram

- **Solid line** — primary request/response flow
- **Dashed line** — async or internal service-to-service call
- **Red line** — authentication flow (Cognito OAuth)
- **Server icon** — external (non-AWS) service
- **Client icon** — user / browser
