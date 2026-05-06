# Portfolio v2 — AWS Infrastructure

> **Source of truth.** Snapshot taken from live AWS via CLI on 2026-05-06. Re-run the queries below if anything looks stale.
>
> **Account:** `757278011198` · **Primary region:** `ap-southeast-1` (Singapore) · **Billing region for global services:** `us-east-1`
>
> **Sensitive values (access keys, client secrets, DB passwords) are redacted.** Pull them from the AWS console or `aws iam`/`aws amplify get-app` directly when needed.

---

## IAM

### Human / programmatic users

| User | Type | Credentials | Permissions | Notes |
|---|---|---|---|---|
| `yuta` | Developer (you) | Console password + 1 active access key (`AKIA…OHV`, created 2026-03-28) | Member of `admin` group (full admin) | Used for local dev + CLI work. No inline/attached policies — perms come from `admin` group. |
| `portfolio-admin` | App runtime | 1 active access key (`AKIA…BCT`, created 2026-02-20) — credentials embedded in Amplify env vars `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` | Inline policy `portfolio-v2-app-least-privilege` | This is what the SSR Lambda uses to call S3 + SES at runtime. See policy below. |
| `WinSCPUser` | Unused | 1 active access key (`AKIA…RQ3`, created 2025-09-04) | None (no policies, no groups) | **Dead account.** Predates this project. Recommend deactivating the key and deleting the user. |

### `portfolio-v2-app-least-privilege` (inline policy on `portfolio-admin`)

Properly scoped least-privilege:

- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `arn:aws:s3:::portfolio-v2-images-1771574702/*`
- `s3:ListBucket` on the bucket
- `ses:SendEmail`, `ses:SendRawEmail` on `*` with condition `ses:FromAddress = noreply@asakurayuta.dev`

### Roles

| Role | Trust | Purpose |
|---|---|---|
| `AmplifySSRLoggingRole-d0804d1f-…` | `amplify.amazonaws.com` | **In use** by app `d2v4laatjpx2hq`. Attached managed policy `AmplifySSRLoggingPolicy-…` (CloudWatch Logs write to `/aws/amplify/*`) + inline `AmplifyConsoleSecretsAccess` (`ssm:GetParametersByPath` on `/amplify/d2v4laatjpx2hq/*` — currently unused; see Env Vars note). |
| `AmplifySSRLoggingRole-791d5dcf-…` | `amplify.amazonaws.com` | **Orphaned.** Created at the same time as the in-use one; not attached to any current app. Safe to delete after confirming. |

### Service-linked roles (AWS-managed; do not touch)

`AWSServiceRoleForComputeOptimizer`, `AWSServiceRoleForCostOptimizationHub`, `AWSServiceRoleForIPAM`, `AWSServiceRoleForRDS`, `AWSServiceRoleForResourceExplorer`, `AWSServiceRoleForSupport`, `AWSServiceRoleForTrustedAdvisor`.

### Roles vs long-lived keys

The Amplify SSR runtime **does not assume an IAM role for app code** — it uses the long-lived access key pair stored in env vars. This is a known limitation of Amplify Hosting Gen 1 (the SSR Lambda's execution role is the `AmplifySSRLoggingRole`, which intentionally has no S3/SES permissions). See [Security Posture](#security-posture).

---

## Amplify

### App: `portfolio-v2`

- **App ID:** `d2v4laatjpx2hq`
- **ARN:** `arn:aws:amplify:ap-southeast-1:757278011198:apps/d2v4laatjpx2hq`
- **Platform:** `WEB_COMPUTE` (Next.js SSR, framework auto-detected as `Next.js - SSR`)
- **Repo:** `https://github.com/yutaasakura96/portfolio-v2` (token-based clone)
- **Service role:** `AmplifySSRLoggingRole-d0804d1f-…` (for build + log shipping)
- **Compute size:** `STANDARD_8GB`
- **Cache config:** `AMPLIFY_MANAGED_NO_COOKIES`
- **Auto branch creation:** disabled · **Auto branch deletion:** disabled · **Basic auth:** disabled

### Build configuration

The build spec is embedded in the app config but is also kept in [amplify.yml](amplify.yml) at the repo root. The repo version is the editable source; on each push, Amplify uses what's checked in. The repo `amplify.yml` performs an extra step before `npm ci`: it generates a `.env.production` file by reading the Amplify Console env vars (because Amplify Hosting Gen 1's SSR Lambda runtime doesn't auto-inject Console env vars at request time — only at build time).

Custom HTTP headers (HSTS, CSP, X-Frame-Options, etc.) live in [customHttp.yml](customHttp.yml) and are applied by Amplify automatically.

**Custom rewrite rule:** `/<*>` → `/index.html` (status `404-200`) — SPA fallback.

### Branch mapping

| Branch | Stage | Auto-build | Last deploy | Custom domain subdomain |
|---|---|---|---|---|
| `main` | `PRODUCTION` | ✅ | 2026-04-02 (`SUCCEED`) | apex (`asakurayuta.dev`) + `www` |

Only `main` exists in Amplify. PR previews are disabled. Performance mode disabled. Branch TTL 5 min.

### Custom domain & SSL

- **Domain:** `asakurayuta.dev` — status `AVAILABLE`
- **Cert:** Amplify-managed (ACM, auto-renewed). Validation CNAME: `_cb1edeb145a308a4f6392f763ee2570f.asakurayuta.dev`.
- **Subdomains:**
  - apex `asakurayuta.dev` → CNAME `d1lkmx2xrzvinf.cloudfront.net` (status `verified: false` — apex CNAME is non-standard; works if served via ALIAS at the registrar, otherwise this row may be informational only)
  - `www.asakurayuta.dev` → CNAME `d1lkmx2xrzvinf.cloudfront.net` (`verified: true`)
- **Default Amplify domain:** `https://main.d2v4laatjpx2hq.amplifyapp.com`
- **Amplify-managed CloudFront distribution:** `d1lkmx2xrzvinf.cloudfront.net` (owned by Amplify, not directly listable in our `cloudfront list-distributions` output — managed by the service)

### Environment variables (Amplify Console)

All vars below are stored as **plain Amplify Console env vars** (not Console Secrets — Hosting Gen 1 SSR doesn't support secret injection at runtime). They are encrypted at rest but visible to anyone with Amplify console read access.

| Variable | Source/Maps to | Notes |
|---|---|---|
| `AMPLIFY_DOMAIN` | `https://main.d2v4laatjpx2hq.amplifyapp.com` | Amplify default URL |
| `APP_AWS_REGION` | `ap-southeast-1` | App-level AWS region (the `APP_` prefix is required because Amplify reserves the `AWS_*` namespace) |
| `APP_AWS_ACCESS_KEY_ID` | `portfolio-admin` IAM user key | **REDACTED — secret** |
| `APP_AWS_SECRET_ACCESS_KEY` | `portfolio-admin` IAM user key | **REDACTED — secret** |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E6T76ADR3JLQH` | Assets CDN |
| `CLOUDFRONT_DOMAIN` | `d11brb6l7qspvw.cloudfront.net` | Assets CDN domain |
| `COGNITO_USER_POOL_ID` | `ap-southeast-1_SgDbuA78J` | |
| `COGNITO_CLIENT_ID` | `2iug05u34tocpscs29ajt1n1uo` | |
| `COGNITO_CLIENT_SECRET` | App client secret | **REDACTED — secret** |
| `COGNITO_DOMAIN` | `ap-southeast-1sgdbua78j.auth.ap-southeast-1.amazoncognito.com` | Hosted UI domain |
| `COGNITO_REGION` | `ap-southeast-1` | |
| `CONTACT_EMAIL` | `yuta.asakura.se@gmail.com` | Inbound contact form recipient |
| `DATABASE_URL` | Neon pooled URL | **REDACTED — contains DB password** |
| `DIRECT_URL` | Neon direct URL | **REDACTED — contains DB password.** Used only by `prisma migrate deploy` during build. |
| `NEXT_PUBLIC_APP_URL` | `https://asakurayuta.dev` | Exposed to client |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | `https://d11brb6l7qspvw.cloudfront.net` | Exposed to client |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | `2iug05u34tocpscs29ajt1n1uo` | Exposed to client |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | `ap-southeast-1sgdbua78j.auth.ap-southeast-1.amazoncognito.com` | Exposed to client |
| `S3_BUCKET_NAME` | `portfolio-v2-images-1771574702` | |
| `S3_REGION` | `ap-southeast-1` | |
| `SES_FROM_EMAIL` | `noreply@asakurayuta.dev` | Must match the SES condition in `portfolio-admin` policy |

---

## S3

### `portfolio-v2-images-1771574702` (region: `ap-southeast-1`)

The application's image bucket — uploads, thumbnails, all WebP-converted assets.

- **Created:** 2026-04-23
- **Public access:** all four block flags `true` (BlockPublicAcls, IgnorePublicAcls, BlockPublicPolicy, RestrictPublicBuckets)
- **Encryption:** SSE-S3 (`AES256`), bucket key disabled
- **Versioning:** Enabled
- **Lifecycle rules:** **None.** Versioning is on but nothing expires old versions — unbounded storage growth risk.
- **Object key pattern (per CLAUDE.md):** `{folder}/{entityId}/{variant}_{fileId}.webp`

**Bucket policy** restricts `s3:GetObject` to the CloudFront distribution only:

```json
{
  "Sid": "AllowCloudFrontServicePrincipal",
  "Effect": "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::portfolio-v2-images-1771574702/*",
  "Condition": { "ArnLike": { "AWS:SourceArn": "arn:aws:cloudfront::757278011198:distribution/E6T76ADR3JLQH" } }
}
```

Application reads/writes go through `portfolio-admin` IAM credentials (not the bucket policy).

**CORS:**

- Allowed methods: `PUT`, `GET`
- Allowed origins: `http://localhost:3000`, `https://*.amplifyapp.com`, `https://asakurayuta.dev`, `https://www.asakurayuta.dev`
- Allowed headers: `*`
- Max age: 3600 s

### `elasticbeanstalk-us-east-1-757278011198`

Legacy Elastic Beanstalk artifact bucket from another project. **Not used by this app.** Safe to ignore (or delete, if no EB env still references it).

### CDN integration

`portfolio-v2-images-1771574702` is fronted by CloudFront `E6T76ADR3JLQH` via Origin Access Control `E38365GGJC8PZO`. Direct S3 reads are blocked by the bucket policy.

---

## CloudFront

### Distribution `E6T76ADR3JLQH` — assets CDN

- **Domain:** `d11brb6l7qspvw.cloudfront.net`
- **Aliases:** none (served only as the raw CloudFront domain via `NEXT_PUBLIC_CLOUDFRONT_URL`)
- **Status:** `Deployed` · **Enabled:** true · **HTTP/2** · **IPv6:** on · **Price class:** `PriceClass_All`

#### Origin

- **ID:** `portfolio-v2-images-1771574702.s3.ap-southeast-1.amazonaws.com-mlumh265yuk`
- **Domain:** `portfolio-v2-images-1771574702.s3.ap-southeast-1.amazonaws.com`
- **Type:** S3 origin (`S3OriginConfig`) with **Origin Access Control** `E38365GGJC8PZO` (modern OAC, not legacy OAI)
- Connection: 3 attempts, 10 s timeout · Origin Shield: off

#### Default cache behavior

- **Allowed methods:** `GET`, `HEAD` only
- **Viewer protocol:** `redirect-to-https`
- **Compression:** enabled (gzip + brotli)
- **Cache policy:** AWS-managed `Managed-CachingOptimized` (`658327ea-f89d-4fab-a63d-7e88639e58f6`) — DefaultTTL 1 day, MaxTTL 1 year, MinTTL 1 s, no headers/cookies/query strings in cache key
- No Lambda@Edge / CloudFront Functions associations

#### Custom error pages

**None configured.** S3 404s pass through as-is.

#### TLS

- `CloudFrontDefaultCertificate: true` (uses `*.cloudfront.net` cert) — no custom alias is needed since assets are served via the raw CloudFront domain.

#### WAF

- WebACL: `arn:aws:wafv2:us-east-1:757278011198:global/webacl/CreatedByCloudFront-0b707297/3d9d163b-…` (auto-created by CloudFront when "Enable security protections" was toggled on).

### Amplify-managed distribution `d1lkmx2xrzvinf.cloudfront.net`

Fronts the `asakurayuta.dev` site. Owned and managed by Amplify Hosting — not visible in `aws cloudfront list-distributions` for our account. Configuration is controlled via the Amplify domain association, not directly.

---

## Cognito

### User pool: `portfolio-v2-admin` (`ap-southeast-1_SgDbuA78J`)

- **Tier:** `ESSENTIALS`
- **ARN:** `arn:aws:cognito-idp:ap-southeast-1:757278011198:userpool/ap-southeast-1_SgDbuA78J`
- **Username attribute:** `email` (case-insensitive)
- **Auto-verified attributes:** `email`
- **Estimated users:** 1
- **MFA:** **OFF**
- **Deletion protection:** ACTIVE
- **Self-signup:** disabled (`AllowAdminCreateUserOnly: true`) — admins create users only
- **Verification:** email code (`CONFIRM_WITH_CODE`)
- **Email sending:** `COGNITO_DEFAULT` (Cognito-managed, not via SES)

**Password policy:** min 8 chars, requires upper + lower + number + symbol; temp password validity 7 days.

**Account recovery:** verified email (priority 1), verified phone (priority 2).

### App client: `portfolio-v2-admin` (`2iug05u34tocpscs29ajt1n1uo`)

- **Client secret:** present (REDACTED)
- **Token validity:** access 60 min · ID 60 min · refresh 5 days · auth session 3 min
- **Token revocation:** enabled
- **Existence-error prevention:** enabled
- **Auth flows:** `ALLOW_REFRESH_TOKEN_AUTH`, `ALLOW_USER_AUTH`, `ALLOW_USER_SRP_AUTH`
- **Identity providers:** `COGNITO`
- **OAuth:**
  - Flow: `code`
  - Scopes: `email`, `openid`, `profile`
  - Default redirect: `https://asakurayuta.dev/api/auth/callback`
  - Callback URLs: `http://localhost:3000/api/auth/callback`, `https://asakurayuta.dev/api/auth/callback`, `https://www.asakurayuta.dev/api/auth/callback`, `https://main.d2v4laatjpx2hq.amplifyapp.com/api/auth/callback`
  - Logout URLs: same four origins (without `/api/auth/callback`)

### Hosted UI domain

- **Domain:** `ap-southeast-1sgdbua78j.auth.ap-southeast-1.amazoncognito.com` (Cognito-prefix domain, not custom)
- **Managed Login version:** 2 (new hosted UI)
- **Backed by:** internal CloudFront `d3ownpzpj4jdb9.cloudfront.net`

---

## SES

- **Region:** `ap-southeast-1`
- **Production access:** **GRANTED** (case `177380153100260`)
- **Sending enabled:** yes · **Enforcement:** `HEALTHY`
- **Quota:** 50,000 emails / 24h · 14 messages / sec
- **Mail type:** `TRANSACTIONAL`

### Verified identities

| Identity | Type | Status | DKIM | MAIL FROM |
|---|---|---|---|---|
| `asakurayuta.dev` | Domain | `SUCCESS` | RSA 2048, signing enabled, `SUCCESS` (3 tokens) | `mail.asakurayuta.dev` (`SUCCESS`) |
| `yuta.asakura.se@gmail.com` | Email address | `SUCCESS` | n/a | n/a |

Suppression list reasons enabled: `BOUNCE`, `COMPLAINT`. Feedback forwarding on for the domain identity.

The app sends as `noreply@asakurayuta.dev` (the only `FromAddress` allowed by the `portfolio-admin` IAM policy).

---

## Environment Variables

### Where each var lives

- **Local dev (`.env`):** present (`.env`, 5.1 KB). Not in git.
- **Local docs (`.env.example`):** committed template — see notes below for drift.
- **Production:** Amplify Console env vars on app `d2v4laatjpx2hq`. They're materialized into a `.env.production` file at build time by the `preBuild` step in [amplify.yml](amplify.yml) (Hosting Gen 1 limitation: SSR Lambdas don't get Console env vars injected at request time).

### Mapping: env var → AWS resource

| Var | AWS resource |
|---|---|
| `S3_BUCKET_NAME` | S3 bucket `portfolio-v2-images-1771574702` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront `E6T76ADR3JLQH` |
| `CLOUDFRONT_DOMAIN` / `NEXT_PUBLIC_CLOUDFRONT_URL` | `d11brb6l7qspvw.cloudfront.net` |
| `COGNITO_USER_POOL_ID` | Cognito pool `ap-southeast-1_SgDbuA78J` |
| `COGNITO_CLIENT_ID` / `NEXT_PUBLIC_COGNITO_CLIENT_ID` | App client `2iug05u34tocpscs29ajt1n1uo` |
| `COGNITO_DOMAIN` / `NEXT_PUBLIC_COGNITO_DOMAIN` | Cognito hosted UI `ap-southeast-1sgdbua78j` |
| `COGNITO_CLIENT_SECRET` | App client secret on `2iug05u34tocpscs29ajt1n1uo` |
| `APP_AWS_ACCESS_KEY_ID` / `APP_AWS_SECRET_ACCESS_KEY` | Access key `AKIA…BCT` on IAM user `portfolio-admin` |
| `SES_FROM_EMAIL` | Must equal `noreply@asakurayuta.dev` (gated by IAM policy) |
| `DATABASE_URL` / `DIRECT_URL` | Neon Postgres (not AWS) — `ep-wandering-butterfly-a1v6y74z` in `ap-southeast-1` |

### Drift between `.env.example` and Amplify Console

| Issue | Detail |
|---|---|
| Variable name mismatch | `.env.example` uses `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`. Amplify (and the production runtime) use the `APP_AWS_*` prefix because Amplify Hosting reserves `AWS_*`. **Risk:** local dev that copies `.env.example` will not match production var names; SDK code that reads `APP_AWS_*` won't find creds locally. Either rename in `.env.example` to match Amplify, or read both. |
| Missing from `.env.example` | `COGNITO_REGION`, `AMPLIFY_DOMAIN`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `NEXT_PUBLIC_COGNITO_DOMAIN` are set in Amplify but not documented in the template. |
| Placeholder values out of date | `S3_BUCKET_NAME="portfolio-images-bucket"` in `.env.example` doesn't match the real `portfolio-v2-images-…` pattern. Cosmetic but misleading. |

---

## Security Posture

### Strong points

- **S3 is properly locked down.** Public access fully blocked, bucket policy restricts read to one CloudFront distribution via OAC. Versioning on. SSE-AES256 default.
- **`portfolio-admin` follows least privilege.** Scoped to one bucket and one SES `FromAddress`. No `*` resources for sensitive actions.
- **Cognito is hardened for an admin pool.** Self-signup off, deletion protection on, strong password policy, `PreventUserExistenceErrors` on, token revocation on, short access/ID token lifetimes (60 min).
- **TLS + HTTP security headers are well configured.** [customHttp.yml](customHttp.yml) sets HSTS (preload, 2-year max-age), CSP with explicit allowlists, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **CloudFront uses modern OAC** (not legacy OAI) and has WAF v2 attached.
- **SES is in production access** with reasonable quotas; sending domain has DKIM + custom MAIL FROM.

### Concerns (ranked)

1. **Long-lived AWS access keys for the app runtime.** `portfolio-admin` access key `AKIA…BCT` (created 2026-02-20) is the single credential the SSR Lambda uses for every S3 + SES call. This is a known Amplify Hosting Gen 1 limitation — the SSR runtime cannot assume an IAM role. **Mitigations:** rotate the key on a schedule (none today), or migrate to Amplify Hosting Gen 2 / a different deploy target where the function execution role can hold the S3+SES permissions directly.
2. **Secrets stored as plain Amplify Console env vars.** `APP_AWS_SECRET_ACCESS_KEY`, `COGNITO_CLIENT_SECRET`, `DATABASE_URL` (with Neon password), `DIRECT_URL` are all in the Amplify Console — encrypted at rest but readable by anyone with Amplify console read access. The `AmplifyConsoleSecretsAccess` inline policy on the SSR role *would* allow reading `/amplify/d2v4laatjpx2hq/*` SSM parameters (Console Secrets), but Hosting Gen 1's SSR runtime doesn't inject them, so the workaround in `amplify.yml` is to bake them into a build-time `.env.production` instead. Same exposure surface.
3. **Unused IAM user `WinSCPUser` with an active access key.** Created 2025-09-04, never rotated, no policies, no recent activity. Delete the access key (or the user) to shrink the credential surface.
4. **Orphaned IAM role `AmplifySSRLoggingRole-791d5dcf-…`.** Not attached to any current Amplify app. Safe to delete after confirming.
5. **No secret rotation cadence.** Access key ages: `portfolio-admin` ~2.5 months, `yuta` ~1 month, `WinSCPUser` ~8 months. Cognito client secret created 2026-02-20, never rotated. Database password never rotated. There's no documented rotation policy.
6. **Cognito MFA is OFF.** For an admin-only pool with a single user, password + email recovery is the only barrier. Enabling TOTP MFA would meaningfully harden admin access.
7. **No S3 lifecycle rules.** Versioning is on, so deleted/overwritten objects accumulate forever. Add a rule to expire noncurrent versions (e.g. after 90 days) and abort incomplete multipart uploads (after 7 days).
8. **CloudFront access logging is disabled.** Limits forensic ability if the assets endpoint is abused.
9. **`yuta` user has full admin via the `admin` group.** Fine for solo dev, but worth noting that there is no separation between developer and root-level operations. MFA on this account is essential (status not visible from the API used here — verify in the console).

### Useful commands for re-audit

```bash
# Re-verify infrastructure state
aws sts get-caller-identity
aws amplify list-apps --region ap-southeast-1
aws amplify get-app --app-id d2v4laatjpx2hq --region ap-southeast-1
aws s3api get-bucket-policy --bucket portfolio-v2-images-1771574702
aws cloudfront get-distribution-config --id E6T76ADR3JLQH
aws cognito-idp describe-user-pool --user-pool-id ap-southeast-1_SgDbuA78J --region ap-southeast-1
aws sesv2 list-email-identities --region ap-southeast-1
aws iam get-user-policy --user-name portfolio-admin --policy-name portfolio-v2-app-least-privilege

# Rotate portfolio-admin key (zero-downtime: create new, update Amplify env, deactivate old, then delete)
aws iam create-access-key --user-name portfolio-admin
# update APP_AWS_ACCESS_KEY_ID / APP_AWS_SECRET_ACCESS_KEY in Amplify console, redeploy
aws iam update-access-key --user-name portfolio-admin --access-key-id AKIA…BCT --status Inactive
aws iam delete-access-key --user-name portfolio-admin --access-key-id AKIA…BCT
```
