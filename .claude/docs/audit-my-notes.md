## MCP Servers — Phase 5 DONE (2026-05-23)

All planned servers installed and verified. See CLAUDE.md §MCP Servers for the
authoritative list and per-server usage guidance.

Installed:

- context7 (user scope) — Live docs. Verified with Next.js 16 proxy.ts lookup.
- aws-docs (user scope) — awslabs.aws-documentation-mcp-server (was already
  installed pre-Phase-5).
- aws-iac (user scope) — awslabs.aws-iac-mcp-server (already installed; low
  value here, infra is Amplify Console-managed).
- prisma-local (local scope) — `npx -y prisma mcp`. Verified migrate-status
  against Neon: 10 migrations, schema up to date. LOCAL only — remote Prisma
  MCP is irrelevant for Neon.
- aws-api (local scope) — awslabs.aws-api-mcp-server (uvx). Replaces the
  setup guide's broken `@aws/aws-mcp-server` reference. Verified by listing
  S3 buckets (returned `portfolio-v2-images-1771574702`).

## AWS Infrastructure

See .claude/docs/infrastructure.md for full AWS environment details.
The aws-deploy skill and db-agent should reference this document.
