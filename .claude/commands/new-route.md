Create a new API route at the path specified by $ARGUMENTS.

Follow all conventions in src/app/api/CLAUDE.md and .claude/rules/api-routes.md:

- Wrap handler in `withErrorHandler` from `@/lib/errors`
- Use `requireAuth()` from `@/app/api/auth` for protected routes
- Add Zod validation from `src/lib/validations/`
- Return `{ data: T }` response shape using `Response.json`
- Add `await rateLimit()` if the route accepts user input
- Include proper status codes (200, 201, 400, 401, 404, 422, 429)

After creating the route, run `npm run type-check` to verify.
