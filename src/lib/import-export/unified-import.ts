import { z } from "zod";

import { entityConfigs } from "./entity-configs";
import { validateRows } from "./validation-helpers";

import type { UnifiedValidationSummary } from "./types";

export const IMPORT_ORDER = [
  "hero",
  "about",
  "settings",
  "skills",
  "experience",
  "education",
  "certifications",
  "projects",
  "blog",
] as const;

const schemaFields: Record<string, z.ZodType> = {};
for (const [key, config] of Object.entries(entityConfigs)) {
  if (config.importDisabled) continue;
  if (config.isSingleton) {
    schemaFields[key] = config.importSchema.optional();
  } else {
    schemaFields[key] = z.array(config.importSchema).max(500).optional();
  }
}

export const unifiedImportBodySchema = z
  .object({
    mode: z.enum(["create", "upsert"]),
    ...schemaFields,
  })
  .strict();

export function validateUnifiedImport(payload: Record<string, unknown>): UnifiedValidationSummary {
  const summary: UnifiedValidationSummary = {};

  for (const [key, value] of Object.entries(payload)) {
    const config = entityConfigs[key];
    if (!config || config.importDisabled) continue;

    const items = config.isSingleton ? [value] : (value as unknown[]);
    if (!Array.isArray(items) || items.length === 0) continue;

    const parsed = validateRows(items, config.importSchema);
    const validItems = parsed.filter((r) => !r.errors).map((r) => r.data);
    const errors = parsed
      .filter((r) => r.errors)
      .map((r) => ({
        index: r.rowIndex,
        messages: r.errors!.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      }));

    summary[key] = {
      validCount: validItems.length,
      errorCount: errors.length,
      validItems,
      errors,
    };
  }

  return summary;
}
