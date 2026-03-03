import { z } from "zod";

const experienceBaseSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  description: z.string().min(1),
  highlights: z.array(z.string().max(500)).default([]),
  logoUrl: z.url().or(z.literal("")).optional(),
  companyUrl: z.url().or(z.literal("")).optional(),
  displayOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const experienceCreateSchema = experienceBaseSchema.refine(
  (data) => !data.endDate || data.startDate < data.endDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

export const experienceUpdateSchema = experienceBaseSchema.partial().refine(
  (data) => !data.startDate || !data.endDate || data.startDate < data.endDate,
  { message: "End date must be after start date", path: ["endDate"] }
);

export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>;
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>;
