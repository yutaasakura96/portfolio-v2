Prepare the current branch for a PR:

1. Run `npm run lint`, `npm run type-check`, and `npm test -- --run`
2. If any fail, report the failures and stop
3. If all pass, run `git log develop..HEAD --oneline` to see all commits
4. Summarize what changed and draft a PR title + description following this format:

```
## Summary
- bullet points of changes

## Test plan
- [ ] verification steps
```

Do NOT create the PR — just output the draft for review.
