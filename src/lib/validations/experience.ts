import { z } from "zod";

const experienceFields = {
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  location: z.string().max(200).optional().or(z.literal("")),
  startDate: z.coerce.date(),
  endDate: z.preprocess((val) => (val === "" ? null : val), z.coerce.date().optional().nullable()),
  description: z.string().min(1),
  highlights: z.array(z.string().max(500)),
  techTags: z.array(z.string().max(100)).transform((tags) => [...new Set(tags)]),
  logoUrl: z.url().or(z.literal("")).optional(),
  companyUrl: z.url().or(z.literal("")).optional(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

export const experienceCreateSchema = z
  .object({
    ...experienceFields,
    highlights: experienceFields.highlights.default([]),
    techTags: experienceFields.techTags.default([]),
    displayOrder: experienceFields.displayOrder.default(0),
    visible: experienceFields.visible.default(true),
  })
  .refine((data) => !data.endDate || data.startDate < data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export const experienceUpdateSchema = z
  .object(experienceFields)
  .partial()
  .refine((data) => !data.startDate || !data.endDate || data.startDate < data.endDate, {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type ExperienceCreateInput = z.infer<typeof experienceCreateSchema>;
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>;
