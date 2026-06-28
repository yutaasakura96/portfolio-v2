## Setup & Development

A step-by-step guide for cloning, configuring, and running the portfolio locally.

---

### Prerequisites {#prerequisites}

| Requirement       | Version / notes                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------- |
| Node.js           | LTS (20+)                                                                                               |
| npm               | Bundled with Node; `npm ci` is used in CI                                                               |
| Neon Postgres     | A Neon project with two branches: `production` (live data) and `dev` (local dev, child of prod)         |
| AWS account       | S3 bucket, CloudFront distribution, SES verified identity, Cognito user pool + app client               |
| Upstash Redis     | Optional — required for rate limiting on contact, upload, import, and export endpoints                  |
| Sentry project    | Optional — error tracking; the app runs without it, admin dashboard degrades gracefully when absent     |
| Anthropic API key | Optional — required for EN→JA translation and certificate image extraction; features degrade gracefully |

---

### Environment Variables {#environment-variables}

Copy `.env.example` to `.env` and fill in real values. Production variables are set in the Amplify Console and injected into `.env.production` at build time by `amplify.yml`.

> **`APP_AWS_*` prefix:** AWS Amplify Hosting reserves the `AWS_*` namespace. All app-side AWS credentials use the `APP_AWS_*` prefix (`APP_AWS_REGION`, `APP_AWS_ACCESS_KEY_ID`, `APP_AWS_SECRET_ACCESS_KEY`). Never use bare `AWS_*` names in application code.

> **Note:** `.env.example` has some drift from Amplify Console. Variables noted below marked _Amplify only_ are set in the console but not in the example file.

#### Database (Neon)

| Variable       | Purpose                                                              |
| -------------- | -------------------------------------------------------------------- |
| `DATABASE_URL` | Neon pooled connection URL — used by the app for all runtime queries |
| `DIRECT_URL`   | Neon direct (non-pooled) URL — used by Prisma for migrations only    |

#### AWS Core

| Variable                    | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `APP_AWS_REGION`            | AWS region for S3, SES, Cognito, and Amplify SDK calls             |
| `APP_AWS_ACCESS_KEY_ID`     | IAM access key ID for the `portfolio-admin` programmatic user      |
| `APP_AWS_SECRET_ACCESS_KEY` | IAM secret access key paired with `APP_AWS_ACCESS_KEY_ID`          |
| `S3_REGION`                 | Region of the S3 images bucket (_Amplify only_)                    |
| `S3_BUCKET_NAME`            | Name of the S3 bucket that stores uploaded images (_Amplify only_) |

#### CloudFront

| Variable                     | Purpose                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID — used when invalidating cached assets            |
| `CLOUDFRONT_DOMAIN`          | CloudFront domain (e.g. `dxxxxxxxxxx.cloudfront.net`) — used for CDN URLs    |
| `NEXT_PUBLIC_CLOUDFRONT_URL` | Public CloudFront URL embedded in the frontend bundle for image `src` values |

#### Cognito (Auth)

| Variable                             | Purpose                                                                |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `COGNITO_USER_POOL_ID`               | Cognito user pool ID — used for JWT verification on the server         |
| `COGNITO_CLIENT_ID`                  | Cognito app client ID — used in the OAuth code flow                    |
| `COGNITO_CLIENT_SECRET`              | Cognito app client secret — used server-side to exchange auth codes    |
| `COGNITO_REGION`                     | AWS region where the Cognito user pool lives                           |
| `COGNITO_DOMAIN`                     | Hosted UI domain (e.g. `your-domain.auth.region.amazoncognito.com`)    |
| `COGNITO_ALLOWED_CALLBACK_URL_LOCAL` | Allowed OAuth callback URL for local development                       |
| `COGNITO_ALLOWED_SIGNOUT_URL_LOCAL`  | Allowed sign-out redirect URL for local development                    |
| `COGNITO_ALLOWED_CALLBACK_URL_PROD`  | Allowed OAuth callback URL for production                              |
| `COGNITO_DEFAULT_REDIRECT_URL`       | Default post-login redirect (must match Cognito app client config)     |
| `COGNITO_ALLOWED_SIGNOUT_URL_PROD`   | Allowed sign-out redirect URL for production                           |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID`      | Client-side Cognito client ID (embedded in the frontend bundle)        |
| `NEXT_PUBLIC_COGNITO_DOMAIN`         | Client-side Cognito Hosted UI domain (embedded in the frontend bundle) |

#### SES (Email)

| Variable         | Purpose                                                           |
| ---------------- | ----------------------------------------------------------------- |
| `SES_FROM_EMAIL` | Verified SES sender address used for outbound contact-form emails |
| `CONTACT_EMAIL`  | Recipient address for inbound contact form submissions            |

#### Upstash Redis (Rate Limiting)

| Variable                   | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST endpoint — used by `src/lib/rate-limit.ts`   |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token — paired with `UPSTASH_REDIS_REST_URL` |

#### Sentry (Error Tracking)

| Variable                 | Purpose                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project DSN — public, embedded in the bundle; used by all three Sentry config files |
| `SENTRY_AUTH_TOKEN`      | Build-time only — used for source-map uploads; not needed at runtime                       |
| `SENTRY_ORG_SLUG`        | Sentry organization slug — used by the admin dashboard to fetch recent unresolved issues   |
| `SENTRY_PROJECT_SLUG`    | Sentry project slug — scopes dashboard issue queries alongside `SENTRY_ORG_SLUG`           |

#### Anthropic

| Variable            | Purpose                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `ANTHROPIC_API_KEY` | Claude Haiku API key — used for EN→JA content translation and certificate image extraction |

#### Analytics

| Variable              | Purpose                                                                             |
| --------------------- | ----------------------------------------------------------------------------------- |
| `GA_PROPERTY_ID`      | Google Analytics 4 property ID — used by the admin dashboard to link to GA4 metrics |
| `NEXT_PUBLIC_APP_URL` | Public app URL (set to `http://localhost:3000` locally)                             |

#### Amplify (Admin Dashboard)

| Variable         | Purpose                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `AMPLIFY_APP_ID` | Amplify app ID — used by the admin dashboard to fetch recent build status via the Amplify SDK |

#### Portfolio MCP Server

| Variable            | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `PORTFOLIO_API_KEY` | Bearer token for the local Portfolio MCP server (`mcp/portfolio-server`) |

#### Neon Branch Management

| Variable              | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `NEON_API_KEY`        | Neon API key — used by `scripts/neon-reset-dev.sh` and the GitHub Action |
| `NEON_PROJECT_ID`     | Neon project ID — identifies the Neon project in API calls               |
| `NEON_PROD_BRANCH_ID` | ID of the production Neon branch (source when resetting dev)             |
| `NEON_DEV_BRANCH_ID`  | ID of the dev Neon branch (target when resetting dev)                    |

#### Deployment / Test Helpers (Optional)

| Variable         | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `AMPLIFY_DOMAIN` | Amplify branch URL — useful when testing against a deployed branch |
| `TEST_EMAIL`     | Credentials for manual auth-flow testing only                      |
| `TEST_PASSWORD`  | Credentials for manual auth-flow testing only                      |

---

### Local Setup {#local-setup}

```bash
# 1. Clone the repository
git clone https://github.com/yutaasakura96/portfolio-v2.git
cd portfolio-v2

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env
# Edit .env and fill in all required values (see §Environment Variables above)

# 4. Generate the Prisma client
npm run prisma:generate

# 5. Apply migrations to your dev Neon branch
npm run prisma:migrate:dev

# 6. Start the development server
npm run dev
# → http://localhost:3000
```

The admin panel is at `/admin`. Sign in via the Cognito Hosted UI using the credentials configured in your Cognito user pool.

---

### Database Workflow {#database-workflow}

The project uses two Neon Postgres branches with separate data:

| Branch       | Used by            | Purpose                                                 |
| ------------ | ------------------ | ------------------------------------------------------- |
| `production` | AWS Amplify (prod) | Live data — credentials set in Amplify Console env vars |
| `dev`        | `localhost:3000`   | Local development — child branch of `production`        |

`DATABASE_URL` in `.env` points at the dev branch. Production credentials are never in `.env`.

#### Schema changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Format the schema
npm run prisma:format

# 3. Check migration status before creating a new one
npx prisma migrate status

# 4. Create and apply the migration to the dev branch
npm run prisma:migrate:dev -- --name descriptive_change_name

# 5. Regenerate the Prisma client
npm run prisma:generate

# 6. Type-check
npm run type-check
```

Production migrations run automatically when `main` is deployed — `prisma migrate deploy` is part of the Amplify build pipeline.

#### Resetting the dev branch from production

When you need to refresh dev with the latest production data:

```bash
npm run db:reset-dev
```

This calls `scripts/neon-reset-dev.sh`, which reads `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_PROD_BRANCH_ID`, and `NEON_DEV_BRANCH_ID` from `.env` and uses the Neon REST API to restore the dev branch from production. A GitHub Action (`.github/workflows/neon-reset-dev.yml`) runs the same reset automatically every Monday at 06:00 UTC and can be triggered manually.

> **Hard rule:** Never run `prisma migrate reset` — it drops all data. The db-agent is configured to refuse this without an explicit typed confirmation.

---

### Scripts {#scripts}

All scripts are defined in `package.json`. Run them with `npm run <script>`.

| Script                  | Purpose                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `dev`                   | Start the Next.js development server at `http://localhost:3000`                      |
| `build`                 | Run ESLint + Prettier, then produce a production Next.js build                       |
| `analyze`               | Production build with `@next/bundle-analyzer` enabled — outputs bundle size report   |
| `start`                 | Start the Next.js production server (requires a prior `build`)                       |
| `lint`                  | Run ESLint and Prettier (auto-formats files in place)                                |
| `type-check`            | Run `tsc --noEmit` — type-checks the project without emitting files                  |
| `test`                  | Run Vitest in interactive watch mode                                                 |
| `test:ci`               | Run Vitest once with v8 coverage — used in CI                                        |
| `prisma:generate`       | Regenerate the Prisma client from `prisma/schema.prisma`                             |
| `prisma:migrate:dev`    | Create a new migration and apply it to the dev database                              |
| `prisma:migrate:deploy` | Apply pending migrations to the target database (used in the Amplify build pipeline) |
| `prisma:studio`         | Open Prisma Studio — browser-based database viewer                                   |
| `prisma:format`         | Format and validate `prisma/schema.prisma`                                           |
| `postinstall`           | Automatically regenerates the Prisma client after `npm install`                      |
| `mcp:setup`             | Bootstrap the local Portfolio MCP server API key (`scripts/mcp-setup.ts`)            |
| `db:reset-dev`          | Restore the dev Neon branch from production via `scripts/neon-reset-dev.sh`          |

---

### Testing {#testing}

The project uses **Vitest 4.x** with `@testing-library/react` and `@testing-library/jest-dom`. Tests live next to the source files they cover (e.g. `src/lib/foo.ts` → `src/lib/foo.test.ts`).

```bash
# Watch mode — interactive development
npm test

# Single run with v8 coverage — used in CI
npm run test:ci
```

The full quality gate (lint + type-check + build + tests) is enforced as a pre-commit hook. You can run it manually with:

```bash
/check
```

This invokes the `check` skill, which runs ESLint, Prettier, `tsc --noEmit`, and the Vitest suite. All checks must pass before a commit is accepted.

CI (`.github/workflows/ci.yml`) runs the same gate on every PR to `main` or `develop`.
