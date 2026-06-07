---
name: tailwind-v4
description: Use when adding or changing Tailwind classes, theme tokens, or component variants in this project. Tailwind v4 has no JS config file — theme lives in @theme inside globals.css. Covers the v3→v4 differences relevant to this codebase.
---

# TailwindCSS 4 Skill

This project runs Tailwind v4 with `@tailwindcss/postcss`. There is **no `tailwind.config.ts`** — theme tokens are declared in CSS via `@theme`. Most v3 tutorials still floating around won't apply directly.

## When to use

- Adding theme tokens (colors, spacing, fonts, breakpoints).
- Composing class strings in components.
- Building a component variant system with CVA.
- Investigating why a class isn't being applied.

## v3 → v4 differences relevant here

| v3                                                           | v4 (this project)                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `tailwind.config.ts` with `theme.extend`                     | `@theme` directive in [src/app/globals.css](../../../src/app/globals.css) |
| `@tailwind base; @tailwind components; @tailwind utilities;` | Single `@import "tailwindcss";`                                           |
| PostCSS config with `tailwindcss` plugin                     | PostCSS config with `@tailwindcss/postcss` plugin                         |
| Custom plugins via `plugins: [...]` in JS                    | Cannot use JS plugins — use CSS variables + `@layer utilities`            |
| `theme()` in CSS                                             | Use the CSS variable directly: `var(--color-primary)`                     |
| Default `content: [...]` array                               | Auto-detected; no need to configure                                       |

## Theme tokens

Theme tokens are CSS variables under `@theme`:

```css
/* src/app/globals.css */
@theme {
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  --color-primary: oklch(0.6 0.2 240);
  /* ... */
}
```

Tailwind generates utilities from these automatically:

- `--color-background` → `bg-background`, `text-background`, `border-background`
- `--font-sans` → `font-sans`
- `--radius-md` → `rounded-md`

When adding a new token, declare it in `@theme` and reference it as the matching utility class — don't add a separate utility.

## Composing classes

Always use `cn()` from [src/lib/utils.ts](../../../src/lib/utils.ts) for conditional/dynamic classes. It wraps `clsx` + `tailwind-merge` so conflicts resolve correctly.

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn(
    "rounded-md p-4 transition",
    isActive && "bg-primary text-primary-foreground",
    className
  )}
/>;
```

Never:

```tsx
<div className={`rounded-md p-4 ${isActive ? "bg-primary" : ""}`} />  // ❌
<div className={"rounded-md p-4 " + extra} />                          // ❌
```

## Component variants with CVA

Use `class-variance-authority` for components with multiple visual states. Reference: [src/components/ui/button.tsx](../../../src/components/ui/button.tsx).

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground", // base
  {
    variants: {
      variant: {
        default: "shadow-sm",
        elevated: "shadow-lg",
      },
      padding: {
        sm: "p-3",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: { variant: "default", padding: "md" },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}
```

## Dark mode — prefer theme tokens, use `dark:` only when needed

Dark mode is wired: `<ThemeProvider attribute="class">` lives in the root layout (`src/app/layout.tsx`), the toggle is in the public `Header`, and full `.dark` token overrides are defined in `globals.css`.

Default to **theme tokens** — they adapt automatically:

- `bg-background` / `text-foreground` — page surfaces and primary text
- `bg-card` / `text-card-foreground` — elevated cards
- `bg-muted` / `text-muted-foreground` — subdued surfaces and secondary text
- `bg-accent` — hover backgrounds
- `bg-primary` / `text-primary-foreground` — primary CTA colors (note: in dark mode these invert; use `bg-foreground text-background` for "always-inverted" CTA bands)
- `border-border` / `border-input` — neutral borders
- `ring-ring` — focus ring color

Reach for `dark:` variants only when a token can't express the contrast you need:

- **Status colors** (red/green/blue banners) where the token system has no equivalent: `bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300`.
- **Code blocks** that should stay dark in both modes (`prose-pre:bg-gray-900`) — that's intentional with `github-dark.css` highlighting; leave as-is.

Avoid: hardcoded `bg-gray-*`, `text-gray-*`, `bg-white`, `bg-black`, `border-gray-*` for neutrals. Migrate to tokens when you find them.

## Animations

Use `tw-animate-css` utility classes. Don't write inline `@keyframes`.

```tsx
<div className="animate-in fade-in slide-in-from-bottom-2 duration-300" />
```

Radix-driven state animations (open/close, in/out) are already configured in shadcn primitives — don't reimplement.

## Prose / typography

Markdown rendered via `@tailwindcss/typography` — wrap rendered HTML in `prose dark:prose-invert max-w-none`:

```tsx
<article className="prose max-w-none" dangerouslySetInnerHTML={{ __html }} />
```

## Common mistakes

- ❌ Creating a `tailwind.config.ts` — v4 doesn't use one.
- ❌ Using `@apply` heavily inside components — prefer composing utility classes in JSX. `@apply` is fine for the occasional global style in `globals.css`.
- ❌ Hardcoding colors (`bg-[#fff]`, `text-gray-900`) instead of theme tokens (`bg-background`, `text-foreground`).
- ❌ Adding a v3-style PostCSS plugin — only `@tailwindcss/postcss` should be in `postcss.config.mjs`.
- ❌ Importing `tailwindcss/colors` in JS — that's a v3 pattern; v4 colors come from `@theme`.
- ❌ Reaching for `dark:` variants when a theme token would do — `text-muted-foreground` already adapts; `dark:text-gray-300` is the wrong tool. See "Dark mode" above.
- ❌ Skipping `cn()` for static class lists — that's fine; just use `cn()` whenever there's any condition.

## Reference files

- Theme tokens: [src/app/globals.css](../../../src/app/globals.css)
- PostCSS config: [postcss.config.mjs](../../../postcss.config.mjs)
- `cn` helper: [src/lib/utils.ts](../../../src/lib/utils.ts)
- CVA example: [src/components/ui/button.tsx](../../../src/components/ui/button.tsx)
- shadcn config: [components.json](../../../components.json)
