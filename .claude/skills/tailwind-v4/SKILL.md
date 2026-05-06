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

| v3 | v4 (this project) |
|---|---|
| `tailwind.config.ts` with `theme.extend` | `@theme` directive in [src/app/globals.css](../../../src/app/globals.css) |
| `@tailwind base; @tailwind components; @tailwind utilities;` | Single `@import "tailwindcss";` |
| PostCSS config with `tailwindcss` plugin | PostCSS config with `@tailwindcss/postcss` plugin |
| Custom plugins via `plugins: [...]` in JS | Cannot use JS plugins — use CSS variables + `@layer utilities` |
| `theme()` in CSS | Use the CSS variable directly: `var(--color-primary)` |
| Default `content: [...]` array | Auto-detected; no need to configure |

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

<div className={cn(
  "rounded-md p-4 transition",
  isActive && "bg-primary text-primary-foreground",
  className,
)} />
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
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}
```

## Dark mode — DO NOT add `dark:` to public components

The repo has dark-mode tokens in `globals.css` and `next-themes` installed, but `ThemeProvider` is **not wired** in the root layout. The public site is currently light-only. Adding `dark:` variants to new components creates the appearance of dark mode without it actually working.

If the user explicitly asks to enable dark mode, that's a separate coordinated change: wrap the root layout in `ThemeProvider`, add a toggle, then `dark:` variants are fair game.

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
- ❌ Using `dark:` variants in new public components — see "Dark mode" above.
- ❌ Skipping `cn()` for static class lists — that's fine; just use `cn()` whenever there's any condition.

## Reference files

- Theme tokens: [src/app/globals.css](../../../src/app/globals.css)
- PostCSS config: [postcss.config.mjs](../../../postcss.config.mjs)
- `cn` helper: [src/lib/utils.ts](../../../src/lib/utils.ts)
- CVA example: [src/components/ui/button.tsx](../../../src/components/ui/button.tsx)
- shadcn config: [components.json](../../../components.json)
