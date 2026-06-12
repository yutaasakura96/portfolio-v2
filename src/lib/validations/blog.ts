import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const blogPostFields = {
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().min(1, "Excerpt is required").max(500),
  featuredImage: z.url().or(z.literal("")).optional(),
  tags: z.array(z.string().max(50)),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  publishedAt: z.coerce.date().optional().nullable(),
};

export const blogPostCreateSchema = z.object({
  ...blogPostFields,
  tags: blogPostFields.tags.default([]),
  status: blogPostFields.status.default("DRAFT"),
});

export const blogPostUpdateSchema = z.object(blogPostFields).partial();

export type BlogPostCreateInput = z.infer<typeof blogPostCreateSchema>;
export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;
