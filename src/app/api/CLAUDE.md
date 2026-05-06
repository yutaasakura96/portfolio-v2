# API Route Rules — `src/app/api/`

Every route under this directory must follow these rules. The patterns below are extracted from working routes (e.g. [src/app/api/projects/route.ts](src/app/api/projects/route.ts)).

## Standard Response Shapes

There are exactly **three** allowed response shapes. Pick by use case.

```ts
// Single resource
type ApiResource<T> = { data: T };

// Collection with pagination metadata
type ApiCollection<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// Error (set automatically by withErrorHandler)
type ApiErrorResponse = {
  error: {
    message: string;
    code: string; // from ErrorCodes in src/lib/errors.ts
    details?: unknown; // typically Zod flattened errors
  };
};
```

**Do NOT** wrap responses in `{ data: { success: true } }` or `{ data: { success: true, message: "..." } }`. The contact and sign-out routes do this — that's the audited inconsistency, not the target. New routes return `{ data: T }` where `T` is the entity (or `T = null` for empty success).

## Required Skeleton

Every route handler must:

1. Be wrapped in `withErrorHandler`.
2. Validate input with Zod via `safeParse` and throw `ApiError(..., 400, ErrorCodes.VALIDATION_ERROR, parsed.error.flatten())` on failure.
3. Use `requireAuth()` for any mutation (POST/PUT/PATCH/DELETE) and for reads of non-public data.
4. Return `Response.json({ data, meta? }, { status })`.
5. Call `revalidatePath(...)` after mutations that affect public pages.

```ts
import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { someSchema } from "@/lib/validations/something";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = someSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const created = await prisma.thing.create({ data: parsed.data });

  revalidatePath("/things");
  return Response.json({ data: created }, { status: 201 });
});
```

## Authentication

| Helper           | When                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `requireAuth()`  | Mutations and admin reads. Throws 401 if unauthenticated.                                                                          |
| `optionalAuth()` | Endpoints that behave differently for logged-in vs anonymous (e.g. GET that exposes drafts to admins). Returns `AuthUser \| null`. |

Import from `@/app/api/auth`. Never re-implement JWT verification — it lives in [src/lib/aws/cognito.ts](src/lib/aws/cognito.ts).

For routes that conditionally require auth based on query params (like `?status=DRAFT`), check the param first and call `requireAuth` only when needed (see [src/app/api/projects/route.ts:16-18](src/app/api/projects/route.ts#L16)).

## Input Validation

- Schemas live in [src/lib/validations/](src/lib/validations/), one file per entity.
- Always export both the schema and the inferred type:
  ```ts
  export const projectCreateSchema = z.object({ ... });
  export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
  ```
- Use `safeParse` (not `parse`). Throw `ApiError` with `parsed.error.flatten()` as `details`.
- Validate query parameters too — wrap them in a Zod schema rather than `parseInt` chains.

## Pagination — Standard

Use `page` (1-indexed) + `limit` everywhere. **Do not introduce `pageSize`.**

```ts
const page = parseInt(searchParams.get("page") ?? "1");
const limit = parseInt(searchParams.get("limit") ?? "20");

const [items, total] = await Promise.all([
  prisma.thing.findMany({ where, skip: (page - 1) * limit, take: limit }),
  prisma.thing.count({ where }),
]);

return Response.json({
  data: items,
  meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
});
```

The blog and messages routes currently use `pageSize` — that's pending migration, do not copy it.

## Query Param Parsing — Standard

Use `request.nextUrl.searchParams`. Do not write `new URL(request.url).searchParams` (the blog route does, but `nextUrl` is the standard).

## Where-Clause Typing

Type Prisma `where` objects with the generated `Prisma.<Model>WhereInput`. Do not use `Record<string, unknown>` (the blog route does — that's the bug, not the convention).

```ts
import { Prisma } from "@/lib/prismaClient";
const where: Prisma.ProjectWhereInput = {};
```

## Status Codes

| Code | Use                                                                                           |
| ---- | --------------------------------------------------------------------------------------------- |
| 200  | Successful GET/PUT/PATCH                                                                      |
| 201  | Successful POST that created a resource                                                       |
| 204  | Successful DELETE with no body (use `new Response(null, { status: 204 })`)                    |
| 400  | Validation error (`ErrorCodes.VALIDATION_ERROR`)                                              |
| 401  | Auth missing/invalid (`ErrorCodes.UNAUTHORIZED`)                                              |
| 403  | Auth valid but forbidden — currently unused; reserve `ErrorCodes.UNAUTHORIZED` if you need it |
| 404  | Resource not found (`ErrorCodes.NOT_FOUND`)                                                   |
| 409  | Slug conflict / duplicate key (`ErrorCodes.CONFLICT`)                                         |
| 429  | Rate limit (`ErrorCodes.RATE_LIMIT_EXCEEDED`)                                                 |
| 500  | Unhandled — `withErrorHandler` returns this automatically                                     |

## Cache Invalidation

After any mutation that affects a public page, call `revalidatePath` for every affected route. Common pairs:

- Project create/update/delete → `revalidatePath("/projects")` and `revalidatePath("/")` if `featured`.
- Project update by slug → also `revalidatePath(`/projects/${slug}`)`.
- Blog post → `/blog` and `/blog/${slug}`.
- Hero / About / Settings → `/`.

## Rate Limiting

The current [src/lib/rate-limit.ts](src/lib/rate-limit.ts) is in-memory and **does not work in Amplify's Lambda runtime**. Existing usage on contact + upload is best-effort. Do NOT extend it to new endpoints. When adding rate limiting to a new endpoint, use Upstash Redis (already in CSP allowlist) — open a separate task.

## Public vs Admin Endpoints

- **Public POST endpoints** (currently only contact): rate-limit, honeypot, no auth.
- **All other mutations:** `requireAuth` first, then validate.
- **Public GET endpoints:** no auth, but if any param can expose admin data (`?status=DRAFT`), gate that branch with `requireAuth`.

## What Not to Do

- ❌ Don't `try/catch` inside the handler — let `withErrorHandler` catch. Only wrap when you need to convert a specific error to an `ApiError`.
- ❌ Don't return `NextResponse.json` — use `Response.json`. Both work; the codebase standardizes on the global `Response`.
- ❌ Don't sanitize HTML on the way out (`rehype-sanitize` does that for markdown). Sanitize untrusted markdown/HTML on the way IN if it's stored — see audit note #7.
- ❌ Don't re-export `prisma` per route. Import from `@/lib/prismaClient`.
