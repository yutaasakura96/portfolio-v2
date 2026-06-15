Pattern: **/\*.test.ts, **/_.test.tsx, \*\*/_.spec.ts, \*_/_.spec.tsx

# Test Rules

The project uses **Vitest 4.x** with **@testing-library/react** and **@testing-library/jest-dom** for unit/integration tests. Coverage is generated via **@vitest/coverage-v8**. E2E tests will use **Playwright** when introduced.

## Framework

- Unit / integration: Vitest 4.x with `@vitest/ui`. Configured via `vitest.config.ts` at the repo root.
- React component tests: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` (for realistic user interactions in component tests).
- E2E: Playwright in a `tests/e2e/` directory at the repo root, NOT under `src/`.

## File Layout

- Unit tests live next to the code: `src/lib/foo.ts` → `src/lib/foo.test.ts`.
- API route tests: `src/app/api/projects/route.test.ts`.
- Tests are co-located: `src/lib/foo.test.ts` next to `src/lib/foo.ts`. Use `__tests__/` directories only when shared fixtures need to live alongside.
- Playwright tests: `tests/e2e/<feature>.spec.ts`.

## Conventions

- One `describe` per unit under test. Nested `describe` for sub-behaviors. Use `it("should ...")` form.
- Use `vi.mock` for module-level mocks; `vi.fn()` for inline. Reset with `beforeEach(vi.resetAllMocks)`.
- For Prisma: do NOT mock the client per-test. Use a real Postgres test database (Neon branch is ideal — see `prisma/CLAUDE.md`). Mocked DBs hide migration drift.
- For API routes: invoke the exported handler directly with a constructed `NextRequest`. Don't spin up an HTTP server.
- For React components: render with `@testing-library/react`, query by accessible role/name. Avoid querying by class.
- Test data builders live in `src/test/factories/` (create when first test needs one). Do not inline large fixtures.

## What to Test

Priority order (items marked ✅ already have tests):

1. ✅ `src/lib/errors.ts` `withErrorHandler` — `src/lib/errors.test.ts`
2. ✅ `src/app/api/auth.ts` `requireAuth` / `optionalAuth` / `requireAuthOrApiKey` — `src/app/api/auth.test.ts`
3. ✅ `src/lib/validations/*.ts` — `contact.test.ts`, `project.test.ts`, `blog.test.ts`
4. ✅ `src/lib/i18n.ts` `t()` / `tArray()` / `tJson()` / `ui()` / `localizeSkillCategory()` — `src/lib/i18n.test.ts`
5. ✅ `src/lib/markdown.ts` `extractHeadings()` / `markdownToHtml()` — `src/lib/markdown.test.ts`
6. ✅ `src/lib/import-export/csv-utils.ts` `flattenForCsv()` / `unflattenFromCsv()` — `src/lib/import-export/csv-utils.test.ts`
7. ✅ Critical API routes: contact ✅ (`src/app/api/contact/route.test.ts`), upload ✅ (`src/app/api/upload/route.test.ts` — MIME validation, size limits, folder allowlist, all 7 upload paths, DELETE key-prefix validation), unified import ✅ (`src/app/api/admin/import/unified/route.test.ts`), unified export ✅ (`src/app/api/admin/export/unified/route.test.ts`). Projects POST (slug conflict) ❌.
8. ✅ `src/proxy.ts` JWT guard — `src/proxy.test.ts` (bypass routes, JWT validation, redirect encoding).
9. ✅ Import-export helpers — `src/lib/import-export/validation-helpers.test.ts` (`stripInternalFields`, `validateRows`, `getExportFilename`, `lookupUniqueKey`) and `src/lib/import-export/unified-import.test.ts` (`IMPORT_ORDER`, `unifiedImportBodySchema`, `validateUnifiedImport`).
10. ✅ `src/components/public/ContactForm.tsx` — `src/components/public/ContactForm.test.tsx` (field rendering, validation errors, submission, error/429/network states).
11. E2E: admin login flow, create project flow.

## What NOT to Test

- Pure pass-through wrappers around Prisma — those duplicate what Prisma already validates.
- shadcn UI primitives — they're third-party.
- Type-only assertions — `tsc` covers those.

## Running

- `npm test` — Vitest in watch mode (interactive development).
- `npm run test:ci` — single run with v8 coverage (used in CI).
- `npm run test:e2e` — add when Playwright E2E tests are introduced.

## CI

CI runs lint, type-check, build, and test on every PR to `main`/`develop`. See `.github/workflows/ci.yml`. Tests must pass before merge.

When a Neon test branch is wired via GitHub Secrets, swap the placeholder `DATABASE_URL` in the CI workflow for the real branch URL to enable integration tests against a live DB.
