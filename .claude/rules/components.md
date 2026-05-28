Pattern: src/components/\*_/_.tsx

# Component Rules

- File name = component name (`PascalCase.tsx`). One default-exported component per file. shadcn primitives in `src/components/ui/` keep the lowercase shadcn naming.
- Add `"use client"` ONLY if the component uses hooks, event handlers, or browser APIs. Default to Server Components everywhere else.
- Compose Tailwind classes with `cn()` from `@/lib/utils`. Never use template-literal class concatenation.
- Components with multiple visual states use CVA (see `src/components/ui/button.tsx` as the reference pattern).
- Reference theme tokens (`bg-background`, `text-foreground`) instead of hardcoded colors. Theme is defined in `src/app/globals.css` `@theme` block.
- Forms inside components: react-hook-form + `@hookform/resolvers/zod` + Sonner toasts. Schemas come from `src/lib/validations/`.
- Data fetching from a Client Component goes through `apiClient` (from `@/lib/api-client`) wrapped in TanStack Query. Never call `fetch` directly.
- Server Component data fetching for public pages goes through `@/lib/data/public-queries`. Do NOT call Prisma directly from a page component.
- Images use `next/image`. External hosts must be allow-listed in `next.config.ts` `images.remotePatterns`. Public images point at `NEXT_PUBLIC_CLOUDFRONT_URL`.
- Markdown rendering goes through `@/lib/markdown` (sanitized pipeline). Do not call remark/rehype ad-hoc — sanitization is mandatory.
- Type imports use `import type` and live alongside other `@/` imports.
- Do NOT introduce Zustand (removed from the project). Local state stays in `useState`/`useReducer`; server state stays in TanStack Query.
- Dark mode is wired via `next-themes` (`<ThemeProvider attribute="class">` in the root layout, toggle in the public `Header`). Prefer theme tokens (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `bg-primary` / `text-primary-foreground`) — they adapt to both modes automatically. Use `dark:` variants only when the token system can't express the contrast you need (e.g. status banners that have no token equivalent — `bg-green-50 dark:bg-green-950`). Code-block colors that should stay dark in both modes (e.g. `prose-pre:bg-gray-900`) are an acceptable exception.
- Do NOT edit files in `src/components/ui/` by hand for shadcn primitive updates — use `npx shadcn@latest add <component>` so the registry stays in sync.
- Avoid prop drilling more than two levels — lift to a query hook (TanStack) or a layout-level provider instead.
- Accessibility: all interactive elements need a label (`aria-label` or visible text). Modals/dialogs use Radix primitives so focus trapping is handled — don't roll your own.
- Import/export UI: admin pages use `<ImportExportToolbar>` (from `src/components/admin/ImportExportToolbar.tsx`) which bundles `ExportButtons` + `ImportDialog`. Pass the entity's config from `entityConfigs` in `src/lib/import-export/entity-configs.ts`. Do not build ad-hoc export/import UIs per page.
