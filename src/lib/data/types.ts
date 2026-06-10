/**
 * Shared types for data fetching utilities
 */

import type {
  AboutPage,
  Project,
  BlogPost,
  Skill,
  Experience,
  Education,
  Certification,
  Hero,
  SiteSettings,
} from "../../../generated/prisma/client";

// Value + type re-exports for Prisma enums so consumers (forms, API clients)
// can import enum constants alongside the model types from a single canonical
// location (`@/lib/data/types`). Re-exporting the value form means `import {
// ProficiencyLevel } from "@/lib/data/types"` yields both the runtime const
// object AND the type, matching the pattern previously living in `src/types/`.
export { ProjectStatus, PostStatus, ProficiencyLevel } from "../../../generated/prisma/enums";

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PublicProject = Pick<
  Project,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "techTags"
  | "thumbnailImage"
  | "featured"
  | "displayOrder"
  | "startDate"
  | "endDate"
  | "liveUrl"
  | "repoUrl"
  | "titleJa"
  | "shortDescriptionJa"
>;

export type FeaturedProject = Pick<
  Project,
  | "id"
  | "slug"
  | "title"
  | "shortDescription"
  | "techTags"
  | "thumbnailImage"
  | "liveUrl"
  | "repoUrl"
  | "titleJa"
  | "shortDescriptionJa"
>;

export type ProjectSummary = Pick<
  Project,
  "id" | "slug" | "title" | "status" | "featured" | "updatedAt"
>;

// ═══════════════════════════════════════════════════════════════════════════
// BLOG POST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PublicBlogPost = Pick<
  BlogPost,
  | "id"
  | "slug"
  | "title"
  | "excerpt"
  | "featuredImage"
  | "tags"
  | "readTime"
  | "publishedAt"
  | "titleJa"
  | "excerptJa"
>;

export type BlogPostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "status" | "publishedAt" | "updatedAt"
>;

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AdjacentProjects = {
  prev: { slug: string; title: string; titleJa: string | null } | null;
  next: { slug: string; title: string; titleJa: string | null } | null;
};

export type ProjectWithAdjacent = {
  project: Project | null;
  prev: { slug: string; title: string; titleJa: string | null } | null;
  next: { slug: string; title: string; titleJa: string | null } | null;
};

// ═══════════════════════════════════════════════════════════════════════════
// ABOUT PAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AboutPageData = {
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
};

export type SkillsByCategory = Record<string, Skill[]>;

// ═══════════════════════════════════════════════════════════════════════════
// PAGINATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PaginationParams = {
  page?: number;
  limit?: number;
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type {
  AboutPage,
  Hero,
  SiteSettings,
  Project,
  BlogPost,
  Skill,
  Experience,
  Education,
  Certification,
};
