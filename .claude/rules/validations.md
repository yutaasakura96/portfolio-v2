Pattern: src/lib/validations/**/*.ts

# Validation Schema Rules

These files are the single source of input shapes for both API routes and forms. Keep them disciplined.

- One file per entity (`project.ts`, `blog.ts`, `contact.ts`). Do not mix entities.
- Use **Zod 4** (this project's installed version). Avoid Zod 3 patterns where the API has changed.
- Export both the schema AND the inferred type:
  ```ts
  export const projectCreateSchema = z.object({ ... });
  export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
  ```
- Naming: `<entity><Action>Schema` (`projectCreateSchema`, `projectUpdateSchema`). Inferred types: `<Entity><Action>Input`.
- For partial-update routes (PATCH), derive from the create schema: `projectCreateSchema.partial()`. Do not duplicate.
- Trim and lowercase strings as part of the schema (`z.string().trim().toLowerCase()`) when business rules require it. Do not rely on callers.
- Validate slugs with a regex (`/^[a-z0-9-]+$/`) and a length cap. Slugs are user-facing and indexed in Postgres — keep them clean.
- For optional fields that can be `""` or omitted: use `.optional()` and `.transform(v => v || undefined)` to normalize. Do not let `""` reach the database.
- For URLs: `z.string().url()`. For emails: `z.string().email().toLowerCase().trim()`.
- For dates from JSON: `z.coerce.date()` (parses string → Date).
- Shared atoms (slug schema, tag-list schema) live in `src/lib/validations/shared.ts` — extend that file rather than duplicating across entities.
- Do NOT use Zod schemas as DB-layer types — that's what Prisma's generated types are for. Validations describe inputs; Prisma describes the row shape.
- File-upload schemas validate `mimeType` against an explicit allowlist (`["image/jpeg", "image/png", "image/webp"]`). Never allow arbitrary MIME types.
