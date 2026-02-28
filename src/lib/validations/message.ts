import { z } from "zod";

export const messageUpdateSchema = z.object({
  read: z.boolean().optional(),
  archived: z.boolean().optional(),
});

export const messageBulkUpdateSchema = z.object({
  ids: z.string().array().min(1, "At least one ID is required").max(50, "Maximum 50 IDs allowed"),
  update: messageUpdateSchema,
});

export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;
export type MessageBulkUpdateInput = z.infer<typeof messageBulkUpdateSchema>;
