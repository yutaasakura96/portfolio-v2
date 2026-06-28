## API Reference

This document covers every HTTP endpoint in the portfolio API and the MCP server tool surface. For project layout and rendering strategy, see [architecture.md](architecture.md).

---

### Contents

- [Conventions](#conventions)
- [Public routes](#public)
- [Admin / CMS routes](#admin--cms)
- [Auth routes](#auth)
- [Import / Export routes](#importexport)
- [Translation routes](#translation)
- [Health route](#health)
- [MCP server](#mcp-server)

---

## Conventions

### Response envelope

All non-export routes return JSON with one of two shapes:

```jsonc
// Single resource
{ "data": { ... } }

// Collection
{ "data": [...], "meta": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 } }
```

Pagination uses `?page=<n>&limit=<n>` query params. The `meta` object is present on every list response.

Export routes (`/export/` paths and `/api/admin/export/unified`) are the only exception: they return the raw file body with a `Content-Disposition: attachment` header and no JSON envelope.

### Error shape

Every route is wrapped with `withErrorHandler` from `src/lib/errors.ts`. Thrown `ApiError` instances produce:

```jsonc
{
  "error": {
    "message": "Human-readable description",
    "code": "ERROR_CODE",
    "details": { ... } // optional
  }
}
```

Stable error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `UPLOAD_ERROR`, `EMAIL_ERROR`, `INTERNAL_ERROR`. Unhandled errors become 500 with code `INTERNAL_ERROR`.

### Auth helpers (`src/app/api/auth.ts`)

| Helper                | Used by                                         | Behaviour                                                               |
| --------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `requireAuth`         | Browser-admin-only routes                       | Reads `access_token` HTTP-only cookie; throws 401 if missing or expired |
| `requireAuthOrApiKey` | MCP-accessible admin routes                     | Cookie first, falls back to `Authorization: Bearer <key>` API key       |
| `optionalAuth`        | Routes with different behaviour per login state | Returns `AuthUser \| null`; never throws                                |
| public (none)         | Public-facing and auth flow routes              | No credential check                                                     |

---

## Public

Public routes serve the portfolio site's data-fetching needs. They require no credentials.

| Method | Path                        | Auth   | Rate-limited |
| ------ | --------------------------- | ------ | ------------ |
| `GET`  | `/api/contact` — _see note_ | public | —            |
| `POST` | `/api/contact`              | public | yes          |
| `GET`  | `/api/resume/download`      | public | no           |
| `GET`  | `/api/skill-categories`     | public | no           |

> The contact route only exposes `POST` (submission). `GET /api/contact` is not a separate endpoint — the table above reflects only the implemented verb.

---

## Admin / CMS

All admin / CMS routes require authentication. Routes accessible to the MCP server (programmatic clients) use `requireAuthOrApiKey`; browser-only mutation routes use `requireAuth`.

### About

| Method       | Path         | Auth                | Rate-limited |
| ------------ | ------------ | ------------------- | ------------ |
| `GET`, `PUT` | `/api/about` | requireAuthOrApiKey | no           |

### Blog posts

| Method                 | Path             | Auth                | Rate-limited |
| ---------------------- | ---------------- | ------------------- | ------------ |
| `GET`, `POST`          | `/api/blog`      | requireAuthOrApiKey | no           |
| `GET`, `PUT`, `DELETE` | `/api/blog/[id]` | requireAuthOrApiKey | no           |

### Certifications

| Method          | Path                          | Auth                | Rate-limited |
| --------------- | ----------------------------- | ------------------- | ------------ |
| `GET`, `POST`   | `/api/certifications`         | requireAuthOrApiKey | no           |
| `PUT`, `DELETE` | `/api/certifications/[id]`    | requireAuthOrApiKey | no           |
| `PUT`           | `/api/certifications/reorder` | requireAuthOrApiKey | no           |

### Education

| Method          | Path                     | Auth                | Rate-limited |
| --------------- | ------------------------ | ------------------- | ------------ |
| `GET`, `POST`   | `/api/education`         | requireAuthOrApiKey | no           |
| `PUT`, `DELETE` | `/api/education/[id]`    | requireAuthOrApiKey | no           |
| `PUT`           | `/api/education/reorder` | requireAuthOrApiKey | no           |

### Experience

| Method          | Path                      | Auth                | Rate-limited |
| --------------- | ------------------------- | ------------------- | ------------ |
| `GET`, `POST`   | `/api/experience`         | requireAuthOrApiKey | no           |
| `PUT`, `DELETE` | `/api/experience/[id]`    | requireAuthOrApiKey | no           |
| `PUT`           | `/api/experience/reorder` | requireAuthOrApiKey | no           |

### Hero

| Method       | Path        | Auth                | Rate-limited |
| ------------ | ----------- | ------------------- | ------------ |
| `GET`, `PUT` | `/api/hero` | requireAuthOrApiKey | no           |

### Messages

Messages are read/archive only — no create or delete endpoint exists by design.

| Method                 | Path                 | Auth                | Rate-limited |
| ---------------------- | -------------------- | ------------------- | ------------ |
| `GET`                  | `/api/messages`      | requireAuthOrApiKey | no           |
| `GET`, `PUT`, `DELETE` | `/api/messages/[id]` | requireAuthOrApiKey | no           |
| `PUT`                  | `/api/messages/bulk` | requireAuthOrApiKey | no           |

### Projects

| Method                 | Path                    | Auth                | Rate-limited |
| ---------------------- | ----------------------- | ------------------- | ------------ |
| `GET`, `POST`          | `/api/projects`         | requireAuthOrApiKey | no           |
| `GET`, `PUT`, `DELETE` | `/api/projects/[id]`    | requireAuthOrApiKey | no           |
| `PUT`                  | `/api/projects/reorder` | requireAuthOrApiKey | no           |

### Settings

| Method       | Path            | Auth                | Rate-limited |
| ------------ | --------------- | ------------------- | ------------ |
| `GET`, `PUT` | `/api/settings` | requireAuthOrApiKey | no           |

### Skill categories

| Method | Path                            | Auth                | Rate-limited |
| ------ | ------------------------------- | ------------------- | ------------ |
| `GET`  | `/api/skill-categories`         | public              | no           |
| `PUT`  | `/api/skill-categories/reorder` | requireAuthOrApiKey | no           |

### Skills

| Method          | Path                  | Auth                | Rate-limited |
| --------------- | --------------------- | ------------------- | ------------ |
| `GET`, `POST`   | `/api/skills`         | requireAuthOrApiKey | no           |
| `PUT`, `DELETE` | `/api/skills/[id]`    | requireAuthOrApiKey | no           |
| `PUT`           | `/api/skills/reorder` | requireAuthOrApiKey | no           |

### API keys

| Method        | Path                       | Auth        | Rate-limited |
| ------------- | -------------------------- | ----------- | ------------ |
| `GET`, `POST` | `/api/admin/api-keys`      | requireAuth | no           |
| `DELETE`      | `/api/admin/api-keys/[id]` | requireAuth | no           |

### Dashboard

| Method | Path                            | Auth                | Rate-limited |
| ------ | ------------------------------- | ------------------- | ------------ |
| `GET`  | `/api/admin/dashboard-stats`    | requireAuthOrApiKey | no           |
| `GET`  | `/api/admin/dashboard-external` | requireAuthOrApiKey | no           |

`dashboard-stats` returns portfolio content counts from the database. `dashboard-external` parallel-fetches Sentry issues, Amplify build status, site health, and GA config; it degrades gracefully when any of the required env vars (`SENTRY_ORG_SLUG`, `AMPLIFY_APP_ID`, `GA_PROPERTY_ID`) are absent.

### Upload

| Method           | Path          | Auth        | Rate-limited |
| ---------------- | ------------- | ----------- | ------------ |
| `POST`, `DELETE` | `/api/upload` | requireAuth | yes          |

`POST` accepts multipart/form-data and returns a CloudFront URL after Sharp → WebP conversion. `DELETE` removes an object by key prefix.

### Certifications extract

| Method | Path                                | Auth        | Rate-limited |
| ------ | ----------------------------------- | ----------- | ------------ |
| `POST` | `/api/admin/certifications/extract` | requireAuth | yes          |

---

## Auth

Auth routes implement the Cognito Hosted UI OAuth code flow. They manage HTTP-only cookies and do not use the standard auth helpers — they are the auth layer itself.

| Method | Path                 | Auth   | Rate-limited | Notes                                                              |
| ------ | -------------------- | ------ | ------------ | ------------------------------------------------------------------ |
| `GET`  | `/api/auth/callback` | public | no           | Exchanges Cognito auth code for tokens; sets `access_token` cookie |
| `GET`  | `/api/auth/me`       | public | no           | Returns current user from cookie if valid, else `null`             |
| `POST` | `/api/auth/refresh`  | public | no           | Exchanges refresh token for new access token                       |
| `POST` | `/api/auth/signout`  | public | no           | Clears session cookies                                             |

---

## Import/Export

Each entity has individual import and export routes. There is also a unified export/import pair for full-site backup and restore.

Export routes return raw file content (CSV or JSON) with `Content-Disposition: attachment` — no `{ data }` envelope.

### Per-entity import / export

All export routes use `GET`; all import routes use `POST`. All require `requireAuth` and are rate-limited.

| Entity         | Export path                      | Import path                       |
| -------------- | -------------------------------- | --------------------------------- |
| About          | `GET /api/about/export`          | `POST /api/about/import`          |
| Blog           | `GET /api/blog/export`           | `POST /api/blog/import`           |
| Certifications | `GET /api/certifications/export` | `POST /api/certifications/import` |
| Education      | `GET /api/education/export`      | `POST /api/education/import`      |
| Experience     | `GET /api/experience/export`     | `POST /api/experience/import`     |
| Hero           | `GET /api/hero/export`           | `POST /api/hero/import`           |
| Messages       | `GET /api/messages/export`       | — (no import)                     |
| Projects       | `GET /api/projects/export`       | `POST /api/projects/import`       |
| Settings       | `GET /api/settings/export`       | `POST /api/settings/import`       |
| Skills         | `GET /api/skills/export`         | `POST /api/skills/import`         |

### Unified export / import

| Method | Path                        | Auth        | Rate-limited | Notes                                            |
| ------ | --------------------------- | ----------- | ------------ | ------------------------------------------------ |
| `GET`  | `/api/admin/export/unified` | requireAuth | yes          | Exports all entities as a single JSON bundle     |
| `POST` | `/api/admin/import/unified` | requireAuth | yes          | Restores all entities from a unified JSON bundle |

Import processes entities in dependency order (`IMPORT_ORDER` in `src/lib/import-export/unified-import.ts`). Each row is validated against the entity's Zod create schema before writing.

---

## Translation

| Method | Path                   | Auth        | Rate-limited | Notes                                                                      |
| ------ | ---------------------- | ----------- | ------------ | -------------------------------------------------------------------------- |
| `GET`  | `/api/admin/translate` | requireAuth | yes          | Returns a translation plan (list of items needing Japanese content)        |
| `POST` | `/api/admin/translate` | requireAuth | yes          | Executes one item from the plan using Claude Haiku; prompt caching enabled |

The translation API uses Claude Haiku (`claude-haiku-4-5-20251001`) with `cache_control: { type: "ephemeral" }` on the system prompt so sequential calls within a 5-minute window get cached input pricing. Only EN → JA translation is supported; skills and certifications content stays in English.

---

## Health

| Method | Path          | Auth   | Rate-limited |
| ------ | ------------- | ------ | ------------ |
| `GET`  | `/api/health` | public | no           |

Returns `{ "status": "ok" }` and HTTP 200. Used by the admin dashboard's site-health card and uptime monitors.

---

## MCP Server

The portfolio MCP server (`mcp/portfolio-server/`) exposes the full admin CMS as a tool surface for AI assistants and programmatic clients.

**Transport:** stdio  
**Auth:** `Authorization: Bearer <api-key>` on every request (same SHA-256 hashed API key as the REST layer)  
**Default target:** `http://localhost:3000` (dev Neon branch) — use the `portfolio-prod` MCP server configuration to target `https://asakurayuta.dev` (production Neon branch)

> Content changes via the `portfolio` MCP server only affect the **dev database**. For production changes, use the `portfolio-prod` MCP server tools (`mcp__portfolio-prod__*`).

### Tool domains

| File                      | Tools                                                                                                                   | Count  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------ |
| `tools/projects.ts`       | `list-projects`, `get-project`, `create-project`, `update-project`, `delete-project`, `reorder-projects`                | 6      |
| `tools/blog.ts`           | `list-blog-posts`, `get-blog-post`, `create-blog-post`, `update-blog-post`, `delete-blog-post`                          | 5      |
| `tools/certifications.ts` | `list-certifications`, `create-certification`, `update-certification`, `delete-certification`, `reorder-certifications` | 5      |
| `tools/education.ts`      | `list-education`, `create-education`, `update-education`, `delete-education`, `reorder-education`                       | 5      |
| `tools/experience.ts`     | `list-experience`, `create-experience`, `update-experience`, `delete-experience`, `reorder-experience`                  | 5      |
| `tools/skills.ts`         | `list-skills`, `create-skill`, `update-skill`, `delete-skill`, `reorder-skills`                                         | 5      |
| `tools/messages.ts`       | `list-messages`, `get-message`, `mark-message-read`, `archive-message`, `bulk-update-messages`                          | 5      |
| `tools/content.ts`        | `get-about`, `update-about`, `get-hero`, `update-hero`, `get-settings`, `update-settings`                               | 6      |
| `tools/dashboard.ts`      | `get-dashboard-stats`                                                                                                   | 1      |
| **Total**                 |                                                                                                                         | **43** |

### Security notes

- **No `delete-message` tool.** Messages can be listed, read, marked-read, archived, and bulk-updated, but not deleted via MCP. This is intentional — contact form submissions are not recoverable.
- API key auth uses SHA-256 hashing; raw keys are never stored. `lastUsedAt` is updated fire-and-forget on each successful authentication.
- Reorder tools accept an ordered array of **all** entity IDs for that entity type; partial arrays are rejected.

### Setup

```bash
npm run mcp:setup   # generates the MCP config with the current API key
```

See `mcp/portfolio-server/README.md` for full setup and configuration details.
