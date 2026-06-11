#!/bin/bash
# PreToolUse hook: run full quality suite before any git commit command.
# Reads tool input from stdin JSON, checks if it's a git commit, gates on build + tests.

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Only gate on git commit commands
echo "$command" | grep -qE '^git commit' || exit 0

# npm run build already includes lint
if ! npm run build --silent 2>&1 | tail -10; then
  echo "build failed — commit blocked" >&2
  exit 2
fi

if ! npx vitest run 2>&1 | tail -10; then
  echo "tests failed — commit blocked" >&2
  exit 2
fi

exit 0
