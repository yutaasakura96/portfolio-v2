import { cache } from "react";
import { prisma } from "@/lib/prisma-client";
import { withDbRetry } from "./db-resilience";
import type {
  AboutPage,
  AdjacentProjects,
  BlogPost,
  Certification,
  Education,
  Experience,
  FeaturedProject,
  Hero,
  Project,
  PublicBlogPost,
  PublicProject,
  SiteSettings,
  Skill,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT PAGE INTRO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch the About page intro content (singleton); `null` if no record (page falls back to hardcoded copy).
 *
 * Backs the primary About-page section, so it retries and rethrows on persistent
 * failure rather than degrading to `null` — see `getHero` for the contract.
 */
export async function getAboutPageIntro(): Promise<AboutPage | null> {
  return withDbRetry(
    () => prisma.aboutPage.findUnique({ where: { id: "default" } }),
    "getAboutPageIntro"
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch the hero section content (singleton); `null` if no hero data exists.
 *
 * Backs the homepage hero. Retries transient Neon failures and, if they persist,
 * **rethrows** instead of returning `null` so the ISR render aborts and Next.js
 * keeps serving the last good cached page rather than caching a hero-less page.
 * See `getRecentPosts` / `getFeaturedProjects` for the same homepage contract.
 */
export async function getHero(): Promise<Hero | null> {
  return withDbRetry(() => prisma.hero.findFirst(), "getHero");
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all published projects ordered by `displayOrder`, narrowed to public-card fields.
 *
 * Backs the entire `/projects` index, so it retries and rethrows on persistent
 * failure rather than degrading to `[]` — otherwise a DB blip gets cached as an
 * empty projects page for the whole revalidate window. See `getHero`.
 */
export async function getPublishedProjects(): Promise<PublicProject[]> {
  return withDbRetry(
    () =>
      prisma.project.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          techTags: true,
          thumbnailImage: true,
          featured: true,
          displayOrder: true,
          startDate: true,
          endDate: true,
          liveUrl: true,
          repoUrl: true,
          titleJa: true,
          shortDescriptionJa: true,
        },
      }),
    "getPublishedProjects"
  );
}

/**
 * Fetch featured published projects for the homepage (default 4).
 *
 * Homepage data source: retries transient Neon failures and rethrows on
 * persistent failure (see `getHero`) so a DB blip can't be cached as an empty
 * "no featured projects" homepage.
 */
export async function getFeaturedProjects(limit = 4): Promise<FeaturedProject[]> {
  return withDbRetry(
    () =>
      prisma.project.findMany({
        where: { status: "PUBLISHED", featured: true },
        orderBy: { displayOrder: "asc" },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          shortDescription: true,
          techTags: true,
          thumbnailImage: true,
          liveUrl: true,
          repoUrl: true,
          titleJa: true,
          shortDescriptionJa: true,
        },
      }),
    "getFeaturedProjects"
  );
}

/**
 * Fetch a single published project by slug (full row including long-text fields); `null` if not found.
 *
 * `cache()` memoizes per request — the detail page calls this in both
 * `generateMetadata` and the page body. `withDbRetry` rethrows on persistent
 * failure so a DB blip aborts the ISR render and Next keeps serving the last
 * good page instead of caching a 404 (a genuine miss still resolves to `null`).
 */
export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  return withDbRetry(
    () => prisma.project.findFirst({ where: { slug, status: "PUBLISHED" } }),
    "getProjectBySlug"
  );
});

/** Fetch all published project slugs (for `generateStaticParams`). */
export async function getPublishedProjectSlugs(): Promise<Array<{ slug: string }>> {
  try {
    return await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
  } catch (error) {
    console.error("Failed to fetch project slugs:", error);
    return [];
  }
}

/** Fetch published project slugs plus `updatedAt` for `sitemap.ts`. */
export async function getPublishedProjectSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  try {
    return await prisma.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("Failed to fetch project sitemap entries:", error);
    return [];
  }
}

/** Get the prev/next published projects bracketing the given `displayOrder` for detail-page navigation. */
export async function getAdjacentProjects(currentOrder: number): Promise<AdjacentProjects> {
  try {
    const [prev, next] = await Promise.all([
      prisma.project.findFirst({
        where: { status: "PUBLISHED", displayOrder: { lt: currentOrder } },
        orderBy: { displayOrder: "desc" },
        select: { slug: true, title: true, titleJa: true },
      }),
      prisma.project.findFirst({
        where: { status: "PUBLISHED", displayOrder: { gt: currentOrder } },
        orderBy: { displayOrder: "asc" },
        select: { slug: true, title: true, titleJa: true },
      }),
    ]);
    return { prev, next };
  } catch (error) {
    console.error("Failed to fetch adjacent projects:", error);
    return { prev: null, next: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG POSTS
// ═══════════════════════════════════════════════════════════════════════════

/** Public-card field selection for blog-post list queries. */
const PUBLIC_POST_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  tags: true,
  readTime: true,
  publishedAt: true,
  titleJa: true,
  excerptJa: true,
} as const;

/** Fetch published blog posts ordered by `publishedAt` desc; pass `limit` to cap the result. */
export async function getPublishedPosts(limit?: number): Promise<PublicBlogPost[]> {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: limit } : {}),
      select: PUBLIC_POST_LIST_SELECT,
    });
  } catch (error) {
    console.error("Failed to fetch published posts:", error);
    return [];
  }
}

/**
 * Fetch the N most recent published blog posts (default 3) for the homepage.
 *
 * Homepage data source: unlike `getPublishedPosts` (which degrades to `[]` for
 * the blog index), this retries transient Neon failures and rethrows on
 * persistent failure (see `getHero`) so a DB blip can't be cached as an empty
 * homepage recent-posts section.
 */
export async function getRecentPosts(limit = 3): Promise<PublicBlogPost[]> {
  return withDbRetry(
    () =>
      prisma.blogPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: limit,
        select: PUBLIC_POST_LIST_SELECT,
      }),
    "getRecentPosts"
  );
}

/**
 * Fetch a single published blog post by slug (full row including markdown body); `null` if not found.
 *
 * `cache()` memoizes per request — the detail page calls this in both
 * `generateMetadata` and the page body. `withDbRetry` rethrows on persistent
 * failure so a DB blip aborts the ISR render and Next keeps serving the last
 * good page instead of caching a 404 (a genuine miss still resolves to `null`).
 */
export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  return withDbRetry(
    () => prisma.blogPost.findFirst({ where: { slug, status: "PUBLISHED" } }),
    "getPostBySlug"
  );
});

/** Fetch all published blog post slugs (for `generateStaticParams`). */
export async function getPublishedPostSlugs(): Promise<Array<{ slug: string }>> {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
  } catch (error) {
    console.error("Failed to fetch post slugs:", error);
    return [];
  }
}

/** Fetch published blog post slugs plus `updatedAt` for `sitemap.ts`. */
export async function getPublishedPostSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });
  } catch (error) {
    console.error("Failed to fetch post sitemap entries:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT PAGE CONTENT
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all visible skills ordered by `displayOrder`. Backs an About-page section — see `getHero`. */
export async function getSkills(): Promise<Skill[]> {
  return withDbRetry(
    () => prisma.skill.findMany({ where: { visible: true }, orderBy: { displayOrder: "asc" } }),
    "getSkills"
  );
}

/** Fetch skill-category names ordered by their `displayOrder`. */
export async function getSkillCategories(): Promise<string[]> {
  try {
    const categories = await prisma.skillCategory.findMany({
      orderBy: { displayOrder: "asc" },
    });
    return categories.map((c) => c.name);
  } catch (error) {
    console.error("Failed to fetch skill categories:", error);
    return [];
  }
}

/** Fetch all visible work experiences ordered by `displayOrder`. Backs an About-page section — see `getHero`. */
export async function getExperiences(): Promise<Experience[]> {
  return withDbRetry(
    () =>
      prisma.experience.findMany({ where: { visible: true }, orderBy: { displayOrder: "asc" } }),
    "getExperiences"
  );
}

/** Fetch all visible education entries ordered by `displayOrder`. Backs an About-page section — see `getHero`. */
export async function getEducation(): Promise<Education[]> {
  return withDbRetry(
    () => prisma.education.findMany({ where: { visible: true }, orderBy: { displayOrder: "asc" } }),
    "getEducation"
  );
}

/** Fetch all visible certifications ordered by `displayOrder`. Backs an About-page section — see `getHero`. */
export async function getCertifications(): Promise<Certification[]> {
  return withDbRetry(
    () =>
      prisma.certification.findMany({ where: { visible: true }, orderBy: { displayOrder: "asc" } }),
    "getCertifications"
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch site settings (singleton); `null` if no settings row exists.
 *
 * Wrapped in React `cache()` for per-request memoization: both the public
 * layout (for the GA id) and `Footer` need this, so without it every public
 * render cost two identical queries.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    return await prisma.siteSettings.findFirst();
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
});
