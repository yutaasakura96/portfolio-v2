# Refactor Log

Running log of refactor changes per session in `.claude/docs/refactor-plan.md`.

Format:

| Item ID | File changed | What was done | Status |
| ------- | ------------ | ------------- | ------ |

---

## Session 1 — Critical / Breaking (2026-05-06)

| Item ID | File changed                     | What was done                                                                                                                                                        | Status  |
| ------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 1.1     | `src/lib/prismaClient.ts`        | Removed `import "dotenv/config";` (line 2). Next.js loads `.env` automatically; CLI scope `prisma.config.ts` retains its dotenv usage. Lint + build passed.          | ✅ done |
| 1.2     | `src/app/test-data/` (directory) | Removed empty leftover directory via `rmdir`. Prevents Next 16 from accidentally treating any future `page.tsx` placed there as a public route. Lint + build passed. | ✅ done |
| 1.3     | `.env.example`                   | Renamed AWS keys (`AWS_REGION`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` → `APP_AWS_*`) to match real code (Amplify reserves `AWS_*`). Added header comment pointing at `.claude/docs/infrastructure.md` for the canonical list. File contained 3 AWS keys (not 4 as plan estimated). Lint + build passed. | ✅ done |
| 1.4     | n/a                              | Commit point reached. Stopped without committing per user instruction; pending user review.                                                                          | ⏸ stop  |
