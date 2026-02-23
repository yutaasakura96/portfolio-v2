import { prisma } from "@/lib/prismaClient";
import type {
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
// HERO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch the hero section content (singleton).
 * Returns null if no hero data exists.
 */
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

/**
 * Fetch all published projects, ordered by display order.
 * Returns only fields needed for public display (excludes large text fields).
 */
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch published projects:", error);
    return [];
  }
}

/**
 * Fetch featured projects for the homepage.
 * @param limit - Maximum number of projects to return (default: 4)
 */
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch featured projects:", error);
    return [];
  }
}

/**
 * Fetch a single published project by slug.
 * Returns the full project object including large text fields.
 * @param slug - The project slug
 */
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

/**
 * Fetch all published project slugs.
 * Useful for static site generation (generateStaticParams).
 */
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

/**
 * Get adjacent projects for next/previous navigation.
 * Returns the project before and after the given displayOrder.
 * @param currentOrder - The display order of the current project
 */
export async function getAdjacentProjects(currentOrder: number): Promise<AdjacentProjects> {
  try {
    const [prev, next] = await Promise.all([
      prisma.project.findFirst({
        where: { status: "PUBLISHED", displayOrder: { lt: currentOrder } },
        orderBy: { displayOrder: "desc" },
        select: { slug: true, title: true },
      }),
      prisma.project.findFirst({
        where: { status: "PUBLISHED", displayOrder: { gt: currentOrder } },
        orderBy: { displayOrder: "asc" },
        select: { slug: true, title: true },
      }),
    ]);
    return { prev, next };
  } catch (error) {
    console.error("Failed to fetch adjacent projects:", error);
    return { prev: null, next: null };
  }
}

/**
 * Fetch a project with its adjacent projects in one call.
 * Useful for project detail pages with navigation.
 * @param slug - The project slug
 */
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

/**
 * Fetch published blog posts, ordered by publish date (newest first).
 * @param limit - Optional limit on number of posts to return
 */
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
      },
    });
  } catch (error) {
    console.error("Failed to fetch published posts:", error);
    return [];
  }
}

/**
 * Fetch recent blog posts for homepage or sidebar.
 * @param limit - Maximum number of posts to return (default: 3)
 */
export async function getRecentPosts(limit = 3): Promise<PublicBlogPost[]> {
  return getPublishedPosts(limit);
}

/**
 * Fetch a single published blog post by slug.
 * Returns the full post object including content.
 * @param slug - The blog post slug
 */
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

/**
 * Fetch all published blog post slugs.
 * Useful for static site generation (generateStaticParams).
 */
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

/**
 * Fetch all unique tags from published blog posts.
 * Useful for tag cloud or filter UI.
 */
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

/**
 * Fetch published blog posts filtered by tag.
 * @param tag - The tag to filter by
 */
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

/**
 * Fetch all visible skills, ordered by display order.
 */
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

/**
 * Fetch skills grouped by category.
 * Returns an object with category names as keys.
 */
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

/**
 * Fetch all visible work experiences, ordered by display order.
 */
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

/**
 * Fetch all visible education entries, ordered by display order.
 */
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

/**
 * Fetch all visible certifications, ordered by display order.
 */
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

/**
 * Fetch all about page content in one query for better performance.
 */
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

/**
 * Fetch site settings (singleton).
 * Returns null if no settings exist.
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    return await prisma.siteSettings.findFirst();
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return null;
  }
}
