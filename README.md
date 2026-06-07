# Portfolio v2

Personal portfolio + admin CMS. Public-facing Next.js site backed by an admin dashboard, deployed to AWS Amplify with Neon Postgres.

Live: [asakurayuta.dev](https://asakurayuta.dev)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` at the repo root. The canonical list of variables (database URL, Cognito, S3/CloudFront, SES, Upstash, Sentry) lives in [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md) under **Environment Variables**. `.env.example` is kept as a reference but has known drift; treat the infrastructure doc as the source of truth.

3. Generate the Prisma client and apply migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate:dev
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Commands

| Task                    | Command                         |
| ----------------------- | ------------------------------- |
| Dev server              | `npm run dev`                   |
| Build (incl. lint)      | `npm run build`                 |
| Lint + format           | `npm run lint`                  |
| Type check              | `npm run type-check`            |
| Bundle analyze          | `npm run analyze`               |
| Prisma generate         | `npm run prisma:generate`       |
| Prisma migrate (dev)    | `npm run prisma:migrate:dev`    |
| Prisma migrate (deploy) | `npm run prisma:migrate:deploy` |
| Prisma studio           | `npm run prisma:studio`         |
| Seed                    | `npx prisma db seed`            |
| Test                    | `npm test`                      |
| Test (CI + coverage)    | `npm run test:ci`               |

## Architecture

See [CLAUDE.md](CLAUDE.md) for the primary Claude Code project guidance. [AGENTS.md](AGENTS.md) mirrors the same conventions for Codex backup sessions. Scoped instructions live in [src/CLAUDE.md](src/CLAUDE.md), [src/app/api/CLAUDE.md](src/app/api/CLAUDE.md), and [prisma/CLAUDE.md](prisma/CLAUDE.md).

## Current Surface

- Public routes: `/`, `/about`, `/projects`, `/projects/[slug]`, `/blog`, `/blog/[slug]`, `/contact`.
- Admin routes: `/admin/login` plus CMS sections for dashboard, hero, about, projects, blog, skills, experience, education, certifications, messages, settings, and import/export.
- API routes cover entity CRUD, reorder, import/export, contact, uploads, auth callback/session refresh/sign-out, dashboard stats, and admin API keys.
- Content models in Prisma: hero, projects, blog posts, skill categories/skills, experience, education, certifications, contact messages, about page, site settings, and API keys.

## Deployment

Deployed to **AWS Amplify Hosting Gen 1** (SSR) with **Neon Postgres** as the primary database. The build pipeline is defined in [amplify.yml](amplify.yml):

- Materializes Amplify Console env vars into `.env.production` at build time.
- Runs `prisma generate` and `prisma migrate deploy`.
- Builds the Next.js app.

Security response headers (HSTS, CSP, X-Frame-Options, etc.) are configured in [customHttp.yml](customHttp.yml). Runtime cache headers are set in [next.config.ts](next.config.ts). Full AWS infrastructure details: [.claude/docs/infrastructure.md](.claude/docs/infrastructure.md).

## License

Private — All rights reserved.
