# Tech Stack

This document explains the _why_ behind each major technology choice, describes the
Amplify build pipeline, and maps the AWS service topology. It does not duplicate the
environment-variable reference (see `setup.md`) or the API endpoint tables (see
`api-reference.md`).

---

## Tech Stack {#stack-rationale}

### Framework and rendering

| Choice                 | Version   | Why                                                                                                                                                                                                                                                       |
| ---------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js App Router** | `^16.2.2` | Server Components let public pages render on the server with zero client JS for static content, while Client Components handle interactive widgets. ISR with `revalidate` gives blog and project pages sub-second cache rebuilds without a full redeploy. |
| **React**              | `19.2.3`  | Required by Next.js 16. The React Compiler (enabled by default) eliminates the need for manual `useMemo`/`useCallback` in most components.                                                                                                                |
| **TypeScript**         | `^5`      | Strict mode throughout. The project has no `any` escapes in application code — Prisma's generated client and Zod's inferred types keep the entire data path type-safe end-to-end.                                                                         |

### Database

| Choice                                                      | Version                                               | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prisma**                                                  | `^7.4.1` (`@prisma/client`) / `^7.8.0` (`prisma` CLI) | Schema-first ORM with a generated, fully typed client. Migrations are SQL files committed to the repo, giving a reproducible history applied with `prisma migrate deploy` at build time.                                                                                                                                                                                                                                                           |
| **`PrismaNeon` WebSocket adapter** (`@prisma/adapter-neon`) | `^7.4.1`                                              | Amplify Hosting Gen 1 SSR runs in a Lambda where each invocation opens a fresh connection. The `PrismaNeon` WebSocket adapter uses Neon's WebSocket protocol over a connection pooler, which is far cheaper than a TCP handshake per request. The HTTP adapter (`PrismaNeonHttp`) was evaluated and rejected — it caused persistent `NeonDbError: fetch failed` and `AbortError` errors on Lambda cold starts that the WebSocket adapter does not. |
| **`@neondatabase/serverless`**                              | `^1.0.2`                                              | The low-level driver that `@prisma/adapter-neon` wraps. Both packages are listed in `serverExternalPackages` (`next.config.ts`) so the Next.js bundler excludes them from the Lambda zip, preventing fetch-polyfill conflicts that arise when these modules are bundled.                                                                                                                                                                           |
| **Neon Postgres**                                           | (hosted)                                              | Serverless Postgres with branching. `production` branch (`ep-wandering-butterfly`) serves live traffic; `dev` branch (`ep-royal-resonance`) is a copy-on-write child used for local development and staging. Two separate data sets — mutations via `localhost:3000` or the dev MCP server never touch production.                                                                                                                                 |

### Styling and UI

| Choice                          | Version                            | Why                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tailwind CSS v4**             | `^4` (with `@tailwindcss/postcss`) | v4 moves all configuration into CSS via `@theme` blocks in `globals.css`, eliminating `tailwind.config.js` entirely. Design tokens (colors, radii, spacing) live in one place and are consumed as CSS custom properties at build time — no runtime JS.                                |
| **shadcn / Radix UI**           | (via `radix-ui ^1.4.3`)            | Unstyled Radix primitives provide accessible focus trapping, keyboard navigation, and ARIA roles for modals, dropdowns, and tooltips. shadcn wraps them with Tailwind classes and keeps component source in the repo (`src/components/ui/`) so there is no black-box upgrade problem. |
| **CVA + clsx + tailwind-merge** | `^0.7.1` / `^2.1.1` / `^3.5.0`     | Class-variance-authority (CVA) defines multi-variant components (e.g. `Button`) as typed style maps. `cn()` composes conditional classes without specificity collisions — `tailwind-merge` de-dupes conflicting utility pairs.                                                        |

### State management and data fetching

| Choice                                 | Version    | Why                                                                                                                                                                                                                                                |
| -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack React Query**               | `^5.90.21` | Handles all client-side server state (cache, loading, error, refetch). Zustand was removed from the project — it is not installed and must not be re-added. Local UI state stays in `useState`/`useReducer`; server state stays in TanStack Query. |
| **`apiClient`** (`src/lib/api-client`) | (internal) | Thin wrapper around `fetch` that sets `credentials: "include"` for HTTP-only cookie auth and serialises query parameters. Client Components call this via TanStack Query hooks — never calling `fetch` directly.                                   |

### Forms and validation

| Choice              | Version   | Why                                                                                                                                                                                                                |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **react-hook-form** | `^7.71.2` | Uncontrolled form management that avoids re-rendering the whole form on every keystroke. Integrates with Zod via `@hookform/resolvers` so validation runs once, client-side and server-side, from the same schema. |
| **Zod v4**          | `^4.3.6`  | Schema-first validation. This project is on Zod 4 — avoid v3 API patterns. Schemas live in `src/lib/validations/` (one file per entity) and are imported by both API route handlers and form resolvers.            |

### Authentication

| Choice                                       | Version      | Why                                                                                                                                                                                                                      |
| -------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AWS Cognito** (Hosted UI, OAuth code flow) | (AWS hosted) | Manages the admin user pool (`portfolio-v2-admin`, `ap-southeast-1`). Self-signup is disabled; only one admin user exists. The Hosted UI handles MFA-ready login flows without the app storing passwords.                |
| **jose**                                     | `^6.1.3`     | Lightweight, edge-compatible JWT verification library. Used in `src/proxy.ts` (the Next.js middleware) to validate the Cognito ID token from the HTTP-only cookie on every admin request — no session database required. |

### 3D / WebGL

| Choice                   | Version                 | Why                                                                                                                                                                                                                                                                                                                              |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **three.js**             | **`^0.182.0` (pinned)** | r183 deprecated `THREE.Clock`. `@react-three/fiber` `^9.6.1` still uses `THREE.Clock` internally — upgrading three to r183+ triggers deprecation warnings and will break when r3f drops the compatibility shim. This pin must stay until r3f ships a Timer-based update.                                                         |
| **`@react-three/fiber`** | `^9.6.1`                | React reconciler for Three.js. Powers `HeroBlob.tsx` — a morphing GLSL shader blob in the hero section with mouse-driven deformation. The `Canvas` is wrapped in a `WebGLErrorBoundary` class component so WebGL initialization failures on old browsers (Mobile Safari 13 / iOS 13) fail silently instead of crashing the page. |

### Image processing

| Choice             | Version      | Why                                                                                                                                                                                                  |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sharp**          | `^0.34.5`    | Converts uploaded images to WebP at ingest time. Sharp is listed in `serverExternalPackages` so it is not bundled into the Lambda — it uses native binaries pre-installed on the Amplify build host. |
| **CloudFront CDN** | (AWS hosted) | Processed images are stored in S3 and served via CloudFront (`NEXT_PUBLIC_CLOUDFRONT_URL`). `next/image` components point at the CloudFront domain, not S3 directly.                                 |

### Markdown

| Choice                                                                                   | Why                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **remark + rehype** (`remark-gfm`, `rehype-sanitize`, `rehype-slug`, `rehype-highlight`) | Blog posts are authored in Markdown and rendered via a sanitized pipeline in `src/lib/markdown.ts`. `rehype-sanitize` strips unsafe HTML. `rehype-slug` generates heading IDs that match `github-slugger`, enabling the `extractHeadings()` helper to build a `TableOfContents` from the same slug algorithm. Never call remark/rehype ad-hoc — all Markdown rendering goes through this module so sanitization is never bypassed. |

### Observability and error tracking

| Choice               | Version    | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@sentry/nextjs`** | `^10.56.0` | Captures unhandled errors and slow requests across client, server, and edge runtimes. Configured in three files (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`) plus `instrumentation.ts` (Next.js `onRequestError` hook). `tracesSampleRate` is `0.1` in production and `1` in development. The deprecated `disableLogger: true` option is replaced by `webpack: { treeshake: { removeDebugLogging: true } }` in `withSentryConfig` — this is what `next.config.ts` uses. |

### Rate limiting

| Choice                                                      | Why                                                                                                                                                                                                                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Upstash Redis** (`@upstash/ratelimit` + `@upstash/redis`) | Serverless Redis for per-IP rate limiting on public API routes (contact form, etc.). `rateLimit()` is async — every call site must `await` it. Missing the `await` leaves `result.success` as `undefined`, causing spurious 429 responses. |

### i18n

| Choice                            | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **DB-driven bilingual (EN + JA)** | Content is stored with `*Ja` nullable columns in Postgres. `t()`, `tArray()`, `tJson()`, and `ui()` helpers in `src/lib/i18n.ts` select the correct field at render time. Static UI strings go in the `UI_STRINGS` map — never hard-coded in components. Translation is triggered from the admin dashboard and runs via Claude Haiku (`claude-haiku-4-5-20251001`) with prompt caching so sequential calls within a 5-minute window get cached input pricing. Only EN and JA are supported — do not add a third locale without discussion. |

---

## Deployment {#deployment}

The app is deployed to **AWS Amplify Hosting Gen 1** (SSR). The build spec lives in
`amplify.yml` at the repo root; Amplify reads it on every push.

### Build pipeline

#### `preBuild`

1. **Materialise `.env.production`** — Amplify Hosting Gen 1's SSR Lambda does not
   auto-inject Console environment variables at request time; they are only available
   during the build. The `preBuild` phase writes a `.env.production` file by
   interpolating every required env var from the Amplify Console into the file so the
   SSR runtime can read it at request time.
2. **`npm ci`** — clean install from `package-lock.json`.
3. **`npx prisma generate`** — regenerates the typed Prisma client from the schema.

#### `build`

1. **`npx prisma migrate deploy`** — applies any pending SQL migrations against the
   production Neon branch. The `|| echo` guard prevents the step from failing the
   build if the database is unreachable (the old schema remains in use until the next
   successful deploy).
2. **Strip dev artifacts** — `rm -rf docs/screenshots .agents mcp .codex .claude/docs
.claude/hooks .claude/agents` removes docs, agent configs, and MCP tooling from the
   build context before `npm run build` runs. This keeps the Lambda bundle lean and
   prevents internal tooling from being served.
3. **`npm run build`** — runs `eslint` then `next build`. The `ANALYZE=true` flag
   (opt-in) triggers `@next/bundle-analyzer`.
4. **`find .next -name '*.js.map' -delete`** — a belt-and-suspenders cleanup. The
   primary source-map removal is done by Sentry's webpack plugin during
   `npm run build`: `sourcemaps.deleteSourcemapsAfterUpload: true` in
   `withSentryConfig` (`next.config.ts`) uploads the maps to Sentry and then deletes
   them. This explicit `find` step runs afterward as a safety net so no `.js.map`
   files reach production even if the plugin step is skipped.

#### `postBuild`

Prints the `.next` directory size in bytes for build-log diagnostics.

#### Artifacts and cache

- **Artifacts:** `baseDirectory: .next`, all files — the standard Amplify SSR output
  directory.
- **Cache:** `node_modules/**/*` and `.next/cache/**/*` are restored between builds to
  speed up `npm ci` and Next.js compilation.

### Neon database branches

| Branch       | Endpoint prefix          | Used by                           |
| ------------ | ------------------------ | --------------------------------- |
| `production` | `ep-wandering-butterfly` | Amplify / live site               |
| `dev`        | `ep-royal-resonance`     | `localhost:3000` / dev MCP server |

The dev branch is a copy-on-write child of production. Reset it via
`./scripts/neon-reset-dev.sh` or the weekly GitHub Action
(`.github/workflows/neon-reset-dev.yml`).

---

## AWS Topology {#aws-topology}

See [`docs/diagrams/aws-architecture.png`](diagrams/aws-architecture.png) for a visual
map of the services below.

| Service                                                                   | Role                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AWS Amplify Hosting Gen 1** (`ap-southeast-1`)                          | Hosts the Next.js SSR application. Manages the build pipeline, SSL certificate, custom domain (`asakurayuta.dev`), and the Amplify-managed CloudFront distribution for SSR responses.                                                                                       |
| **Neon Postgres** (`ap-southeast-1`, project `polished-snow-20449343`)    | Primary database. Two branches: `production` (live data) and `dev` (local development). Accessed via the pooled WebSocket URL; migrations use the direct URL.                                                                                                               |
| **Amazon S3** (`ap-southeast-1`, bucket `portfolio-v2-images-1771574702`) | Stores uploaded images. Public access is fully blocked; reads are restricted to one CloudFront distribution via Origin Access Control (OAC). Versioning is enabled; SSE-AES256 default encryption.                                                                          |
| **Amazon CloudFront** (distribution `E6T76ADR3JLQH`)                      | Assets CDN in front of S3. Serves processed WebP images with long-lived cache headers (`Managed-CachingOptimized` policy — DefaultTTL 1 day, MaxTTL 1 year). WAF v2 attached. Brotli + gzip compression enabled.                                                            |
| **Amazon Cognito** (`ap-southeast-1`, pool `portfolio-v2-admin`)          | Admin-only user pool. Self-signup disabled, deletion protection on. Token lifetimes: 60-minute access/ID tokens. The app uses the Hosted UI OAuth code flow; the resulting ID token is stored in an HTTP-only cookie and verified by `src/proxy.ts` on every admin request. |
| **Amazon SES** (`ap-southeast-1`)                                         | Transactional email for the contact form. Sending identity: `asakurayuta.dev` (DKIM-signed, custom `MAIL FROM: mail.asakurayuta.dev`). Sent as `noreply@asakurayuta.dev`.                                                                                                   |
| **Upstash Redis** (`ap-southeast-1`, PAYG)                                | Serverless Redis for rate limiting public API routes via `@upstash/ratelimit`.                                                                                                                                                                                              |
| **Sentry** (external)                                                     | Error and performance monitoring. DSN injected at build time via `NEXT_PUBLIC_SENTRY_DSN`; source maps uploaded during build and deleted from the output. Production trace sample rate: 10 %.                                                                               |
