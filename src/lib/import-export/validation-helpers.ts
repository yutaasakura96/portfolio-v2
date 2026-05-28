import type { z } from "zod";

import type { EntityConfig, ParsedRow } from "./types";

const INTERNAL_FIELDS = ["id", "createdAt", "updatedAt"];

export function stripInternalFields(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj };
  for (const field of INTERNAL_FIELDS) {
    delete result[field];
  }
  return result;
}

export function stripInternalFieldsFromArray(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map(stripInternalFields);
}

export function validateRows(rows: unknown[], schema: z.ZodType): ParsedRow[] {
  return rows.map((row, index) => {
    const result = schema.safeParse(row);
    if (result.success) {
      return { rowIndex: index, data: result.data as Record<string, unknown>, errors: null };
    }
    return {
      rowIndex: index,
      data: row as Record<string, unknown>,
      errors: result.error,
    };
  });
}

export function getExportFilename(entity: string, format: "json" | "csv"): string {
  const date = new Date().toISOString().split("T")[0];
  return `${entity}-${date}.${format}`;
}

export function lookupUniqueKey(
  config: EntityConfig,
  item: Record<string, unknown>
): Record<string, unknown> | null {
  if (!config.uniqueKey) return null;

  if (config.uniqueKey.type === "single") {
    const value = item[config.uniqueKey.field];
    if (value == null) return null;
    return { [config.uniqueKey.field]: value };
  }

  const where: Record<string, unknown> = {};
  for (const field of config.uniqueKey.fields) {
    const value = item[field];
    if (value == null) return null;
    where[field] = value;
  }
  return where;
}
