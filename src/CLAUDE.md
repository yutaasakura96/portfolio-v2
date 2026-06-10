# Frontend Rules — `src/`

Applies to everything under `src/` (components, hooks, app routes, libs).

## Component Naming

- **Files: `PascalCase.tsx`** for React components (e.g. `ProjectForm.tsx`, `Header.tsx`).
- **Files: `kebab-case.ts`** for non-component modules (e.g. `api-client.ts`, `public-queries.ts`).
- **Hooks: `use-kebab-case.ts`** in [src/hooks/](src/hooks/) (matching existing `use-auth.ts`, `use-dashboard-stats.ts`, `use-messages.ts`, `use-dnd-reorder.ts`, `use-reveal.ts`, `use-settings.ts`). Generic reusable hooks belong here — e.g. `use-dnd-reorder.ts` encapsulates dnd-kit draft state + TanStack Query save mutation for any entity with `displayOrder`.
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
- **Dark mode:** wired via `next-themes` (`<ThemeProvider attribute="class">` in [src/components/providers/ThemeProvider.tsx](src/components/providers/ThemeProvider.tsx), mounted from [src/app/layout.tsx](src/app/layout.tsx); toggle in [src/components/shared/ThemeToggle.tsx](src/components/shared/ThemeToggle.tsx) mounted in both the public `Header` and `AdminHeader`). Prefer theme tokens (`bg-background`, `text-foreground`, `border-border`, `bg-muted`, `bg-accent`, etc.) which adapt to both modes. Use `dark:` variants only when the token system can't express the contrast (e.g., status banners that have no token equivalent).
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
- Uploads go through [src/app/api/upload/route.ts](src/app/api/upload/route.ts). Images are processed with Sharp into route-specific variants; resume and education PDFs are uploaded as PDFs.
- Configure new external image hosts in [next.config.ts](next.config.ts) `images.remotePatterns`.

## Internationalization (i18n)

This project supports EN (default) and JA locales. Only two locales — do not add more without discussion.

### How locale flows

1. `LocaleProvider` (`src/components/providers/LocaleProvider.tsx`) wraps the public layout. It persists the selected locale to `localStorage` (mirrors next-themes pattern). Renders `"en"` on the server and hydrates from `localStorage` on the client to avoid mismatch.
2. `useLocale()` (`src/hooks/use-locale.ts`) reads/sets locale from context in Client Components.
3. `LanguageToggle` (`src/components/shared/LanguageToggle.tsx`) is a `"use client"` toggle button rendered in the public `Header`.

### Server-side translation helpers (`src/lib/i18n.ts`)

| Helper                                | Use                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `t(enValue, jaValue, locale)`         | Single string field — returns `jaValue` when locale is `"ja"` and `jaValue` is non-null, otherwise `enValue` |
| `tArray(enArr, jaArr, locale)`        | String arrays (e.g. `highlights`)                                                                            |
| `tJson(enJson, jaJson, locale)`       | JSON fields (e.g. `ctaButtons`)                                                                              |
| `ui(locale, key)`                     | Static UI strings — reads from `UI_STRINGS[locale][key]`. All keys must exist in both `en` and `ja` objects. |
| `localizeSkillCategory(name, locale)` | Translates freeform skill category names                                                                     |

### Adding new translatable content

1. Add `*Ja` nullable columns to the Prisma model (e.g. `titleJa String? @db.VarChar(200)`). Run `prisma:migrate:dev`.
2. Add the new field to the `select` in `src/lib/data/public-queries.ts`.
3. Update `src/lib/data/types.ts` to include the `*Ja` field.
4. Wrap the field in `t()` / `tArray()` / `tJson()` at the call site, passing both EN and JA values plus the locale.
5. Trigger translation via the admin translations page (`/admin/translations`) or the translation API. `GET /api/admin/translate` returns the project/blog translation plan; `POST /api/admin/translate` translates one target at a time (`hero`, `about`, `settings`, `project`, `blogPost`, `experience`, `education`).

### Adding new static UI strings

Add entries to both `en` and `ja` keys in the `UI_STRINGS` map in `src/lib/i18n.ts`. Access via `ui(locale, "yourKey")`. Never hard-code English text in components that are i18n-aware.

### ISR compatibility

Public pages are Server Components with ISR (`revalidate = 60`). They pass **both** EN and JA data down to `LocalizedText` / `LocalizedHtml` / `LocalizedUi` client components (`src/components/public/LocalizedContent.tsx`), which pick the correct value based on the client-side locale. The server never needs to know the user's locale — all switching is client-side.

### What stays English

Skills and Certifications **content** (names, descriptions) stays English — these are technical terms. Section headings and UI chrome for those sections are translated via `UI_STRINGS`.
