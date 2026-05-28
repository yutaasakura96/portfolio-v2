Pattern: src/app/api/\*_/_.ts

# API Route Rules — Top Mistakes

Full reference: [src/app/api/CLAUDE.md](../../src/app/api/CLAUDE.md). This rule file enforces the five highest-impact conventions.

1. **Every handler must be wrapped in `withErrorHandler`** from `@/lib/errors`. No bare `export async function GET`.
2. **Auth import is `@/app/api/auth`** — NOT `@/lib/auth`. Use `requireAuth()` for mutations, `optionalAuth()` for conditional behavior.
3. **Always `await rateLimit()`** — it's async (Upstash-backed). Missing `await` makes `result.success` undefined → spurious 429s.
4. **Response shape is `{ data: T }` or `{ data: T[], meta }`** — never `{ data: { success: true } }`. Use `Response.json` (not `NextResponse.json`). Exception: export routes (`*/export/route.ts`) return raw file content with `Content-Disposition: attachment` — no envelope.
5. **Pagination uses `page` + `limit`** — do NOT introduce `pageSize`. Return `meta: { total, page, limit, totalPages }`.
