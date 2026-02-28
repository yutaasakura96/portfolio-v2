import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").max(254),
  subject: z.string().max(300).optional().or(z.literal("")),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
  honeypot: z.string().max(0).optional(), // Must be empty — spam bot trap
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
