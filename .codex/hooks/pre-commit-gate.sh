#!/bin/bash
# PreToolUse hook: run type-check before any git commit command.
# Reads tool input from stdin JSON, checks if it's a git commit, gates on tsc.

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Only gate on git commit commands
echo "$command" | grep -qE '^git commit' || exit 0

# Run type-check — exit 2 blocks the tool call
if ! npm run type-check --silent 2>&1 | tail -5; then
  echo "type-check failed — commit blocked" >&2
  exit 2
fi

exit 0
