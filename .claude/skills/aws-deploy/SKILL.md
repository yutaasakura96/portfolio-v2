---
name: aws-deploy
description: Use for AWS Amplify deployments, environment variable changes, S3/CloudFront/SES/Cognito operations, and post-deploy verification. References .claude/docs/infrastructure.md for the live environment snapshot. Treats production as production — confirms before mutating shared state.
---

# AWS Deploy Skill

This project deploys to AWS Amplify Hosting Gen 1 (SSR Lambda) with a specific stack of supporting services. Read [.claude/docs/infrastructure.md](../../docs/infrastructure.md) before any operation that mutates AWS state — it's the source of truth for IDs, ARNs, and current configuration.

## When to use

- Deploying a change to production.
- Adding/changing/rotating an environment variable in Amplify Console.
- Investigating a failed deploy.
- Inspecting CloudWatch logs.
- Rotating IAM keys (`portfolio-admin`).
- Verifying S3, CloudFront, SES, or Cognito state.
- Pre-deploy and post-deploy checks.

## Key facts (cite [infrastructure.md](../../docs/infrastructure.md) for full detail)

| Resource            | ID / value                                                |
| ------------------- | --------------------------------------------------------- |
| Account             | `757278011198`                                            |
| Region (primary)    | `ap-southeast-1`                                          |
| Amplify app         | `d2v4laatjpx2hq`                                          |
| Production branch   | `main`                                                    |
| Apex domain         | `asakurayuta.dev`                                         |
| S3 bucket (images)  | `portfolio-v2-images-1771574702`                          |
| CloudFront (assets) | `E6T76ADR3JLQH` (`d11brb6l7qspvw.cloudfront.net`)         |
| Cognito user pool   | `ap-southeast-1_SgDbuA78J`                                |
| Cognito app client  | `2iug05u34tocpscs29ajt1n1uo`                              |
| App IAM user        | `portfolio-admin` (least-privilege inline policy)         |
| SES sender          | `noreply@asakurayuta.dev`                                 |
| DB                  | Neon Postgres (NOT AWS) — `ap-southeast-1`, branch `main` |

Env vars use `APP_AWS_*` prefix (Amplify reserves `AWS_*`).

## Deploy workflow

1. Ensure local checks pass:
   ```bash
   npm run type-check
   npm run lint
   npm run build       # only if you want full confidence — slow
   ```
2. Push to `main` (or merge a PR). Amplify auto-builds.
3. Watch the build:
   ```bash
   aws amplify list-jobs --app-id d2v4laatjpx2hq --branch-name main --region ap-southeast-1 --max-results 5
   aws amplify get-job --app-id d2v4laatjpx2hq --branch-name main --job-id <id> --region ap-southeast-1
   ```
4. After `SUCCEED`, run post-deploy checks (below).

## Pre-deploy checks

Before merging a PR that includes:

- **Schema migration:** verify the migration was branch-tested (see `prisma-neon` skill). Confirm `DIRECT_URL` in Amplify Console points at the same Neon project.
- **New env var:** add it to Amplify Console FIRST (otherwise the build can't reference it). Then merge.
- **CSP change in `customHttp.yml`:** ensure no new third-party script/host is missing from `script-src`/`connect-src`/etc.
- **AWS SDK calls in new code:** verify the IAM action is in `portfolio-admin`'s inline policy (`portfolio-v2-app-least-privilege`). If not, expand the policy first.
- **Cookie / auth changes:** test `/admin/login` flow on a preview / `main.d2v4laatjpx2hq.amplifyapp.com` before relying on the apex domain.

## Post-deploy verification

```bash
# 1. Site responds
curl -sI https://asakurayuta.dev/ | head -5

# 2. API responds
curl -s https://asakurayuta.dev/api/projects | head -c 200

# 3. CloudFront serving images
curl -sI https://d11brb6l7qspvw.cloudfront.net/<known-key>.webp | head -5

# 4. CloudWatch logs (last 10 min)
aws logs tail /aws/amplify/d2v4laatjpx2hq --since 10m --region ap-southeast-1
```

If the `aws` MCP server is installed, prefer it for log queries — it wraps these commands with structured output.

## Environment variables

All vars live in Amplify Console (NOT in SSM Parameter Store — Amplify Hosting Gen 1 SSR doesn't inject Console Secrets at runtime; only Console env vars). The build's `preBuild` step in [amplify.yml](../../../amplify.yml) materializes them into `.env.production`.

To add or change:

```bash
# List current
aws amplify list-apps --region ap-southeast-1   # find the env on the app
aws amplify get-app --app-id d2v4laatjpx2hq --region ap-southeast-1 \
  --query 'app.environmentVariables'

# Update (CAUTION: this replaces the entire env var map)
aws amplify update-app --app-id d2v4laatjpx2hq --region ap-southeast-1 \
  --environment-variables 'KEY1=val1,KEY2=val2,...'
```

Easier path: update via the Amplify Console UI to avoid replacing the map. After changing env vars, **trigger a new build** — the change isn't picked up until then.

`.env.example` has known drift (uses `AWS_*` instead of `APP_AWS_*`, missing `COGNITO_REGION`, etc.). Treat [.claude/docs/infrastructure.md](../../docs/infrastructure.md) as authoritative for which vars exist.

## IAM key rotation (`portfolio-admin`)

Zero-downtime rotation:

```bash
# 1. Create new key
aws iam create-access-key --user-name portfolio-admin
# (note the new AccessKeyId / SecretAccessKey)

# 2. Update Amplify env vars APP_AWS_ACCESS_KEY_ID / APP_AWS_SECRET_ACCESS_KEY (Console)

# 3. Trigger an Amplify build to pick up the new keys

# 4. Verify the deploy is healthy (post-deploy checks above)

# 5. Deactivate the old key
aws iam update-access-key --user-name portfolio-admin --access-key-id <OLD_KEY> --status Inactive

# 6. After 24-48h with no errors, delete the old key
aws iam delete-access-key --user-name portfolio-admin --access-key-id <OLD_KEY>
```

Confirm with the user before each step that mutates state.

## CloudFront cache invalidation

Rarely needed — assets are versioned by file ID in the S3 key. If you do need to bust:

```bash
aws cloudfront create-invalidation --distribution-id E6T76ADR3JLQH --paths "/*"
```

Charges apply per path after the free tier. Use targeted paths when possible.

## Things to confirm before doing them

- **Force-deploy from a branch other than `main`** — only `main` is wired to production; introducing a new branch deploy needs explicit user approval.
- **Editing `customHttp.yml`** — controls security headers; CSP misconfiguration breaks the site.
- **Editing the bucket policy or CORS** — image delivery breaks on misconfig.
- **Cognito user pool changes** — token validity, callback URLs, app client config. A bad change locks admins out.
- **Domain / certificate changes** — propagation can take minutes to hours.
- **Deleting the orphaned `AmplifySSRLoggingRole-791d5dcf-…`** — confirm via console that nothing references it before delete.

## Things to refuse

- Any operation on a production resource without an explicit pre-deploy / post-deploy verification plan.
- Editing the Cognito user pool's `AllowAdminCreateUserOnly` flag (would enable self-signup).
- Force-pushing to `main` (Amplify auto-deploys main; force-push can deploy half-broken state).
- Disabling the Amplify managed cert validation.

## Reference

- [.claude/docs/infrastructure.md](../../docs/infrastructure.md) — full snapshot, including useful re-audit commands at the bottom.
- [amplify.yml](../../../amplify.yml) — build spec.
- [customHttp.yml](../../../customHttp.yml) — security headers + CSP.
- [next.config.ts](../../../next.config.ts) — Next config including `images.remotePatterns`.
