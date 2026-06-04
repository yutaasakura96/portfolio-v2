import type { z } from "zod";

export type ImportMode = "create" | "upsert";

export type UniqueKey =
  | { type: "single"; field: string }
  | { type: "compound"; fields: string[] }
  | null;

export type EntityConfig = {
  label: string;
  pluralLabel: string;
  prismaModel: string;
  queryKey: string[];
  uniqueKey: UniqueKey;
  arrayFields: string[];
  numericFields: string[];
  jsonFields: string[];
  excludeFromExport: string[];
  isSingleton: boolean;
  formats: ("json" | "csv")[];
  importDisabled: boolean;
  revalidatePaths: string[];
  detailPathPrefix?: string;
  importSchema: z.ZodType;
  orderBy: Record<string, string>;
};

export type ParsedRow<T = Record<string, unknown>> = {
  rowIndex: number;
  data: T;
  errors: z.ZodError | null;
};

export type ImportResult = {
  created: number;
  updated: number;
  skipped: number;
};

export type UnifiedImportResult = {
  results: Record<string, ImportResult>;
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
};

export type UnifiedValidationSummary = Record<
  string,
  {
    validCount: number;
    errorCount: number;
    validItems: Record<string, unknown>[];
    errors: Array<{ index: number; messages: string[] }>;
  }
>;
