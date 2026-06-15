import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  stripInternalFields,
  stripInternalFieldsFromArray,
  validateRows,
  getExportFilename,
  lookupUniqueKey,
} from "./validation-helpers";

import type { EntityConfig } from "./types";

// ── stripInternalFields ──────────────────────────────────────────────────────

describe("stripInternalFields", () => {
  it("should remove id, createdAt, and updatedAt", () => {
    const input = {
      id: "abc",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-02",
      title: "Test",
      slug: "test",
    };
    const result = stripInternalFields(input);
    expect(result).toEqual({ title: "Test", slug: "test" });
  });

  it("should return a copy, not mutate the original", () => {
    const input = { id: "abc", name: "Jane" };
    const result = stripInternalFields(input);
    expect(input.id).toBe("abc");
    expect(result).not.toBe(input);
  });

  it("should handle objects without internal fields", () => {
    const input = { title: "Test" };
    expect(stripInternalFields(input)).toEqual({ title: "Test" });
  });
});

// ── stripInternalFieldsFromArray ─────────────────────────────────────────────

describe("stripInternalFieldsFromArray", () => {
  it("should strip internal fields from every item", () => {
    const rows = [
      { id: "1", name: "A" },
      { id: "2", name: "B", createdAt: "x" },
    ];
    const result = stripInternalFieldsFromArray(rows);
    expect(result).toEqual([{ name: "A" }, { name: "B" }]);
  });

  it("should return an empty array for empty input", () => {
    expect(stripInternalFieldsFromArray([])).toEqual([]);
  });
});

// ── validateRows ─────────────────────────────────────────────────────────────

describe("validateRows", () => {
  const schema = z.object({ name: z.string(), age: z.number() });

  it("should mark valid rows with data and null errors", () => {
    const result = validateRows([{ name: "Alice", age: 30 }], schema);
    expect(result).toHaveLength(1);
    expect(result[0].errors).toBeNull();
    expect(result[0].data).toEqual({ name: "Alice", age: 30 });
    expect(result[0].rowIndex).toBe(0);
  });

  it("should mark invalid rows with errors", () => {
    const result = validateRows([{ name: 123 }], schema);
    expect(result).toHaveLength(1);
    expect(result[0].errors).not.toBeNull();
  });

  it("should preserve row indices for mixed valid/invalid rows", () => {
    const result = validateRows(
      [{ name: "A", age: 1 }, { bad: true }, { name: "C", age: 3 }],
      schema
    );
    expect(result[0].errors).toBeNull();
    expect(result[1].errors).not.toBeNull();
    expect(result[1].rowIndex).toBe(1);
    expect(result[2].errors).toBeNull();
  });
});

// ── getExportFilename ────────────────────────────────────────────────────────

describe("getExportFilename", () => {
  it("should return entity-YYYY-MM-DD.format", () => {
    const filename = getExportFilename("projects", "json");
    expect(filename).toMatch(/^projects-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it("should use csv extension for csv format", () => {
    const filename = getExportFilename("skills", "csv");
    expect(filename).toMatch(/^skills-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});

// ── lookupUniqueKey ──────────────────────────────────────────────────────────

describe("lookupUniqueKey", () => {
  it("should return null when uniqueKey is null", () => {
    const config = { uniqueKey: null } as EntityConfig;
    expect(lookupUniqueKey(config, { slug: "test" })).toBeNull();
  });

  it("should return single-field where clause", () => {
    const config = { uniqueKey: { type: "single" as const, field: "slug" } } as EntityConfig;
    expect(lookupUniqueKey(config, { slug: "my-project", title: "X" })).toEqual({
      slug: "my-project",
    });
  });

  it("should return null when single-field value is missing", () => {
    const config = { uniqueKey: { type: "single" as const, field: "slug" } } as EntityConfig;
    expect(lookupUniqueKey(config, { title: "X" })).toBeNull();
  });

  it("should return compound where clause", () => {
    const config = {
      uniqueKey: { type: "compound" as const, fields: ["name", "category"] },
    } as EntityConfig;
    expect(lookupUniqueKey(config, { name: "TypeScript", category: "Language" })).toEqual({
      name: "TypeScript",
      category: "Language",
    });
  });

  it("should return null when any compound field is missing", () => {
    const config = {
      uniqueKey: { type: "compound" as const, fields: ["name", "category"] },
    } as EntityConfig;
    expect(lookupUniqueKey(config, { name: "TypeScript" })).toBeNull();
  });
});
