import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const galleryImageSchema = z.object({
  url: z.url(),
  alt: z.string().max(200),
  order: z.number().int().min(0),
});

export const galleryImageGroupSchema = z.object({
  name: z.string().max(100),
  images: z.array(galleryImageSchema).default([]),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type GalleryImageGroup = z.infer<typeof galleryImageGroupSchema>;

/**
 * Detects whether the stored images JSON is the legacy flat GalleryImage[]
 * or the new GalleryImageGroup[] format. Wraps legacy data in a single
 * unnamed group so existing projects continue to work.
 */
export function normalizeImagesToGroups(raw: unknown): GalleryImageGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  const first = raw[0];
  if (first && typeof first === "object" && "url" in first && !("images" in first)) {
    // Legacy flat array — wrap in a single unnamed group
    return [
      {
        name: "",
        images: (raw as Array<{ url: string; alt: string; order: number }>).map((img, i) => ({
          url: img.url,
          alt: img.alt ?? "",
          order: i,
        })),
      },
    ];
  }

  return raw as GalleryImageGroup[];
}

const projectBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().regex(slugRegex, "Invalid slug format").max(200),
  shortDescription: z.string().min(1, "Short description is required").max(300),
  description: z.string().min(1, "Description is required"),
  problem: z.string().max(5000).optional(),
  solution: z.string().max(5000).optional(),
  role: z.string().max(200).optional(),
  techTags: z.array(z.string().max(50)).min(1, "At least one tech tag required"),
  images: z.array(galleryImageGroupSchema).default([]),
  thumbnailImage: z.string().url().or(z.literal("")).optional(),
  liveUrl: z.string().url().or(z.literal("")).optional(),
  repoUrl: z.string().url().or(z.literal("")).optional(),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const projectCreateSchema = projectBaseSchema.refine(
  (data) => !data.startDate || !data.endDate || data.startDate < data.endDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

export const projectUpdateSchema = projectBaseSchema
  .partial()
  .refine((data) => !data.startDate || !data.endDate || data.startDate < data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
