import { z } from "zod";

export const heroUpdateSchema = z.object({
  headline: z.string().min(1).max(200),
  subheadline: z.string().max(300).optional().or(z.literal("")),
  bio: z.string().min(1),
  profileImage: z.url().or(z.literal("")).optional(),
  resumeUrl: z.url().or(z.literal("")).optional(),
  ctaButtons: z
    .array(
      z.object({
        label: z.string().min(1).max(50),
        url: z.string().min(1),
        variant: z.enum(["primary", "secondary"]),
      })
    )
    .max(4)
    .optional()
    .nullable(),
});

export type HeroUpdateInput = z.infer<typeof heroUpdateSchema>;
