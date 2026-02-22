import { z } from "zod";

export const certificationCreateSchema = z.object({
  name: z.string().min(1).max(200),
  issuer: z.string().min(1).max(200),
  dateEarned: z.coerce.date(),
  expirationDate: z.coerce.date().optional().nullable(),
  credentialId: z.string().max(200).optional().or(z.literal("")),
  credentialUrl: z.url().or(z.literal("")).optional(),
  badgeImage: z.url().or(z.literal("")).optional(),
  displayOrder: z.number().int().default(0),
  visible: z.boolean().default(true),
});

export const certificationUpdateSchema = certificationCreateSchema.partial();

export type CertificationCreateInput = z.infer<typeof certificationCreateSchema>;
export type CertificationUpdateInput = z.infer<typeof certificationUpdateSchema>;
