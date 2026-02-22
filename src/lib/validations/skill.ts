import { z } from "zod";

export const skillCreateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  icon: z.string().max(100).optional().or(z.literal("")),
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional()
    .nullable(),
  displayOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const skillUpdateSchema = skillCreateSchema.partial();

export type SkillCreateInput = z.infer<typeof skillCreateSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
