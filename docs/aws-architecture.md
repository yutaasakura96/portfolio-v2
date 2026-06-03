# Portfolio v2 — AWS Infrastructure Diagram

**File:** `docs/aws-architecture.drawio`
**Last updated:** June 2026

## Services

| Service                       | Purpose                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| **Amazon CloudFront**         | CDN — serves pages (proxied to Amplify) and static assets/images (from S3) |
| **AWS Amplify Hosting Gen 1** | SSR hosting for the Next.js 16 application                                 |
| **Amazon S3**                 | Image storage — uploads are processed via Sharp → WebP before storage      |
| **Amazon Cognito**            | Admin authentication — Hosted UI with OAuth code flow, issues JWTs         |
| **Amazon SES**                | Transactional email for the contact form                                   |
| **Neon Postgres**             | External managed database, connected via Prisma serverless adapter         |

## Flows

### 1. Public page request

User → CloudFront → Amplify (SSR) → renders page with data from Neon Postgres

### 2. Static asset / image request

User → CloudFront → S3 (WebP images, JS/CSS bundles)

### 3. Admin authentication

Admin → Cognito Hosted UI → OAuth callback → Amplify sets HTTP-only JWT cookie

### 4. Database access

Amplify → Neon Postgres via `@prisma/adapter-neon` (serverless WebSocket connection)

### 5. Contact form email

User submits form → Amplify API route → SES → recipient inbox

### 6. Image upload (admin)

Admin uploads image → Amplify API route → Sharp processing (WebP) → S3 → served via CloudFront URL

## Edge styles in diagram

- **Solid line** — primary request/response flow
- **Dashed line** — async or internal service-to-service call
- **Red line** — authentication flow (Cognito OAuth)
