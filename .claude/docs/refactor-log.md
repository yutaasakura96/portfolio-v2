# Refactor Log

Running log of refactor changes per session in `.claude/docs/refactor-plan.md`.

Format:

| Item ID | File changed | What was done | Status |
| ------- | ------------ | ------------- | ------ |

---

## Session 1 — Critical / Breaking (2026-05-06)

| Item ID | File changed                     | What was done                                                                                                                                                                                                                                                                                                | Status  |
| ------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| 1.1     | `src/lib/prismaClient.ts`        | Removed `import "dotenv/config";` (line 2). Next.js loads `.env` automatically; CLI scope `prisma.config.ts` retains its dotenv usage. Lint + build passed.                                                                                                                                                  | ✅ done |
| 1.2     | `src/app/test-data/` (directory) | Removed empty leftover directory via `rmdir`. Prevents Next 16 from accidentally treating any future `page.tsx` placed there as a public route. Lint + build passed.                                                                                                                                         | ✅ done |
| 1.3     | `.env.example`                   | Renamed AWS keys (`AWS_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` → `APP_AWS_*`) to match real code (Amplify reserves `AWS_*`). Added header comment pointing at `.claude/docs/infrastructure.md` for the canonical list. File contained 3 AWS keys (not 4 as plan estimated). Lint + build passed. | ✅ done |
| 1.4     | n/a                              | Commit point reached. Stopped without committing per user instruction; pending user review.                                                                                                                                                                                                                  | ⏸ stop  |

---

## Session 2 — Type Safety (2026-05-06)

| Item ID | File changed                    | What was done                                                                                                                                                                                                                                                                                                                                  | Status  |
| ------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 2.1     | `src/app/api/blog/route.ts`     | Added `Prisma` to the existing `@/lib/prismaClient` import. Replaced `const where: Record<string, unknown> = {}` with `const where: Prisma.BlogPostWhereInput = {}`. Cast `where.status` assignment via `Prisma.BlogPostWhereInput["status"]` since the value arrives as a raw string from query params. Lint + type-check + build all passed. | ✅ done |
| 2.2     | `src/app/api/messages/route.ts` | Audit grep across `src/app/api/` found exactly one additional occurrence of `Record<string, unknown>` (this file). Added `Prisma` to the existing `@/lib/prismaClient` import. Replaced `const where: Record<string, unknown> = {}` with `const where: Prisma.ContactMessageWhereInput = {}`. No casts needed. Lint + type-check + build all passed. | ✅ done |
| 2.3     | n/a                             | Commit point reached. Stopped without committing per user instruction; pending user review. Suggested commit message: `refactor(api): tighten Prisma where-clause typing`.                                                                                                                                                                     | ⏸ stop  |
