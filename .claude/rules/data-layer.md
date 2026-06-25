Pattern: src/lib/data/\*_/_.ts

# Data Layer Rules

`src/lib/data/` is the canonical location for server-side public queries and shared types. The audit found two parallel type systems (`src/types/` vs `src/lib/data/types.ts`) — `src/lib/data/types.ts` is the winner. Do not add to `src/types/`.

- All public Server Component data fetching goes through `public-queries.ts`. Add new query functions here, keep them async and typed.
- Each query function returns a typed value or `null` (for missing). Errors should be caught and logged inside the function, returning `null` so callers can render a 404.
- Never call `prisma.*` directly from a page component — go through this layer.
- `types.ts` re-exports/derives from Prisma generated types (`generated/prisma/client`). Public-facing types should EXCLUDE admin fields (e.g., `DRAFT` posts) — narrow with TypeScript `Pick`/`Omit` or define a curated subset.
- Naming: `getPublicProjects()`, `getProjectBySlug(slug)`, `getFeaturedProjects()` — prefix with `get`, return-shape implied by the entity name.
- For list queries that take filters, accept a single options object with named keys, never positional args.
- Wrap Prisma calls in a `try/catch`, and `console.error` on failure. Returning `null`/`[]` is OK for SSR — **except for queries that back a primary section of an ISR page** (see next bullet).
- **ISR-critical queries must NOT silently degrade to empty on a DB failure.** Returning `null`/`[]` on a transient Neon error makes a failed query indistinguishable from "no data", so Next.js caches a half-empty page for the whole `revalidate` window (the classic "homepage shows only the CTA until you refresh a few times" bug). Instead wrap the Prisma call in `withDbRetry(fn, label)` from `db-resilience.ts`: it retries transient Neon failures (cold-start `fetch failed`, connection resets), reports to Sentry on persistent failure (these are otherwise invisible — `console.error` never reaches Sentry), and **rethrows** so the ISR render aborts. Per Next.js ISR semantics a thrown error keeps the last successfully generated page and retries on the next request — far better than caching a degraded one. Homepage sources `getHero` / `getFeaturedProjects` / `getRecentPosts` follow this pattern. (`getPublishedPosts`, which backs the blog index, intentionally still degrades to `[]`.)
- Do NOT export mutation functions from this layer — mutations belong in API routes (admin) or seed scripts. Keep this read-only.
- When adding a new field to a public type:
  1. Update Prisma schema + migration (see `.claude/rules/prisma-schema.md`).
  2. Add the field to the relevant query's `select` in `public-queries.ts`.
  3. Update the type in `types.ts`.
  4. Anywhere consuming `src/types/<entity>.ts` should be migrated to import from `@/lib/data/types`.
