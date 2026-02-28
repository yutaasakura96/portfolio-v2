import { z } from "zod";

export const siteSettingsUpdateSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(200),
  siteDescription: z.string().max(500).optional().or(z.literal("")),
  socialLinks: z
    .object({
      github: z.string().url().optional().or(z.literal("")),
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      youtube: z.string().url().optional().or(z.literal("")),
      website: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  email: z.string().email("Invalid email address").max(254),
  googleAnalyticsId: z.string().max(50).optional().or(z.literal("")),
});

export type SiteSettingsUpdateInput = z.infer<typeof siteSettingsUpdateSchema>;
