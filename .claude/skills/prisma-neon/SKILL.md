---
name: prisma-neon
description: Use for any Prisma + Neon Postgres operation in this project — migration creation, branch-based safe testing, query patterns specific to the Neon serverless adapter, seed updates. Wraps the rules in prisma/CLAUDE.md and .claude/rules/prisma-schema.md with concrete commands.
---

# Prisma + Neon Skill

This project uses Prisma 7.4.1 with Neon serverless Postgres via `@prisma/adapter-neon` and `@neondatabase/serverless`. The setup is non-trivial — Neon's pooled URL has different semantics than direct, and migrations run against `DIRECT_URL`.

## When to use

- Adding a model or field to `prisma/schema.prisma`.
- Creating a migration.
- Testing a risky migration on a Neon branch before production.
- Updating seed data.
- Investigating a Prisma query plan or N+1.

## Connection model

Two URLs, both stored in Amplify Console:

| Var | Used for | Pooled? |
|---|---|---|
| `DATABASE_URL` | App runtime queries (the singleton in `src/lib/prismaClient.ts`) | Pooled — uses Neon's PgBouncer endpoint |
| `DIRECT_URL` | `prisma migrate deploy` during build, `prisma migrate dev` locally | Direct — required because migrations need transactions/advisory locks PgBouncer doesn't support |

Locally, your `.env` should have BOTH. If only `DATABASE_URL` is set, `prisma migrate dev` will fail.

## Standard migration flow

```bash
# 1. Edit prisma/schema.prisma
$EDITOR prisma/schema.prisma

# 2. Format and validate the schema
npm run prisma:format

# 3. Generate the migration. The CLI will:
#    - diff schema vs DB
#    - write a SQL file under prisma/migrations/<timestamp>_<name>/
#    - apply it to your local DB via DIRECT_URL
npm run prisma:migrate:dev -- --name add_project_archived_flag

# 4. Regenerate Prisma client (also runs in postinstall)
npm run prisma:generate

# 5. Update the matching Zod schema
$EDITOR src/lib/validations/<entity>.ts

# 6. Update public types if exposed
$EDITOR src/lib/data/types.ts

# 7. Verify nothing broke
npm run type-check
npm run lint
```

When the PR merges to `main`, Amplify's build runs `prisma migrate deploy` against `DIRECT_URL` and rebuilds the app.

## Safe migration testing on a Neon branch

Use this for any change that drops or renames a column, touches a table > 1k rows, or changes hot-path indexes.

### One-time setup

```bash
# Install Neon CLI if you haven't
npm install -g neonctl
neonctl auth
```

### Per-migration workflow

```bash
# 1. Create a Neon branch from main (cheap, ~1s, copy-on-write)
neonctl branches create --name test-<short-name> --parent main

# 2. Get the connection URLs
neonctl connection-string test-<short-name> --pooled    # for DATABASE_URL
neonctl connection-string test-<short-name>             # for DIRECT_URL (direct)

# 3. Point a temporary env at the branch
export DATABASE_URL="<pooled url>"
export DIRECT_URL="<direct url>"

# 4. Apply the migration
npx prisma migrate deploy

# 5. Inspect
npx prisma studio           # GUI
# OR psql "$DIRECT_URL" -c "\d project"

# 6. Run smoke queries — at minimum, verify your existing queries still work:
npx tsx -e 'import { prisma } from "./src/lib/prismaClient"; prisma.project.findMany().then(console.log)'

# 7. When confident, commit the migration. Production gets it on the next merge to main.

# 8. Tear down
unset DATABASE_URL DIRECT_URL
neonctl branches delete test-<short-name>
```

If a Neon MCP is installed, prefer it over the CLI for branch operations.

## Query patterns specific to this project

### Singleton instance — always

```ts
import { prisma } from "@/lib/prismaClient";

const projects = await prisma.project.findMany({ where: { status: "PUBLISHED" } });
```

Never `new PrismaClient()` — it leaks connections in serverless.

### Pagination

Always 1-indexed `page` + `limit`:

```ts
const [items, total] = await Promise.all([
  prisma.project.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { displayOrder: "asc" },
  }),
  prisma.project.count({ where }),
]);
```

### Typed `where` clauses

```ts
import { Prisma } from "@/lib/prismaClient";

const where: Prisma.ProjectWhereInput = {};
if (status !== "all") where.status = status;
```

### Selecting public fields only

For public queries, use `select` to exclude admin-only fields and shrink the payload:

```ts
const projects = await prisma.project.findMany({
  where: { status: "PUBLISHED" },
  select: {
    id: true, slug: true, title: true, shortDescription: true,
    techTags: true, thumbnailImage: true, featured: true,
  },
});
```

### Raw SQL — when

Use `prisma.$queryRaw` only for features Prisma doesn't model (full-text search, lateral joins). Always use the tagged-template form so values are parameterized:

```ts
const ids = ["a", "b"];
await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "Project" WHERE id = ANY(${ids}::text[])`;
```

Never string-concatenate values into raw SQL.

## Common mistakes

- ❌ Running `prisma migrate dev` with only `DATABASE_URL` set (pooled URL — fails). Need `DIRECT_URL` too.
- ❌ Running `prisma migrate reset` — drops all data. db-agent will block this without explicit confirmation.
- ❌ Running `prisma db push` against shared DBs — bypasses migrations.
- ❌ Editing a migration after it's been applied somewhere — create a follow-up instead.
- ❌ Combining destructive change (drop column) with code change in one PR — split into two phases (see `prisma/CLAUDE.md` "Destructive change rollout pattern").
- ❌ Forgetting to update `src/lib/validations/<entity>.ts` after a schema change — the Zod schema and Prisma model drift apart silently.
- ❌ Forgetting to regenerate the Prisma client (`npm run prisma:generate`) — TypeScript will lie to you using the stale generated types.
- ❌ Importing types from `generated/prisma/*` directly across the app — they're already re-exported from `@/lib/prismaClient`.

## Reference files

- Schema: [prisma/schema.prisma](../../../prisma/schema.prisma)
- Singleton client: [src/lib/prismaClient.ts](../../../src/lib/prismaClient.ts)
- Prisma config: [prisma.config.ts](../../../prisma.config.ts)
- Seed: [prisma/seed.ts](../../../prisma/seed.ts)
- Public queries: [src/lib/data/public-queries.ts](../../../src/lib/data/public-queries.ts)
- Migration history: [prisma/migrations/](../../../prisma/migrations/)
