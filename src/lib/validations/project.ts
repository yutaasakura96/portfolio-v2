import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const projectCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  shortDescription: z.string().min(1, "Short description is required").max(300),
  description: z.string().min(1, "Description is required"),
  problem: z.string().max(5000).optional(),
  solution: z.string().max(5000).optional(),
  role: z.string().max(200).optional(),
  techTags: z.array(z.string().max(50)).min(1, "At least one tech tag required"),
  images: z
    .array(
      z.object({
        url: z.url(),
        alt: z.string().max(200),
        order: z.number().int().min(0),
      })
    )
    .default([]),
  thumbnailImage: z.string().url().or(z.literal("")).optional(),
  liveUrl: z.string().url().or(z.literal("")).optional(),
  repoUrl: z.string().url().or(z.literal("")).optional(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
