Pattern: **/*.test.ts, **/*.test.tsx, **/*.spec.ts, **/*.spec.tsx

# Test Rules

The project has no test suite yet (audit finding "Missing Fundamental #1"). When tests are introduced, use **Vitest** for unit/integration and **Playwright** for E2E. Until then, these rules apply to any test file added.

## Framework

- Unit / integration: Vitest 1.x with `@vitest/ui` (optional). Configured via `vitest.config.ts` at the repo root.
- React component tests: Vitest + `@testing-library/react` + `@testing-library/jest-dom`.
- E2E: Playwright in a `tests/e2e/` directory at the repo root, NOT under `src/`.

## File Layout

- Unit tests live next to the code: `src/lib/foo.ts` → `src/lib/foo.test.ts`.
- API route tests: `src/app/api/projects/route.test.ts`.
- Existing test scaffolding directory: `src/lib/__tests__/` — prefer co-located `*.test.ts` for new tests; `__tests__/` is acceptable only when shared fixtures need to live alongside.
- Playwright tests: `tests/e2e/<feature>.spec.ts`.

## Conventions

- One `describe` per unit under test. Nested `describe` for sub-behaviors. Use `it("should ...")` form.
- Use `vi.mock` for module-level mocks; `vi.fn()` for inline. Reset with `beforeEach(vi.resetAllMocks)`.
- For Prisma: do NOT mock the client per-test. Use a real Postgres test database (Neon branch is ideal — see `prisma/CLAUDE.md`). Mocked DBs hide migration drift.
- For API routes: invoke the exported handler directly with a constructed `NextRequest`. Don't spin up an HTTP server.
- For React components: render with `@testing-library/react`, query by accessible role/name. Avoid querying by class.
- Test data builders live in `src/test/factories/` (create when first test needs one). Do not inline large fixtures.

## What to Test

Priority order when adding the first tests:

1. `src/lib/errors.ts` `withErrorHandler` — happy path, `ApiError` path, unknown error path.
2. `src/app/api/auth.ts` `requireAuth` / `optionalAuth` — token present/absent/invalid.
3. `src/lib/validations/*.ts` — boundary cases on Zod schemas.
4. Critical API routes: contact (rate limit, honeypot), upload (image processing), projects POST (slug conflict).
5. E2E: admin login flow, create project flow.

## What NOT to Test

- Pure pass-through wrappers around Prisma — those duplicate what Prisma already validates.
- shadcn UI primitives — they're third-party.
- Type-only assertions — `tsc` covers those.

## Running

Add scripts to `package.json` when Vitest is introduced:
- `"test": "vitest"` (replaces the current placeholder)
- `"test:ci": "vitest run --coverage"`
- `"test:e2e": "playwright test"`

Until then, `npm test` is a no-op — do not claim a feature is "tested" without an actual test file.

## CI

Tests must pass before merge once introduced. Add a GitHub Actions workflow that runs `npm run lint`, `npm run type-check`, and `npm run test:ci` against a Neon branch DB.
