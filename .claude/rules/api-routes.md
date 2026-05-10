Pattern: src/app/api/\*_/_.ts

# API Route Rules

Every handler in this tree must follow these rules. See `src/app/api/CLAUDE.md` for the full standard skeleton and rationale.

- Wrap every exported handler in `withErrorHandler` from `@/lib/errors`. No exceptions.
- Throw `ApiError(message, status, code, details?)` for known errors. Use codes from `ErrorCodes` (`@/lib/errors`).
- Auth helpers come from `@/app/api/auth` (NOT `@/lib/auth` — that path doesn't exist):
  - `requireAuth()` for all mutations and admin reads.
  - `optionalAuth()` for endpoints that behave differently when logged in.
- Validate all inputs with Zod via `safeParse`. On failure: `throw new ApiError("Validation error", 400, ErrorCodes.VALIDATION_ERROR, parsed.error.flatten())`.
- Schemas live in `src/lib/validations/<entity>.ts`. Export both schema and inferred type.
- Type Prisma `where` clauses with `Prisma.<Model>WhereInput`. Never use `Record<string, unknown>`.
- Parse query parameters via `request.nextUrl.searchParams` (NOT `new URL(request.url).searchParams`).
- Pagination: use `page` (1-indexed) + `limit`. Return `meta: { total, page, limit, totalPages }`. Do NOT introduce `pageSize`.
- Response shapes: `{ data: T }` or `{ data: T[], meta }`. Never `{ data: { success: true } }`.
- Use the global `Response.json(...)` (not `NextResponse.json`). Status codes per `src/app/api/CLAUDE.md` table.
- After mutations affecting public pages, call `revalidatePath(...)` for every affected route. Featured-flag changes also revalidate `/`.
- Use the singleton `prisma` from `@/lib/prismaClient`. Never `new PrismaClient()`.
- Mutations return `201` on create, `200` on update, `204` (no body) on delete.
- Conditional auth (e.g., `?status=DRAFT` is admin-only): check the param first, then `await requireAuth()` only for the privileged branch.
- Use `rateLimit()` from `@/lib/rate-limit` for rate-limited endpoints — it's Upstash-backed (sliding window via `@upstash/ratelimit`). The function is async, so always `await` it. Fails open on Upstash errors. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars.
- Never log secrets, tokens, or full request bodies. `console.error(error)` for unhandled paths is the current ceiling — improve with Sentry once added.
- Keep handlers under ~80 lines. If business logic grows, extract to `src/lib/<domain>/` and call from the route.
