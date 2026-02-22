import { z } from "zod";

export const experienceCreateSchema = z.object({
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

export const experienceUpdateSchema = experienceCreateSchema.partial();

export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>;
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>;
