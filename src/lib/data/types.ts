/**
 * Shared types for data fetching utilities
 */

import type {
  Project,
  BlogPost,
  Skill,
  Experience,
  Education,
  Certification,
  Hero,
  SiteSettings,
} from '../../../generated/prisma/client';

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PublicProject = Pick<
  Project,
  | 'id'
  | 'slug'
  | 'title'
  | 'shortDescription'
  | 'techTags'
  | 'thumbnailImage'
  | 'featured'
  | 'displayOrder'
  | 'startDate'
  | 'endDate'
  | 'liveUrl'
  | 'repoUrl'
>;

export type FeaturedProject = Pick<
  Project,
  'id' | 'slug' | 'title' | 'shortDescription' | 'techTags' | 'thumbnailImage' | 'liveUrl' | 'repoUrl'
>;

export type ProjectSummary = Pick<Project, 'id' | 'slug' | 'title' | 'status' | 'featured' | 'updatedAt'>;

// ═══════════════════════════════════════════════════════════════════════════
// BLOG POST TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type PublicBlogPost = Pick<
  BlogPost,
  'id' | 'slug' | 'title' | 'excerpt' | 'featuredImage' | 'tags' | 'readTime' | 'publishedAt'
>;

export type BlogPostSummary = Pick<
  BlogPost,
  'id' | 'slug' | 'title' | 'status' | 'publishedAt' | 'updatedAt'
>;

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AdjacentProjects = {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
};

export type ProjectWithAdjacent = {
  project: Project | null;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
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

export type { Hero, SiteSettings, Project, BlogPost, Skill, Experience, Education, Certification };
