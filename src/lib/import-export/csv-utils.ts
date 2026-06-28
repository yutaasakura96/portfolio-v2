import Papa from "papaparse";

import type { EntityConfig } from "./types";

const ARRAY_DELIMITER = "; ";
const FORMULA_PREFIXES = ["=", "+", "-", "@"];

/** Prefix cells that start with formula characters to prevent CSV injection in Excel/Sheets */
function sanitizeCsvValue(value: string): string {
  if (value.length > 0 && FORMULA_PREFIXES.includes(value[0])) {
    return `'${value}`;
  }
  return value;
}

export function flattenForCsv(
  rows: Record<string, unknown>[],
  config: EntityConfig
): Record<string, string>[] {
  return rows.map((row) => {
    const flat: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      if (config.excludeFromExport.includes(key)) continue;

      if (config.arrayFields.includes(key)) {
        flat[key] = Array.isArray(value) ? sanitizeCsvValue(value.join(ARRAY_DELIMITER)) : "";
      } else if (config.jsonFields.includes(key)) {
        flat[key] = value != null ? JSON.stringify(value) : "";
      } else if (value instanceof Date) {
        flat[key] = value.toISOString();
      } else if (value === null || value === undefined) {
        flat[key] = "";
      } else if (typeof value === "boolean") {
        flat[key] = String(value);
      } else if (typeof value === "number") {
        flat[key] = String(value);
      } else {
        flat[key] = sanitizeCsvValue(String(value));
      }
    }
    return flat;
  });
}

export function unflattenFromCsv(
  rows: Record<string, string>[],
  config: EntityConfig
): Record<string, unknown>[] {
  return rows.map((row) => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (config.arrayFields.includes(key)) {
        result[key] = value.trim() === "" ? [] : value.split(ARRAY_DELIMITER).map((s) => s.trim());
      } else if (config.jsonFields.includes(key)) {
        if (value.trim() === "") {
          result[key] = null;
        } else {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      } else if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else if (value === "") {
        result[key] = undefined;
      } else if (config.numericFields.includes(key) && !isNaN(Number(value))) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  });
}

export function generateCsv(rows: Record<string, string>[]): string {
  return Papa.unparse(rows);
}
