import { z } from "zod";

const educationFields = {
  institution: z.string().min(1).max(200),
  degree: z.string().min(1).max(200),
  field: z.string().max(200).optional().or(z.literal("")),
  startDate: z.preprocess(
    (val) => (val === "" ? null : val),
    z.coerce.date().optional().nullable()
  ),
  endDate: z.preprocess((val) => (val === "" ? null : val), z.coerce.date().optional().nullable()),
  achievements: z.string().max(5000).optional().or(z.literal("")),
  logoUrl: z.url().or(z.literal("")).optional(),
  institutionUrl: z.url().or(z.literal("")).optional(),
  documentUrl: z.url().or(z.literal("")).optional(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

export const educationCreateSchema = z.object({
  ...educationFields,
  displayOrder: educationFields.displayOrder.default(0),
  visible: educationFields.visible.default(true),
});

export const educationUpdateSchema = z.object(educationFields).partial();

export type EducationCreateInput = z.infer<typeof educationCreateSchema>;
export type EducationUpdateInput = z.infer<typeof educationUpdateSchema>;
