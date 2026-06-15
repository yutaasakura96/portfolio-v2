# Portfolio v2 — AWS Infrastructure Diagram

**File:** `docs/aws-architecture.drawio`
**Last updated:** June 2026

## AWS Services

| Service                       | Purpose                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| **Amazon CloudFront**         | 2 distributions — Amplify-managed CDN for SSR pages + standalone CDN for S3 images/assets |
| **AWS WAF v2**                | Web ACL attached to the assets CloudFront distribution                                    |
| **AWS Amplify Hosting Gen 1** | SSR hosting for the Next.js 16 application                                                |
| **Amazon S3**                 | Image storage — uploads are processed via Sharp → WebP before storage                     |
| **Amazon Cognito**            | Admin authentication — Hosted UI with OAuth code flow, issues JWTs                        |
| **Amazon SES**                | Transactional email for the contact form                                                  |

## External Services

| Service              | Purpose                                                               |
| -------------------- | --------------------------------------------------------------------- |
| **Neon Postgres**    | Managed database, connected via Prisma serverless WebSocket adapter   |
| **Upstash Redis**    | Rate limiting for API routes (contact, upload, import, export)        |
| **Sentry**           | Error tracking — client-side (browser SDK) + server-side (SSR)        |
| **Google Analytics** | GA4 client-side analytics via gtag                                    |
| **Anthropic Claude** | AI API for EN→JA content translation and certificate field extraction |

## Flows

### 1. Public page request

User → CloudFront (Amplify-managed) → Amplify (SSR) → renders page with data from Neon Postgres

### 2. Static asset / image request

User → CloudFront (assets CDN, WAF-protected) → S3 (WebP images, JS/CSS bundles)

### 3. Admin authentication

Admin → Cognito Hosted UI → OAuth callback → Amplify sets HTTP-only JWT cookie

### 4. Database access

Amplify → Neon Postgres via `@prisma/adapter-neon` (serverless WebSocket connection)

### 5. Contact form email

User submits form → Amplify API route → rate limit check (Upstash Redis) → SES → recipient inbox

### 6. Image upload (admin)

Admin uploads image → Amplify API route → Sharp processing (WebP) → S3 → served via CloudFront URL

### 7. Error tracking

Amplify SSR → Sentry (server errors)
Public User browser → Sentry (client errors via `@sentry/nextjs` SDK)

### 8. Content translation (admin)

Admin triggers translation → Amplify API route → Anthropic Claude Haiku → translated content stored in Neon

### 9. Client analytics

Public User browser → Google Analytics (GA4 via gtag script)

## Edge styles in diagram

- **Solid line** — primary request/response flow
- **Dashed line** — async or internal service-to-service call
- **Red line** — authentication flow (Cognito OAuth)
- **Server icon** — external (non-AWS) service
