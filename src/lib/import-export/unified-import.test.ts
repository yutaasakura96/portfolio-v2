import { describe, it, expect } from "vitest";

import { IMPORT_ORDER, unifiedImportBodySchema, validateUnifiedImport } from "./unified-import";

// ── IMPORT_ORDER ─────────────────────────────────────────────────────────────

describe("IMPORT_ORDER", () => {
  it("should contain the expected entities in dependency order", () => {
    expect(IMPORT_ORDER).toContain("hero");
    expect(IMPORT_ORDER).toContain("projects");
    expect(IMPORT_ORDER).toContain("blog");
    expect(IMPORT_ORDER.indexOf("hero")).toBeLessThan(IMPORT_ORDER.indexOf("projects"));
  });
});

// ── unifiedImportBodySchema ──────────────────────────────────────────────────

describe("unifiedImportBodySchema", () => {
  it("should accept valid create mode with no entities", () => {
    const result = unifiedImportBodySchema.safeParse({ mode: "create" });
    expect(result.success).toBe(true);
  });

  it("should accept valid upsert mode", () => {
    const result = unifiedImportBodySchema.safeParse({ mode: "upsert" });
    expect(result.success).toBe(true);
  });

  it("should reject invalid mode", () => {
    const result = unifiedImportBodySchema.safeParse({ mode: "delete" });
    expect(result.success).toBe(false);
  });

  it("should reject missing mode", () => {
    const result = unifiedImportBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject unknown top-level keys (strict mode)", () => {
    const result = unifiedImportBodySchema.safeParse({
      mode: "create",
      unknownEntity: [{ name: "x" }],
    });
    expect(result.success).toBe(false);
  });

  it("should accept a singleton entity as an object", () => {
    const result = unifiedImportBodySchema.safeParse({
      mode: "create",
      hero: { headline: "Hello", subheadline: "World", bio: "A developer" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept a collection entity as an array", () => {
    const result = unifiedImportBodySchema.safeParse({
      mode: "create",
      skills: [{ name: "TypeScript", category: "Language", proficiency: 90 }],
    });
    expect(result.success).toBe(true);
  });
});

// ── validateUnifiedImport ────────────────────────────────────────────────────

describe("validateUnifiedImport", () => {
  it("should return empty summary for empty payload", () => {
    const summary = validateUnifiedImport({});
    expect(Object.keys(summary)).toHaveLength(0);
  });

  it("should skip unknown entity keys", () => {
    const summary = validateUnifiedImport({ unknownEntity: [{ name: "x" }] });
    expect(Object.keys(summary)).toHaveLength(0);
  });

  it("should report valid items for valid collection data", () => {
    const summary = validateUnifiedImport({
      skills: [{ name: "TypeScript", category: "Language", proficiency: 90 }],
    });
    expect(summary.skills).toBeDefined();
    expect(summary.skills.validCount).toBe(1);
    expect(summary.skills.errorCount).toBe(0);
  });

  it("should report errors for invalid collection data", () => {
    const summary = validateUnifiedImport({
      skills: [{ name: "" }],
    });
    expect(summary.skills).toBeDefined();
    expect(summary.skills.errorCount).toBeGreaterThan(0);
    expect(summary.skills.errors[0].messages.length).toBeGreaterThan(0);
  });

  it("should handle singleton entities by wrapping in array", () => {
    const summary = validateUnifiedImport({
      hero: { headline: "Hello", subheadline: "World", bio: "A developer" },
    });
    expect(summary.hero).toBeDefined();
    expect(summary.hero.validCount).toBe(1);
  });
});
