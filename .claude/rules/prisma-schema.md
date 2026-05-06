Pattern: prisma/schema.prisma

# Prisma Schema Rules

See `prisma/CLAUDE.md` for the full migration workflow. Rules here are the schema-file-specific ones.

- Models are `PascalCase` and singular (`Project`, not `Projects`). Field names are `camelCase`.
- IDs: `id String @id @default(cuid())`. Do not introduce UUIDs or auto-increment ints.
- Timestamps: every non-singleton model has `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`.
- Enums: `PascalCase` type with `UPPER_SNAKE_CASE` values (`ProjectStatus { DRAFT, PUBLISHED }`).
- Slugs: `slug String @unique` + `@@index([slug])` for any model with a public detail page.
- Display ordering: `displayOrder Int @default(0)` + a compound index pairing it with `status` (`@@index([status, displayOrder])`).
- Long text uses `@db.Text`. Short bounded text uses `@db.VarChar(N)` — pick a realistic limit, never leave it unbounded if N is known (titles ≤ 200, headlines ≤ 200, descriptions ≤ 500, bios use `@db.Text`).
- Tag-style lists use Postgres `String[]` (e.g. `Project.techTags`) — do NOT introduce a join table for simple tag arrays.
- New foreign keys: explicit FK column + `@relation(fields: [fkId], references: [id], onDelete: <Cascade|Restrict|SetNull>)`. Always specify `onDelete` — never rely on the default. Add `@@index([fkId])`.
- Many-to-many: use an explicit join table (a model with both FKs). Do NOT use Prisma's implicit M:N — it makes filtering and migrations harder.
- Generator block stays as-is: `provider = "prisma-client"`, `output = "../generated/prisma"`. Don't change without coordinating — generated path is referenced across the codebase.
- Datasource: `provider = "postgresql"` only. Do NOT add a hardcoded `url` — it comes from `DATABASE_URL` via `prisma.config.ts`.
- Comment section dividers (`// ═══ MODEL NAME ═══`) are required between top-level models — match the existing style for readability.
- After ANY schema edit:
  1. `npm run prisma:format` (formats + validates)
  2. `npm run prisma:migrate:dev -- --name <descriptive_name>` (creates SQL + applies locally)
  3. `npm run prisma:generate`
  4. `npm run type-check`
  5. Update Zod schema in `src/lib/validations/<entity>.ts` to match.
  6. Update public types in `src/lib/data/types.ts` if the field is exposed publicly.
- For renames or column drops: hand-edit the generated SQL to use `ALTER TABLE ... RENAME` instead of drop+add. Default Prisma output drops data.
- NEVER add destructive operations to a migration that has already been applied to any environment. Create a follow-up migration.
