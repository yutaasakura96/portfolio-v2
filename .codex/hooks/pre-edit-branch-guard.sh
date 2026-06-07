#!/bin/bash
# PreToolUse hook: block Edit/Write on protected branches (main, develop).
# Forces a feature branch to be created before any code changes.

# Not a git repo — nothing to guard
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

branch=$(git symbolic-ref --short HEAD 2>/dev/null)

case "$branch" in
  main|develop)
    echo "You're on '$branch'. Create a feature branch before editing code:"
    echo "  git checkout -b feature/<short-name>"
    exit 2
    ;;
esac

exit 0
