# Data Fetching Utilities

Centralized data access layer for the portfolio application using Prisma ORM.

## Overview

This module provides type-safe, server-side data fetching functions for all content types in the portfolio. All queries use Prisma directly (no API hop) and are optimized for server components and static site generation.

## Architecture

```
src/lib/data/
├── index.ts              # Main export file
├── types.ts              # Shared TypeScript types
├── public-queries.ts     # Public-facing data queries
└── README.md             # This file
```

## Key Features

- ✅ **Type-Safe**: Full TypeScript support with Prisma-generated types
- ✅ **Error Handling**: Graceful fallbacks for all queries
- ✅ **Performance**: Field selection to minimize data transfer
- ✅ **Security**: Only fetches published/visible content
- ✅ **Server-Side**: Designed for React Server Components
- ✅ **SSG Ready**: Functions for `generateStaticParams`

## Usage

### Basic Import

```typescript
import { getHero, getFeaturedProjects, getPublishedPosts } from '@/lib/data';
```

### In Server Components

```tsx
// app/page.tsx
import { getHero, getFeaturedProjects } from '@/lib/data';

export default async function HomePage() {
  const [hero, projects] = await Promise.all([
    getHero(),
    getFeaturedProjects(4),
  ]);

  if (!hero) {
    return <div>Loading...</div>;
  }

  return (
    <main>
      <HeroSection data={hero} />
      <ProjectsSection projects={projects} />
    </main>
  );
}
```

### Static Site Generation

```tsx
// app/projects/[slug]/page.tsx
import { getProjectBySlug, getPublishedProjectSlugs } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const projects = await getPublishedProjectSlugs();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const project = await getProjectBySlug(params.slug);
  
  if (!project) {
    notFound();
  }

  return <ProjectDetail project={project} />;
}
```

### With Navigation

```tsx
// app/projects/[slug]/page.tsx
import { getProjectWithAdjacent } from '@/lib/data';

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const { project, prev, next } = await getProjectWithAdjacent(params.slug);
  
  if (!project) {
    notFound();
  }

  return (
    <>
      <ProjectDetail project={project} />
      <ProjectNavigation prev={prev} next={next} />
    </>
  );
}
```

## API Reference

### Hero

#### `getHero()`
Fetches the hero section content (singleton).

**Returns:** `Promise<Hero | null>`

**Example:**
```typescript
const hero = await getHero();
```

---

### Projects

#### `getPublishedProjects()`
Fetches all published projects, ordered by display order.

**Returns:** `Promise<PublicProject[]>`

**Example:**
```typescript
const projects = await getPublishedProjects();
```

#### `getFeaturedProjects(limit?: number)`
Fetches featured projects for the homepage.

**Parameters:**
- `limit` (optional): Maximum number of projects (default: 4)

**Returns:** `Promise<FeaturedProject[]>`

**Example:**
```typescript
const featured = await getFeaturedProjects(6);
```

#### `getProjectBySlug(slug: string)`
Fetches a single published project by slug (full object).

**Parameters:**
- `slug`: The project slug

**Returns:** `Promise<Project | null>`

**Example:**
```typescript
const project = await getProjectBySlug('portfolio-v2');
```

#### `getPublishedProjectSlugs()`
Fetches all published project slugs for SSG.

**Returns:** `Promise<Array<{ slug: string }>>`

**Example:**
```typescript
export async function generateStaticParams() {
  return await getPublishedProjectSlugs();
}
```

#### `getAdjacentProjects(currentOrder: number)`
Gets previous and next projects for navigation.

**Parameters:**
- `currentOrder`: The display order of the current project

**Returns:** `Promise<AdjacentProjects>`

**Example:**
```typescript
const { prev, next } = await getAdjacentProjects(5);
```

#### `getProjectWithAdjacent(slug: string)`
Fetches a project with its adjacent projects in one call.

**Parameters:**
- `slug`: The project slug

**Returns:** `Promise<ProjectWithAdjacent>`

**Example:**
```typescript
const { project, prev, next } = await getProjectWithAdjacent('my-project');
```

---

### Blog Posts

#### `getPublishedPosts(limit?: number)`
Fetches published blog posts, ordered by publish date (newest first).

**Parameters:**
- `limit` (optional): Maximum number of posts

**Returns:** `Promise<PublicBlogPost[]>`

**Example:**
```typescript
const allPosts = await getPublishedPosts();
const recentPosts = await getPublishedPosts(5);
```

#### `getRecentPosts(limit?: number)`
Alias for `getPublishedPosts` with default limit of 3.

**Parameters:**
- `limit` (optional): Maximum number of posts (default: 3)

**Returns:** `Promise<PublicBlogPost[]>`

**Example:**
```typescript
const recent = await getRecentPosts();
```

#### `getPostBySlug(slug: string)`
Fetches a single published blog post by slug (full object).

**Parameters:**
- `slug`: The blog post slug

**Returns:** `Promise<BlogPost | null>`

**Example:**
```typescript
const post = await getPostBySlug('my-first-post');
```

#### `getPublishedPostSlugs()`
Fetches all published blog post slugs for SSG.

**Returns:** `Promise<Array<{ slug: string }>>`

**Example:**
```typescript
export async function generateStaticParams() {
  return await getPublishedPostSlugs();
}
```

#### `getAllTags()`
Fetches all unique tags from published posts.

**Returns:** `Promise<string[]>`

**Example:**
```typescript
const tags = await getAllTags();
// ['react', 'typescript', 'nextjs']
```

#### `getPostsByTag(tag: string)`
Fetches published blog posts filtered by tag.

**Parameters:**
- `tag`: The tag to filter by

**Returns:** `Promise<PublicBlogPost[]>`

**Example:**
```typescript
const reactPosts = await getPostsByTag('react');
```

---

### About Page Content

#### `getSkills()`
Fetches all visible skills, ordered by display order.

**Returns:** `Promise<Skill[]>`

**Example:**
```typescript
const skills = await getSkills();
```

#### `getSkillsByCategory()`
Fetches skills grouped by category.

**Returns:** `Promise<SkillsByCategory>`

**Example:**
```typescript
const skillGroups = await getSkillsByCategory();
// { 'Frontend': [...], 'Backend': [...], 'DevOps': [...] }
```

#### `getExperiences()`
Fetches all visible work experiences, ordered by display order.

**Returns:** `Promise<Experience[]>`

**Example:**
```typescript
const experiences = await getExperiences();
```

#### `getEducation()`
Fetches all visible education entries, ordered by display order.

**Returns:** `Promise<Education[]>`

**Example:**
```typescript
const education = await getEducation();
```

#### `getCertifications()`
Fetches all visible certifications, ordered by display order.

**Returns:** `Promise<Certification[]>`

**Example:**
```typescript
const certs = await getCertifications();
```

#### `getAboutPageData()`
Fetches all about page content in parallel for better performance.

**Returns:** `Promise<AboutPageData>`

**Example:**
```typescript
const { skills, experiences, education, certifications } = await getAboutPageData();
```

---

### Site Settings

#### `getSiteSettings()`
Fetches site settings (singleton).

**Returns:** `Promise<SiteSettings | null>`

**Example:**
```typescript
const settings = await getSiteSettings();
```

## Error Handling

All functions include error handling and return safe defaults:

- Functions returning arrays return `[]` on error
- Functions returning objects return `null` on error
- All errors are logged to console for debugging

**Example with null handling:**
```typescript
const project = await getProjectBySlug(slug);

if (!project) {
  notFound(); // Next.js 404 page
}

return <ProjectDetail project={project} />;
```

## Performance Optimization

### Field Selection

Functions use Prisma's `select` to only fetch needed fields:

```typescript
// ❌ Returns everything (including large text fields)
await prisma.project.findMany();

// ✅ Returns only needed fields
await prisma.project.findMany({
  select: {
    id: true,
    slug: true,
    title: true,
    // ... only what's needed
  }
});
```

### Parallel Queries

Use `Promise.all` for independent queries:

```typescript
const [hero, projects, posts] = await Promise.all([
  getHero(),
  getFeaturedProjects(4),
  getRecentPosts(3),
]);
```

### Next.js Caching

Leverage Next.js cache and revalidation:

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedHero = unstable_cache(
  async () => getHero(),
  ['hero'],
  { revalidate: 3600 } // 1 hour
);
```

## Type Definitions

All types are exported from `./types.ts`:

```typescript
import type {
  PublicProject,
  FeaturedProject,
  PublicBlogPost,
  AdjacentProjects,
  ProjectWithAdjacent,
  AboutPageData,
  SkillsByCategory,
} from '@/lib/data';
```

## Best Practices

### ✅ DO

- Use these functions in Server Components
- Use `generateStaticParams` with slug functions
- Handle null returns appropriately
- Parallel fetch independent data
- Use type-safe imports

### ❌ DON'T

- Use in Client Components (use API routes instead)
- Call from browser code (server-side only)
- Expose draft/hidden content to public
- Fetch all fields if you only need some
- Forget error handling

## Testing

Example test for a data function:

```typescript
import { getPublishedProjects } from '@/lib/data';

describe('getPublishedProjects', () => {
  it('should return only published projects', async () => {
    const projects = await getPublishedProjects();
    
    expect(projects).toBeInstanceOf(Array);
    projects.forEach(project => {
      expect(project).toHaveProperty('slug');
      expect(project).toHaveProperty('title');
    });
  });

  it('should handle errors gracefully', async () => {
    // Mock Prisma error
    jest.spyOn(prisma.project, 'findMany').mockRejectedValueOnce(new Error('DB Error'));
    
    const projects = await getPublishedProjects();
    expect(projects).toEqual([]);
  });
});
```

## Related Documentation

- [Prisma Schema](../../../prisma/schema.prisma)
- [API Routes](../../app/api/)
- [Markdown Utilities](../markdown.ts)

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution:** Run `npm run prisma:generate` to generate the Prisma client.

### Issue: "TypeError: Cannot read property of null"

**Solution:** Add null checks for all data fetching results:
```typescript
const project = await getProjectBySlug(slug);
if (!project) return notFound();
```

### Issue: Slow page loads

**Solution:** 
1. Check if you're fetching unnecessary fields
2. Use parallel queries with `Promise.all`
3. Add Next.js caching/revalidation
4. Consider pagination for large datasets
