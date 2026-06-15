# Feature Templates

Code examples lifted from working files. Referenced by [feature-workflow.md](./feature-workflow.md). If you change a pattern in the code, update the matching template here.

---

## Public Page Template (from `src/app/(public)/about/page.tsx`)

```tsx
import { Metadata } from "next";
import { getAboutPageIntro, getHero } from "@/lib/data/public-queries";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about ...",
};

// ISR — rebuild this page at most once per hour
export const revalidate = 3600;

const DEFAULT_HEADING = "About Me";

export default async function AboutPage() {
  // Fetch in parallel — never serialize unrelated queries
  const [intro, hero] = await Promise.all([getAboutPageIntro(), getHero()]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-foreground">{intro?.heading ?? DEFAULT_HEADING}</h1>
        <p className="mt-2 text-muted-foreground">{intro?.subheading}</p>
      </div>
      {/* ... */}
    </div>
  );
}
```

**Note:** In Next.js 16 `params` is a Promise — always `await` it in dynamic routes.

---

## Dynamic Route with `generateStaticParams`

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

---

## Public Query Template (from `src/lib/data/public-queries.ts`)

```ts
export async function getAboutPageIntro(): Promise<AboutPage | null> {
  try {
    return await prisma.aboutPage.findUnique({ where: { id: "default" } });
  } catch (error) {
    console.error("Failed to fetch about page intro:", error);
    return null;
  }
}
```

---

## API Route Template (from `src/app/api/projects/route.ts`)

```ts
import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, ProjectStatus, prisma } from "@/lib/prisma-client";
import { projectCreateSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "PUBLISHED";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  if (status === "all" || status === "DRAFT") {
    await requireAuth();
  }

  const where: Prisma.ProjectWhereInput = {};
  if (status !== "all") where.status = status as ProjectStatus;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return Response.json({
    data: projects,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const existing = await prisma.project.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    throw new ApiError("A project with this slug already exists", 409, ErrorCodes.CONFLICT);
  }

  const project = await prisma.project.create({ data: parsed.data });

  revalidatePath("/projects");
  if (project.featured) revalidatePath("/");

  return Response.json({ data: project }, { status: 201 });
});
```

---

## Component Template (from `src/components/public/ProjectCard.tsx`)

```tsx
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: {
    slug: string;
    title: string;
    shortDescription: string;
    techTags: string[];
    thumbnailImage: string;
    liveUrl?: string | null;
  };
  priority?: boolean;
}

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <article className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/projects/${project.slug}`}>
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <Image
            src={project.thumbnailImage}
            alt={project.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
          />
        </div>
      </Link>
      <div className="p-5">
        <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {project.shortDescription}
        </p>
      </div>
    </article>
  );
}
```

---

## Validation Schema Template (from `src/lib/validations/project.ts`)

```ts
import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const projectBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  shortDescription: z.string().min(1, "Short description is required").max(300),
  techTags: z.array(z.string().max(50)).min(1, "At least one tech tag required"),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const projectCreateSchema = projectBaseSchema;
export const projectUpdateSchema = projectBaseSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
```

Always export both schema and inferred type. Derive PATCH schemas via `.partial()` — don't duplicate.
