# Portfolio MCP Server

Local MCP server for managing portfolio content via Claude Code and Codex agents. Provides 43 tools across 9 domains with API key authentication over stdio transport.

## Architecture

```
Claude Code / Codex (stdio)
        │
        ▼
  portfolio-server        ← thin authenticated HTTP adapter
        │
        ▼  Authorization: Bearer <key>
  Next.js API routes      ← Zod validation, withErrorHandler, rate limiting
        │
        ▼
  Prisma + Neon Postgres
```

The server never accesses the database directly. Every tool maps to one or more HTTP requests against the Next.js API, which handles validation, auth verification, and cache invalidation. This preserves the API layer as a single security boundary.

## Security Model

### API Key Lifecycle

1. `npm run mcp:setup` generates a 32-char key via `nanoid(32)` (~190-bit entropy)
2. The key is SHA-256 hashed and stored in the `ApiKey` table — the raw key is never persisted
3. The raw key is appended to `.env` (gitignored) and shown once in the terminal
4. On each request, `requireApiKey()` in `src/app/api/auth.ts` hashes the incoming Bearer token and looks up the hash

### Dual Auth

API routes accept either authentication method:

- **Browser admin**: JWT in HTTP-only cookie via AWS Cognito (`requireAuth()`)
- **MCP server / API clients**: Bearer token in Authorization header (`requireApiKey()`)

The unified helper `requireAuthOrApiKey(request)` tries cookies first, then falls back to API key.

### Message Deletion Boundary

Message deletion is intentionally restricted to browser-admin-only auth:

- `DELETE /api/messages/[id]` uses `requireAuth()` (cookie only)
- The MCP server has no delete tool for messages — only list, read, mark-read, archive, and bulk-update
- This prevents automated mass deletion of contact messages

## Tools Reference

### Projects (6 tools)

| Tool               | Description                                       |
| ------------------ | ------------------------------------------------- |
| `list-projects`    | Filter by status, featured, search; paginated     |
| `get-project`      | Fetch by ID                                       |
| `create-project`   | Slug must be unique kebab-case; defaults to DRAFT |
| `update-project`   | Partial update by ID                              |
| `delete-project`   | Permanent delete                                  |
| `reorder-projects` | Set displayOrder via ordered ID array             |

### Experience (5 tools)

| Tool                 | Description                                |
| -------------------- | ------------------------------------------ |
| `list-experience`    | Filter by visible (true/false/all)         |
| `create-experience`  | Company, role, dates, highlights, techTags |
| `update-experience`  | Partial update by ID                       |
| `delete-experience`  | Permanent delete                           |
| `reorder-experience` | Set displayOrder via ordered ID array      |

### Education (5 tools)

| Tool                | Description                              |
| ------------------- | ---------------------------------------- |
| `list-education`    | Filter by visible                        |
| `create-education`  | Institution, degree, field, achievements |
| `update-education`  | Partial update by ID                     |
| `delete-education`  | Permanent delete                         |
| `reorder-education` | Set displayOrder via ordered ID array    |

### Skills (5 tools)

| Tool             | Description                                   |
| ---------------- | --------------------------------------------- |
| `list-skills`    | Filter by visible; optional category grouping |
| `create-skill`   | Name, category, proficiency level             |
| `update-skill`   | Partial update by ID                          |
| `delete-skill`   | Permanent delete                              |
| `reorder-skills` | Set displayOrder via ordered ID array         |

### Certifications (5 tools)

| Tool                     | Description                                  |
| ------------------------ | -------------------------------------------- |
| `list-certifications`    | Filter by visible                            |
| `create-certification`   | Name, issuer, dates, credential URLs, images |
| `update-certification`   | Partial update by ID                         |
| `delete-certification`   | Permanent delete                             |
| `reorder-certifications` | Set displayOrder via ordered ID array        |

### Messages (5 tools — no delete)

| Tool                   | Description                             |
| ---------------------- | --------------------------------------- |
| `list-messages`        | Filter by read/archived/sort; paginated |
| `get-message`          | Fetch by ID (auto-marks as read)        |
| `mark-message-read`    | Set read flag                           |
| `archive-message`      | Archive (hides from inbox)              |
| `bulk-update-messages` | Batch update read/archived flags        |

### Blog (5 tools)

| Tool               | Description                         |
| ------------------ | ----------------------------------- |
| `list-blog-posts`  | Filter by status, search; paginated |
| `get-blog-post`    | Fetch by ID                         |
| `create-blog-post` | Markdown content; defaults to DRAFT |
| `update-blog-post` | Partial update by ID                |
| `delete-blog-post` | Permanent delete                    |

### Content (6 tools)

| Tool              | Description                          |
| ----------------- | ------------------------------------ |
| `get-about`       | About page content                   |
| `update-about`    | Update heading, bio, profile info    |
| `get-hero`        | Hero section (headline, bio, CTA)    |
| `update-hero`     | Update hero fields                   |
| `get-settings`    | Site name, description, social links |
| `update-settings` | Update site settings                 |

### Dashboard (1 tool)

| Tool                  | Description                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `get-dashboard-stats` | Entity counts, published/draft breakdowns, recent activity, unread messages, expiring certs |

## Setup

### Prerequisites

- `.env` with `DATABASE_URL` configured
- Next.js dev server running at `localhost:3000` (or set `PORTFOLIO_BASE_URL`)

### Generate API Key

```bash
npm run mcp:setup
```

This prompts for a description, generates the key, stores the hash in the database, and appends `PORTFOLIO_API_KEY=<key>` to `.env`. The raw key is shown once and never stored.

### Configuration

The server is registered in two config files:

**Claude Code** (`.mcp.json`):

```json
{
  "portfolio": {
    "type": "stdio",
    "command": "npx",
    "args": ["tsx", "--env-file=.env", "mcp/portfolio-server/src/index.ts"]
  }
}
```

**Codex** (`.codex/config.toml`):

```toml
[mcp_servers.portfolio]
command = "npx"
args = ["tsx", "--env-file=.env", "mcp/portfolio-server/src/index.ts"]
```

### Environment Variables

| Variable             | Required | Default                 | Description                    |
| -------------------- | -------- | ----------------------- | ------------------------------ |
| `PORTFOLIO_API_KEY`  | Yes      | —                       | Raw API key (from `mcp:setup`) |
| `PORTFOLIO_BASE_URL` | No       | `http://localhost:3000` | Next.js server URL             |

## Extending

To add tools for a new domain:

1. Create `src/tools/<domain>.ts`
2. Export a registration function:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost } from "../client.js";
import { ok, err } from "../types.js";

export function registerNewTools(server: McpServer): void {
  server.tool(
    "list-things",
    "List all things.",
    { visible: z.enum(["true", "false", "all"]).default("all") },
    async (input) => {
      try {
        const data = await apiGet("/api/things", { visible: input.visible });
        return ok(data);
      } catch (e) {
        return err(e);
      }
    }
  );
}
```

3. Import and register in `src/index.ts`:

```typescript
import { registerNewTools } from "./tools/new.js";
registerNewTools(server);
```

4. Add the corresponding API route if it doesn't exist.

## File Structure

```
mcp/portfolio-server/
  src/
    index.ts              # Server entry, tool registration, instructions
    client.ts             # HTTP adapter (apiGet, apiPost, apiPut, apiDelete)
    types.ts              # ToolResult type, ok/err helpers
    tools/
      projects.ts         # 6 tools
      experience.ts       # 5 tools
      education.ts        # 5 tools
      skills.ts           # 5 tools
      certifications.ts   # 5 tools
      messages.ts         # 5 tools (no delete)
      blog.ts             # 5 tools
      content.ts          # 6 tools (about, hero, settings)
      dashboard.ts        # 1 tool
  package.json
  tsconfig.json

scripts/
  mcp-setup.ts            # One-time API key generation
```
