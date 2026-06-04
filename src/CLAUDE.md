# Frontend Rules — `src/`

Applies to everything under `src/` (components, hooks, app routes, libs).

## Component Naming

- **Files: `PascalCase.tsx`** for React components (e.g. `ProjectForm.tsx`, `Header.tsx`).
- **Files: `kebab-case.ts`** for non-component modules (e.g. `api-client.ts`, `public-queries.ts`).
- **Hooks: `use-kebab-case.ts`** in [src/hooks/](src/hooks/) (matching existing `use-auth.ts`, `use-messages.ts`, `use-dnd-reorder.ts`). Generic reusable hooks belong here — e.g. `use-dnd-reorder.ts` encapsulates dnd-kit draft state + TanStack Query save mutation for any entity with `displayOrder`.
- **shadcn primitives in [src/components/ui/](src/components/ui/) keep the shadcn lowercase convention** (`button.tsx`, `dialog.tsx`). Do not rename them.
- One component per file. Default export is the component; named exports for variants/types.

## Server vs Client Components — Decision Rules

**Default to Server Components.** Add `"use client"` only when one of these is true:

- The component uses hooks (`useState`, `useEffect`, TanStack Query hooks, react-hook-form).
- The component uses event handlers (`onClick`, `onSubmit`).
- The component uses browser APIs (`window`, `localStorage`, `IntersectionObserver`).
- The component is a context provider.

**Where each goes:**

| Area                           | Default                   | Notes                                                                                                                                                                                     |
| ------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(public)/**/page.tsx` | Server (with ISR)         | `export const revalidate = 60`. Fetch via `src/lib/data/public-queries.ts`. Never call Prisma directly.                                                                                   |
| `src/app/(admin)/**/page.tsx`  | Client (`"use client"`)   | Fetches via `api-client.ts` + TanStack Query. Exception: the dashboard page is currently a server component — do not add new server-rendered admin pages without converting that one too. |
| `src/components/public/**`     | Server unless interactive | Lightboxes, carousels, forms → client. Static cards → server.                                                                                                                             |
| `src/components/admin/**`      | Client                    | Admin UI is form-heavy and stateful.                                                                                                                                                      |
| `src/components/ui/**`         | Mixed (shadcn-decided)    | Don't change the directive shadcn ships with.                                                                                                                                             |

## Import Ordering

ESLint + Prettier handle most of this. The convention to follow when writing new code:

1. React / Next imports (`react`, `next/*`)
2. Third-party packages (alphabetical)
3. Internal `@/` imports (alphabetical)
4. Relative imports (`./`, `../`)
5. Type-only imports last in each group, prefixed with `import type`
6. CSS / asset imports at the very bottom

Use the `@/` path alias for anything outside the current directory. Don't write `../../../lib/...`.

## TailwindCSS 4 Patterns

This project uses **Tailwind v4 with `@tailwindcss/postcss`** — there is no `tailwind.config.ts`. Theme tokens live in [src/app/globals.css](src/app/globals.css) under `@theme`.

- **Class merging:** always use `cn()` from [src/lib/utils.ts](src/lib/utils.ts) when composing classes conditionally. Never string-concat with template literals.
  ```tsx
  // ✅ DO
  <div className={cn("rounded-md p-4", isActive && "bg-primary")} />
  // ❌ DON'T
  <div className={`rounded-md p-4 ${isActive ? "bg-primary" : ""}`} />
  ```
- **Variants:** for components with multiple visual states use `class-variance-authority` (CVA), following the pattern in [src/components/ui/button.tsx](src/components/ui/button.tsx).
- **Theme tokens:** reference CSS variables (`bg-background`, `text-foreground`) — these come from `@theme` in `globals.css`. Don't hardcode `#fff` or `gray-900`.
- **Dark mode:** wired via `next-themes` (`<ThemeProvider attribute="class">` in [src/app/layout.tsx](src/app/layout.tsx); toggle in [src/components/public/ThemeToggle.tsx](src/components/public/ThemeToggle.tsx) mounted in the `Header`). Prefer theme tokens (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `bg-accent`, etc.) which adapt to both modes. Use `dark:` variants only when the token system can't express the contrast (e.g., status banners that have no token equivalent).
- **Signature accent color:** `--accent-signature` (defined in `globals.css` `@theme` block, orange — `oklch(0.75 0.15 55)` light / `oklch(0.65 0.1 55)` dark) is the brand orange used for active indicators: nav link underlines, tab active bars, mobile nav left-border highlight. Reference it as `var(--accent-signature)` (inline style or arbitrary Tailwind value). Do NOT hardcode the orange color — use the token.
- **Animations:** use `tw-animate-css` utilities. Don't write custom keyframes inline.

## State Management

- **Server state:** TanStack React Query 5 only. Mutations go through hooks like `useMessages` ([src/hooks/use-messages.ts](src/hooks/use-messages.ts)). Use `queryClient.invalidateQueries` after mutations.
- **Form state:** react-hook-form + `@hookform/resolvers/zod`. Schema imported from `src/lib/validations/`.
- **URL state:** `useSearchParams` / `nextUrl.searchParams`. Don't reinvent.
- **Client state:** `useState` / `useReducer` for local. **Do not introduce Zustand** — it was removed from the project; do not add it.
- **Toasts:** `sonner` — `toast.success(...)`, `toast.error(...)`. Don't build custom toast components. `<Toaster position="bottom-right" />` is mounted in both the public layout (`src/app/(public)/layout.tsx`) and the admin layout, so Sonner toasts work on all public pages as well as admin pages.

## Data Fetching

| From                      | Use                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Server Component (public) | `src/lib/data/public-queries.ts`                                                                                                                |
| Server Component (admin)  | Generally avoid — admin is client-side. If needed, use Prisma directly via `@/lib/prismaClient`.                                                |
| Client Component          | `apiClient` from [src/lib/api-client.ts](src/lib/api-client.ts) wrapped in TanStack Query (`useQuery` / `useMutation`). Never `fetch` directly. |
| Server Action             | Not used in this project. Use API routes.                                                                                                       |

## Markdown

Render markdown via [src/lib/markdown.ts](src/lib/markdown.ts) — it's the sanitized remark + rehype pipeline. Do not call `remark()` or `rehype()` ad-hoc; the central pipeline includes `rehype-sanitize` which is required for safety. The admin editor is `@uiw/react-md-editor`.

## Images

- Public images: `next/image` with `src` from `NEXT_PUBLIC_CLOUDFRONT_URL`.
- Uploads go through [src/app/api/upload](src/app/api/upload) which converts to WebP via Sharp.
- Configure new external image hosts in [next.config.ts](next.config.ts) `images.remotePatterns`.
