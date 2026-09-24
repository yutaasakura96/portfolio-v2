# Portfolio v2 — Claude Code

Shared project instructions live in [AGENTS.md](AGENTS.md), the canonical file every agent reads. It is imported below; edit shared guidance there. This file holds only the Claude Code-specific additions. Claude Code sessions skip the §Codex Operating Protocol section of AGENTS.md.

@AGENTS.md

## Claude Code additions

### Slash commands in the workflow spine

- **Spine step 7 (evidence before claiming done):** run `/check` for the quality gate.
- **Spine step 9 (finish deliberately):** use `/pr-ready` to draft the PR.

Both live in [.claude/commands/](.claude/commands/) alongside `/new-route`.

### Built-in subagents

For a quick search/lookup use the built-in `Explore` subagent directly.

### Model selection (Claude Code)

Claude Code uses Anthropic model families for its built-in agent routing. Codex custom agents do **not** use this table; they use the explicit OpenAI model IDs pinned in `.codex/agents/*.toml`.

| Agent              | Default | Override to opus when                               |
| ------------------ | ------- | --------------------------------------------------- |
| db-agent           | sonnet  | Tricky migration (cross-table backfill, custom SQL) |
| code-reviewer      | haiku   | Security-sensitive diff (auth, payment, PII)        |
| maintenance-agent  | sonnet  | Bulk rewrite touching cross-cutting abstractions    |
| Explore (built-in) | haiku   | Search requires synthesizing many unrelated files   |

### MCP servers (Claude Code only)

- **neon** (`mcp__neon__*`) — Hosted Neon MCP server (`https://mcp.neon.tech/mcp`, Streamable HTTP). Branch/project management, usage metrics, and SQL against the Neon project. Auth is per-user OAuth — authorize via `/mcp` in an interactive session; **no API key is stored in `.mcp.json`** (that file is committed). ⚠️ This server can create and delete branches and run SQL against the **production** branch — confirm the target branch before any mutation. The deprecated local `@neondatabase/mcp-server-neon` package is not used. See also the **Neon CLI** under §Commands.
