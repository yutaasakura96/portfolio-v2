import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogPostCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required").max(500),
  featuredImage: z.url().or(z.literal("")).optional(),
  tags: z.array(z.string().max(50)).default([]),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  publishedAt: z.coerce.date().optional().nullable(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial();

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;
