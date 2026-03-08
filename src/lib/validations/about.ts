import { z } from "zod";

export const aboutPageUpdateSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().min(1).max(500),
  profileName: z.string().max(100).optional(),
  profileTitle: z.string().max(150).optional(),
  profileCompany: z.string().max(150).optional(),
  profileImageUrl: z.string().url().optional().nullable(),
  introHeadline: z.string().max(200).optional(),
  introBio: z.string().optional(),
});

export type AboutPageUpdateInput = z.infer<typeof aboutPageUpdateSchema>;
