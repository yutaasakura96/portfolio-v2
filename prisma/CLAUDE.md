# Database Rules — `prisma/`

Prisma 7.4.1 + Neon Postgres via `@prisma/adapter-neon`. Generated client output is `generated/prisma/`. Single schema file at [prisma/schema.prisma](prisma/schema.prisma).

## Model Naming Conventions

Follow the patterns already in [schema.prisma](schema.prisma):

- **Model names: `PascalCase`, singular.** (`Project`, `BlogPost`, `SkillCategory` — not `Projects`.)
- **Field names: `camelCase`.** (`displayOrder`, `thumbnailImage`, `createdAt`.)
- **Enums: `PascalCase` for the type, `UPPER_SNAKE_CASE` for values.** (`ProjectStatus`, `DRAFT` / `PUBLISHED`.)
- **IDs: `String @id @default(cuid())`.** Do not use UUIDs or auto-increment ints — every existing model uses cuid.
- **Timestamps: `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.** Add both unless the model is a true singleton (e.g. `Hero` only has `updatedAt`).
- **Slugs: `slug String @unique`** with an `@@index([slug])` for fast public lookups.
- **Display ordering: `displayOrder Int @default(0)`** with a compound index like `@@index([status, displayOrder])`.
- **Long text: `@db.Text`.** Use `@db.VarChar(N)` only for short, validated fields (titles, headlines).
- **Tag arrays: `String[]`** (Postgres array, not a join table) — see `Project.techTags`.

## Migration Workflow (Neon)

Neon is serverless Postgres. We have **one production branch** (`main`). Treat migrations as production-affecting from the moment they're committed.

### Creating a new migration

```bash
# 1. Edit prisma/schema.prisma
# 2. Format the schema
npm run prisma:format

# 3. Create the migration (creates SQL file + applies to local DB)
npm run prisma:migrate:dev -- --name descriptive_change_name

# 4. Regenerate the client
npm run prisma:generate

# 5. Type-check
npm run type-check
```

### Production migrations run automatically on Amplify build

`prisma migrate deploy` is part of the Amplify build pipeline (see [amplify.yml](amplify.yml)). New migration files merged to `main` apply on the next deploy.

### Hard rules

- ❌ **NEVER run `prisma migrate reset` without explicit user confirmation.** It drops all data. The db-agent is configured to refuse this without a typed confirmation.
- ❌ **Never edit a migration after it's been applied to any environment.** Create a follow-up migration.
- ❌ **Never `prisma db push` against a shared database.** Use migrations.
- ✅ For destructive schema changes (drop column, rename), do a two-phase migration: (1) deploy code that no longer uses the column, (2) migration that drops it.
- ✅ For renames, generate the migration and **manually edit the SQL** to use `ALTER TABLE ... RENAME` instead of drop + add (Prisma defaults to drop + add, which loses data).

### Neon branching for safe schema testing

Neon supports cheap database branches. To validate a risky migration:

1. Create a Neon branch from `main` in the Neon console (or via CLI/MCP).
2. Point a `.env.test` at the branch URL.
3. Run `prisma migrate deploy` against the branch.
4. Manually verify (or run a smoke test).
5. Merge the migration to `main` and let Amplify deploy.

This is the safe path for any migration that touches a table with > 1k rows or that drops/renames columns. The db-agent should run this workflow when the user requests "test this migration safely."

## Relation Patterns

The current schema is **mostly relation-light** — Project, BlogPost, etc. are flat models with `String[]` arrays for tags. Skills relate to SkillCategory by string name (not a foreign key — pragmatic but not ideal).

When adding new relations:

- Use explicit FK columns: `categoryId String` + `category SkillCategory @relation(fields: [categoryId], references: [id])`.
- Add `onDelete` policy explicitly (`Cascade`, `Restrict`, or `SetNull`). Don't rely on the default.
- Add an index on the FK side: `@@index([categoryId])`.
- For many-to-many, use an explicit join table — Prisma's implicit M:N hides the join model and complicates filtering.

## Query Patterns — Prisma vs Raw SQL

**Default to Prisma Client.** Use raw SQL (`prisma.$queryRaw`) only when:

- You need a Postgres feature Prisma doesn't model (e.g. full-text `tsvector`, window functions, lateral joins).
- Performance profiling shows a Prisma-generated query is the bottleneck.

If you do reach for raw SQL:

- Use the tagged-template form (`prisma.$queryRaw\`SELECT ... ${id}\``) — it parameterizes correctly.
- Type the result with a generic: `prisma.$queryRaw<MyShape[]>\`...\``.
- Add a comment explaining why Prisma Client wasn't sufficient.

## Where to Put Queries

| Caller                   | Location                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Public Server Component  | [src/lib/data/public-queries.ts](src/lib/data/public-queries.ts)                                                                         |
| API route (admin/public) | Inline in the route handler (`src/app/api/.../route.ts`)                                                                                 |
| Seed                     | [prisma/seed.ts](prisma/seed.ts)                                                                                                         |
| Script (one-off)         | Create under `scripts/` only after checking existing scripts such as `mcp-setup.ts`, `neon-reset-dev.sh`, and `seed-skill-categories.ts` |

Do **not** create a `src/lib/data/admin-queries.ts` mirror — admin reads go through API routes (TanStack Query on the client).

## Seed Data

[prisma/seed.ts](prisma/seed.ts) is the single seed entrypoint, run via `npx prisma db seed` (configured in `package.json` under `"prisma.seed"`).

- Use `prisma.upsert` so seeds are idempotent.
- Hardcode IDs (`id: "seed-hero"`) for singletons so re-running the seed updates rather than duplicates.
- Don't seed sensitive data (real emails, API keys). Use placeholders.
- Seeds run with the same `DATABASE_URL` as the app — pointing at production by mistake will overwrite. Always confirm `echo $DATABASE_URL` before running locally if you've recently switched envs.

## Schema Changes — PR Checklist

Before merging a PR that touches `schema.prisma`:

- [ ] Migration file is committed alongside the schema change.
- [ ] `npm run prisma:generate` was run (the regenerated client may need to be regenerated by reviewer too).
- [ ] `npm run type-check` passes — Prisma type changes can break callers.
- [ ] Any new field has a corresponding update to the Zod schema in [src/lib/validations/](src/lib/validations/).
- [ ] Any new field that should appear in public types is added to [src/lib/data/types.ts](src/lib/data/types.ts).
- [ ] If destructive, the rollout plan is in the PR description.
