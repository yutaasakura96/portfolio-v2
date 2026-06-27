#!/bin/bash
# PreToolUse hook: block Edit/Write on protected branches (main, develop).
# Forces a feature branch to be created before any *source* changes.
#
# Planning/doc artifacts are exempt: the superpowers writing-plans skill saves
# to docs/superpowers/plans/ before a worktree exists, and doc-sync work edits
# docs/**/*.md — neither is source code, so neither should be gated. Code under
# src/, prisma/, configs, etc. is still blocked on protected branches.

# Not a git repo — nothing to guard
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

branch=$(git symbolic-ref --short HEAD 2>/dev/null)

case "$branch" in
  main|develop) ;;
  *) exit 0 ;;  # feature branch — allow everything
esac

# On a protected branch. Extract the target file path from the tool input JSON.
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Normalize to a repo-relative path for matching.
repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
rel_path="$file_path"
case "$file_path" in
  "$repo_root"/*) rel_path="${file_path#"$repo_root"/}" ;;
esac

# Exempt planning + documentation artifacts even on protected branches.
# (In bash `case`, `*` spans `/`, so these match at any nesting depth.)
case "$rel_path" in
  docs/superpowers/plans/*) exit 0 ;;  # superpowers plan files (any extension)
  docs/*.md) exit 0 ;;                  # any markdown under docs/, nested or not
esac

echo "You're on '$branch'. Create a feature branch before editing code:"
echo "  git checkout -b feature/<short-name>"
echo "(Planning files under docs/superpowers/plans/ and docs/**/*.md are exempt.)"
exit 2
