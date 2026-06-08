---
name: nextjs-app-router
description: Use when adding a new route segment, layout, loading state, error boundary, or middleware to this Next.js 16 App Router project. Covers proxy.ts (the middleware replacement in Next 16), ISR, route groups, and the public/admin split.
---

# Next.js 16 App Router Skill

This project uses Next.js 16 App Router with a specific public/admin split via route groups. Many App Router patterns from blog posts/tutorials predate Next.js 16 — use this guide for THIS project.

## When to use

- Adding a new public page → goes in `src/app/(public)/<segment>/page.tsx`.
- Adding a new admin page → goes in `src/app/(admin)/admin/(shell)/<segment>/page.tsx`.
- Adding a loading or error boundary.
- Touching the middleware (`src/proxy.ts`).
- Setting `revalidate`, `dynamic`, or `runtime` for a route.

## Project's route structure

```
src/app/
├── layout.tsx              # Root layout — fonts, QueryProvider. NOT public/admin specific.
├── globals.css             # Tailwind + theme tokens
├── proxy.ts                # Next 16 middleware — JWT guard for /admin
├── (public)/
│   ├── layout.tsx          # Header + Footer + GA
│   ├── page.tsx            # Homepage (ISR)
│   ├── projects/page.tsx   # ISR list
│   ├── projects/[slug]/page.tsx  # ISR detail with generateStaticParams
│   └── ...
├── (admin)/
│   └── admin/
│       ├── login/page.tsx  # Login (no shell)
│       └── (shell)/
│           ├── layout.tsx  # Sidebar + Header + auth guard ("use client")
│           ├── page.tsx    # Dashboard (server component — anomaly)
│           └── <entity>/page.tsx  # CRUD pages (client components)
└── api/                    # REST routes (see src/app/api/CLAUDE.md)
```

Route groups `(public)` and `(admin)` do NOT affect URLs — they exist to give each tree its own layout.

## Public page pattern (ISR)

Use this pattern for any page under `src/app/(public)/`:

```tsx
// src/app/(public)/projects/page.tsx
import { getPublicProjects } from "@/lib/data/public-queries";

export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getPublicProjects();
  return <ProjectList projects={projects} />;
}
```

For dynamic segments with a known set of slugs:

```tsx
// src/app/(public)/projects/[slug]/page.tsx
export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetail project={project} />;
}
```

**Note:** In Next.js 16 `params` is a Promise — always `await` it.

## Admin page pattern

```tsx
// src/app/(admin)/admin/(shell)/projects/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export default function AdminProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["projects", "admin"],
    queryFn: () => apiClient.get("/api/projects?status=all"),
  });
  // ...
}
```

The current dashboard at `src/app/(admin)/admin/(shell)/page.tsx` is a Server Component calling Prisma directly — this is the audit's anti-pattern #3. Do not copy it for new admin pages.

## Loading states

Each route segment SHOULD have a `loading.tsx`. Today only one exists. When you add a new public page, also add:

```tsx
// src/app/(public)/<segment>/loading.tsx
export default function Loading() {
  return (
    <div className="container py-8">
      <Skeleton />
    </div>
  );
}
```

## Error boundaries

Each route segment SHOULD have an `error.tsx`. The repo has `(public)/error.tsx` and an admin one but no root `error.tsx`. When adding a critical new segment, add an `error.tsx` mirroring the existing public one.

```tsx
// src/app/(public)/<segment>/error.tsx
"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container py-8">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## Middleware — `proxy.ts` (NOT `middleware.ts`)

In Next.js 16, the convention is `proxy.ts` exporting a `proxy` function. Do NOT create a `middleware.ts` — that's the Next 14/15 file and won't run in Next 16.

```ts
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // JWT check for /admin routes (uses jose, which needs Node)
  // ...
  return NextResponse.next();
}

// Next 16 runs proxy.ts in the Node runtime by default — no `runtime` field needed.
export const config = {
  matcher: ["/admin/:path*"],
};
```

## Cache control on API routes

When an API route mutates data that affects a public page, call `revalidatePath`:

```ts
import { revalidatePath } from "next/cache";

// after a successful update
revalidatePath("/projects");
revalidatePath(`/projects/${slug}`);
if (project.featured) revalidatePath("/");
```

## Common mistakes

- ❌ Creating `middleware.ts` instead of editing `src/proxy.ts`.
- ❌ Forgetting `await params` in dynamic routes (Next 16 made params async).
- ❌ Adding `"use client"` to a server component just to fetch data — fetch directly with `await` instead.
- ❌ Using `getServerSideProps` or `getStaticProps` — those are Pages Router APIs, not used here.
- ❌ Setting `dynamic = "force-dynamic"` on a public page that should be ISR — use `revalidate = N` instead.
- ❌ Creating `loading.tsx` as a Client Component — it can be a Server Component (faster, no hydration).
- ❌ Calling Prisma from a public page directly — go through `src/lib/data/public-queries.ts`.

See root [AGENTS.md §Common Mistakes](../../../AGENTS.md#common-mistakes-this-project-specifically) for project-wide pitfalls (auth import path, env-var naming, `await rateLimit()`, etc.) that apply across all routes.

## Reference files

- Public page: [src/app/(public)/page.tsx](<../../../src/app/(public)/page.tsx>)
- Public detail with `generateStaticParams`: [src/app/(public)/projects/[slug]/page.tsx](<../../../src/app/(public)/projects/[slug]/page.tsx>)
- Admin layout (auth guard): [src/app/(admin)/admin/(shell)/layout.tsx](<../../../src/app/(admin)/admin/(shell)/layout.tsx>)
- Middleware: [src/proxy.ts](../../../src/proxy.ts)
