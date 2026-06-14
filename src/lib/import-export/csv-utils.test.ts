import { describe, it, expect } from "vitest";
import { z } from "zod";
import { flattenForCsv, unflattenFromCsv } from "./csv-utils";
import type { EntityConfig } from "./types";

// Minimal EntityConfig fixture used across tests
function makeConfig(overrides: Partial<EntityConfig> = {}): EntityConfig {
  return {
    label: "Test",
    pluralLabel: "Tests",
    prismaModel: "test",
    queryKey: ["test"],
    uniqueKey: null,
    arrayFields: [],
    numericFields: [],
    jsonFields: [],
    excludeFromExport: [],
    isSingleton: false,
    formats: ["csv"],
    importDisabled: false,
    revalidatePaths: [],
    importSchema: z.object({}),
    orderBy: {},
    ...overrides,
  };
}

// ─── sanitizeCsvValue (tested indirectly via flattenForCsv) ───────────────────

describe("sanitizeCsvValue (via flattenForCsv)", () => {
  it("should prefix values starting with '=' with a single quote", () => {
    const config = makeConfig();
    const rows = [{ formula: "=SUM(A1)" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].formula).toBe("'=SUM(A1)");
  });

  it("should prefix values starting with '+' with a single quote", () => {
    const config = makeConfig();
    const rows = [{ val: "+positive" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("'+positive");
  });

  it("should prefix values starting with '-' with a single quote", () => {
    const config = makeConfig();
    const rows = [{ val: "-negative" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("'-negative");
  });

  it("should prefix values starting with '@' with a single quote", () => {
    const config = makeConfig();
    const rows = [{ val: "@user" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("'@user");
  });

  it("should pass normal values through unchanged", () => {
    const config = makeConfig();
    const rows = [{ val: "hello world" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("hello world");
  });

  it("should represent empty string as empty string", () => {
    const config = makeConfig();
    const rows = [{ val: "" }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("");
  });

  it("should represent null as empty string", () => {
    const config = makeConfig();
    const rows = [{ val: null }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("");
  });

  it("should represent undefined as empty string", () => {
    const config = makeConfig();
    const rows = [{ val: undefined }];
    const result = flattenForCsv(rows, config);
    expect(result[0].val).toBe("");
  });
});

// ─── flattenForCsv ────────────────────────────────────────────────────────────

describe("flattenForCsv", () => {
  it("should join array fields with '; ' delimiter", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [{ tags: ["react", "typescript", "nextjs"] }];
    const result = flattenForCsv(rows, config);
    expect(result[0].tags).toBe("react; typescript; nextjs");
  });

  it("should output empty string for empty arrays", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [{ tags: [] }];
    const result = flattenForCsv(rows, config);
    expect(result[0].tags).toBe("");
  });

  it("should stringify JSON fields", () => {
    const config = makeConfig({ jsonFields: ["meta"] });
    const rows = [{ meta: { key: "value", count: 3 } }];
    const result = flattenForCsv(rows, config);
    expect(result[0].meta).toBe(JSON.stringify({ key: "value", count: 3 }));
  });

  it("should output empty string for null JSON fields", () => {
    const config = makeConfig({ jsonFields: ["meta"] });
    const rows = [{ meta: null }];
    const result = flattenForCsv(rows, config);
    expect(result[0].meta).toBe("");
  });

  it("should convert boolean true to 'true'", () => {
    const config = makeConfig();
    const rows = [{ active: true }];
    const result = flattenForCsv(rows, config);
    expect(result[0].active).toBe("true");
  });

  it("should convert boolean false to 'false'", () => {
    const config = makeConfig();
    const rows = [{ active: false }];
    const result = flattenForCsv(rows, config);
    expect(result[0].active).toBe("false");
  });

  it("should format Date fields as ISO strings", () => {
    const config = makeConfig();
    const date = new Date("2024-01-15T00:00:00.000Z");
    const rows = [{ createdAt: date }];
    const result = flattenForCsv(rows, config);
    expect(result[0].createdAt).toBe("2024-01-15T00:00:00.000Z");
  });

  it("should exclude fields listed in excludeFromExport", () => {
    const config = makeConfig({ excludeFromExport: ["secret"] });
    const rows = [{ name: "Alice", secret: "hidden" }];
    const result = flattenForCsv(rows, config);
    expect(result[0]).not.toHaveProperty("secret");
    expect(result[0].name).toBe("Alice");
  });

  it("should handle multiple rows", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [
      { tags: ["a", "b"], name: "first" },
      { tags: [], name: "second" },
    ];
    const result = flattenForCsv(rows, config);
    expect(result).toHaveLength(2);
    expect(result[0].tags).toBe("a; b");
    expect(result[1].tags).toBe("");
  });
});

// ─── unflattenFromCsv ─────────────────────────────────────────────────────────

describe("unflattenFromCsv", () => {
  it("should split array fields back by '; ' delimiter", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [{ tags: "react; typescript; nextjs" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].tags).toEqual(["react", "typescript", "nextjs"]);
  });

  it("should return empty array for blank array fields", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [{ tags: "" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].tags).toEqual([]);
  });

  it("should trim whitespace from individual array elements", () => {
    const config = makeConfig({ arrayFields: ["tags"] });
    const rows = [{ tags: " react ;  typescript " }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].tags).toEqual(["react", "typescript"]);
  });

  it("should parse JSON fields back to objects", () => {
    const config = makeConfig({ jsonFields: ["meta"] });
    const rows = [{ meta: '{"key":"value","count":3}' }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].meta).toEqual({ key: "value", count: 3 });
  });

  it("should return null for blank JSON fields", () => {
    const config = makeConfig({ jsonFields: ["meta"] });
    const rows = [{ meta: "" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].meta).toBeNull();
  });

  it("should return the raw string if JSON is malformed", () => {
    const config = makeConfig({ jsonFields: ["meta"] });
    const rows = [{ meta: "{not valid json" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].meta).toBe("{not valid json");
  });

  it("should cast 'true' string to boolean true", () => {
    const config = makeConfig();
    const rows = [{ active: "true" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].active).toBe(true);
  });

  it("should cast 'false' string to boolean false", () => {
    const config = makeConfig();
    const rows = [{ active: "false" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].active).toBe(false);
  });

  it("should convert empty string to undefined", () => {
    const config = makeConfig();
    const rows = [{ description: "" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].description).toBeUndefined();
  });

  it("should cast numeric strings to numbers for numericFields", () => {
    const config = makeConfig({ numericFields: ["displayOrder"] });
    const rows = [{ displayOrder: "5" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].displayOrder).toBe(5);
  });

  it("should not cast numeric-looking strings to numbers for non-numericFields", () => {
    const config = makeConfig({ numericFields: [] });
    const rows = [{ zipCode: "90210" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].zipCode).toBe("90210");
  });

  it("should pass through plain string values unchanged", () => {
    const config = makeConfig();
    const rows = [{ name: "Alice" }];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].name).toBe("Alice");
  });

  it("should handle multiple rows independently", () => {
    const config = makeConfig({ arrayFields: ["tags"], numericFields: ["order"] });
    const rows = [
      { tags: "a; b", order: "1", label: "first" },
      { tags: "", order: "2", label: "second" },
    ];
    const result = unflattenFromCsv(rows, config);
    expect(result[0].tags).toEqual(["a", "b"]);
    expect(result[0].order).toBe(1);
    expect(result[1].tags).toEqual([]);
    expect(result[1].order).toBe(2);
  });
});
