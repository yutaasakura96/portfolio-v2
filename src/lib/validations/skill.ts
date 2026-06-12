import { z } from "zod";

const skillFields = {
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  icon: z.string().max(100).optional().or(z.literal("")),
  iconUrl: z.string().max(500).optional().nullable().or(z.literal("")),
  proficiencyLevel: z
    .enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"])
    .optional()
    .nullable(),
  displayOrder: z.number().int(),
  visible: z.boolean(),
};

export const skillCreateSchema = z.object({
  ...skillFields,
  displayOrder: skillFields.displayOrder.default(0),
  visible: skillFields.visible.default(true),
});

export const skillUpdateSchema = z.object(skillFields).partial();

export type SkillCreateInput = z.infer<typeof skillCreateSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
