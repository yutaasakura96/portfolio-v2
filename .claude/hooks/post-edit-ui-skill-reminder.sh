#!/bin/bash
# PostToolUse hook: remind to use UI skills after editing component/page .tsx files
# Only fires for .tsx files under src/components/ or src/app/ — skips API routes and non-UI files.

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

[ -z "$file_path" ] && exit 0

# Only trigger for .tsx files in component/page directories
case "$file_path" in
  */src/components/*.tsx|*/src/app/\(public\)/*.tsx|*/src/app/\(admin\)/*.tsx)
    ;;
  *)
    exit 0
    ;;
esac

# Skip shadcn ui primitives — those are managed by the CLI
case "$file_path" in
  */src/components/ui/*)
    exit 0
    ;;
esac

# Check if the file has animation/transition related code
has_animation=false
if grep -qE '(transition|animate|motion|transform|scale|opacity|keyframes|@starting-style|ease-|duration-)' "$file_path" 2>/dev/null; then
  has_animation=true
fi

# Build the reminder message
msg=""

if [ "$has_animation" = true ]; then
  msg="UI Skills reminder: This file contains animation/transition code. Consider invoking the **emil-design-eng** skill to review animation decisions (easing, duration, transform-origin)."
fi

# Always suggest web-design-guidelines for component files
if [ -n "$msg" ]; then
  msg="$msg Also consider running **/web-design-guidelines** on this file before merging."
else
  msg="UI Skills reminder: Consider running **/web-design-guidelines** on changed UI files before merging for a11y and best-practice compliance."
fi

echo "$msg"
exit 0
