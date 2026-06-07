#!/bin/bash
# PostToolUse hook: after a git commit, check if significant areas changed
# and suggest running the maintenance-agent (mode: docs) to keep docs in sync.
# Reads tool input from stdin JSON, checks committed files against patterns.

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Only act on git commit commands
echo "$command" | grep -qE '^git commit' || exit 0

# Get files changed in the last commit
changed=$(git diff --name-only HEAD~1..HEAD 2>/dev/null)
[ -z "$changed" ] && exit 0

# Check for significant patterns
areas=()
echo "$changed" | grep -qE '^prisma/schema\.prisma$' && areas+=("schema")
echo "$changed" | grep -qE '^prisma/migrations/' && areas+=("migrations")
echo "$changed" | grep -qE '^src/app/api/.*/route\.ts$' && areas+=("API routes")
echo "$changed" | grep -qE '^src/app/.*/page\.tsx$' && areas+=("pages")
echo "$changed" | grep -qE '^\.claude/agents/' && areas+=("agents")
echo "$changed" | grep -qE '^\.claude/rules/' && areas+=("rules")

# If nothing significant, stay silent
[ ${#areas[@]} -eq 0 ] && exit 0

# Build a readable list of areas
area_list=$(IFS=', '; echo "${areas[*]}")

echo ""
echo "This commit touched significant areas: ${area_list}."
echo "Consider running the maintenance-agent (mode: docs) to update project docs."

exit 0
