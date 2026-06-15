import { prisma } from "@/lib/prisma-client";
import type {
  AboutPage,
  AboutPageData,
  AdjacentProjects,
  BlogPost,
  Certification,
  Education,
  Experience,
  FeaturedProject,
  Hero,
  Project,
  ProjectWithAdjacent,
  PublicBlogPost,
  PublicProject,
  SiteSettings,
  Skill,
  SkillsByCategory,
} from "./types";

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT PAGE INTRO
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch the About page intro content (singleton); `null` if no record (page falls back to hardcoded copy). */
export async function getAboutPageIntro(): Promise<AboutPage | null> {
  try {
    return await prisma.aboutPage.findUnique({ where: { id: "default" } });
  } catch (error) {
    console.error("Failed to fetch about page intro:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch the hero section content (singleton); `null` if no hero data exists. */
export async function getHero(): Promise<Hero | null> {
  try {
    return await prisma.hero.findFirst();
  } catch (error) {
    console.error("Failed to fetch hero data:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all published projects ordered by `displayOrder`, narrowed to public-card fields. */
export async function getPublishedProjects(): Promise<PublicProject[]> {
  try {
    return await prisma.project.findMany({
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
    });
  } catch (error) {
    console.error("Failed to fetch published projects:", error);
    return [];
  }
}

/** Fetch featured published projects for the homepage (default 4). */
export async function getFeaturedProjects(limit = 4): Promise<FeaturedProject[]> {
  try {
    return await prisma.project.findMany({
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
    });
  } catch (error) {
    console.error("Failed to fetch featured projects:", error);
    return [];
  }
}

/** Fetch a single published project by slug (full row including long-text fields); `null` if not found. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return await prisma.project.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
  } catch (error) {
    console.error(`Failed to fetch project with slug "${slug}":`, error);
    return null;
  }
}

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

/** Fetch a published project plus its prev/next neighbours in one call (for project detail pages). */
export async function getProjectWithAdjacent(slug: string): Promise<ProjectWithAdjacent> {
  try {
    const project = await getProjectBySlug(slug);
    if (!project) {
      return { project: null, prev: null, next: null };
    }

    const { prev, next } = await getAdjacentProjects(project.displayOrder);
    return { project, prev, next };
  } catch (error) {
    console.error(`Failed to fetch project with adjacent for slug "${slug}":`, error);
    return { project: null, prev: null, next: null };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// BLOG POSTS
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch published blog posts ordered by `publishedAt` desc; pass `limit` to cap the result. */
export async function getPublishedPosts(limit?: number): Promise<PublicBlogPost[]> {
  try {
    return await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: limit } : {}),
      select: {
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch published posts:", error);
    return [];
  }
}

/** Fetch the N most recent published blog posts (default 3) for homepage/sidebar widgets. */
export async function getRecentPosts(limit = 3): Promise<PublicBlogPost[]> {
  return getPublishedPosts(limit);
}

/** Fetch a single published blog post by slug (full row including markdown body); `null` if not found. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
  } catch (error) {
    console.error(`Failed to fetch post with slug "${slug}":`, error);
    return null;
  }
}

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

/** Fetch the sorted, de-duplicated set of tags across all published blog posts. */
export async function getAllTags(): Promise<string[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { tags: true },
    });

    const allTags = posts.flatMap((p) => p.tags);
    return Array.from(new Set(allTags)).sort();
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return [];
  }
}

/** Fetch published blog posts that include the given tag, ordered by `publishedAt` desc. */
export async function getPostsByTag(tag: string): Promise<PublicBlogPost[]> {
  try {
    return await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        tags: { has: tag },
      },
      orderBy: { publishedAt: "desc" },
      select: {
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
      },
    });
  } catch (error) {
    console.error(`Failed to fetch posts with tag "${tag}":`, error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT PAGE CONTENT
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch all visible skills ordered by `displayOrder`. */
export async function getSkills(): Promise<Skill[]> {
  try {
    return await prisma.skill.findMany({
      where: { visible: true },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch skills:", error);
    return [];
  }
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

/** Fetch visible skills grouped into a `{ [category]: Skill[] }` map. */
export async function getSkillsByCategory(): Promise<SkillsByCategory> {
  try {
    const skills = await getSkills();
    const grouped: Record<string, Skill[]> = {};

    for (const skill of skills) {
      if (!grouped[skill.category]) {
        grouped[skill.category] = [];
      }
      grouped[skill.category].push(skill);
    }

    return grouped;
  } catch (error) {
    console.error("Failed to fetch skills by category:", error);
    return {};
  }
}

/** Fetch all visible work experiences ordered by `displayOrder`. */
export async function getExperiences(): Promise<Experience[]> {
  try {
    return await prisma.experience.findMany({
      where: { visible: true },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch experiences:", error);
    return [];
  }
}

/** Fetch all visible education entries ordered by `displayOrder`. */
export async function getEducation(): Promise<Education[]> {
  try {
    return await prisma.education.findMany({
      where: { visible: true },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch education:", error);
    return [];
  }
}

/** Fetch all visible certifications ordered by `displayOrder`. */
export async function getCertifications(): Promise<Certification[]> {
  try {
    return await prisma.certification.findMany({
      where: { visible: true },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch certifications:", error);
    return [];
  }
}

/** Fetch all About-page content (skills, experiences, education, certifications) in parallel. */
export async function getAboutPageData(): Promise<AboutPageData> {
  try {
    const [skills, experiences, education, certifications] = await Promise.all([
      getSkills(),
      getExperiences(),
      getEducation(),
      getCertifications(),
    ]);

    return { skills, experiences, education, certifications };
  } catch (error) {
    console.error("Failed to fetch about page data:", error);
    return {
      skills: [],
      experiences: [],
      education: [],
      certifications: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch site settings (singleton); `null` if no settings row exists. */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await prisma.siteSettings.findFirst();
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
}
