#!/bin/bash
# PostToolUse hook: auto-format files after Edit/Write with Prettier
# Reads tool input from stdin JSON, extracts file_path, runs prettier.

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

[ -z "$file_path" ] && exit 0
[ ! -f "$file_path" ] && exit 0

# Only format files Prettier understands
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.md|*.html)
    npx prettier --write "$file_path" 2>/dev/null
    ;;
esac

exit 0
