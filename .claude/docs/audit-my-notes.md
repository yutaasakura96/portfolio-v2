## Planned MCP Servers (Install in Phase 5)

The audit's MCP suggestions are incomplete. When generating root CLAUDE.md,
include these planned MCP servers:

- context7 (--scope user): Live docs for Next.js 16, Prisma 7, TailwindCSS 4
- prisma-local (--scope local): Migration status, schema management
  (LOCAL only — remote Prisma MCP is irrelevant for Neon PostgreSQL)
- aws (--scope local): Infrastructure, deployments, CloudWatch logs

These will be installed in Phase 5 but should be documented in CLAUDE.md
so Claude knows they're available.

## AWS Infrastructure

See .claude/docs/infrastructure.md for full AWS environment details.
The aws-deploy skill and db-agent should reference this document.
