import { describe, expect, it } from "vitest";
import { blogPostCreateSchema, blogPostUpdateSchema } from "./blog";

describe("blogPostCreateSchema", () => {
  it("should apply defaults for status and tags on create", () => {
    const parsed = blogPostCreateSchema.safeParse({
      title: "Test Post",
      slug: "test-post",
      content: "Some content",
      excerpt: "Some excerpt",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("DRAFT");
      expect(parsed.data.tags).toEqual([]);
    }
  });

  it("should reject missing required fields", () => {
    const parsed = blogPostCreateSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});

describe("blogPostUpdateSchema", () => {
  it("should accept an empty object (all fields optional)", () => {
    const parsed = blogPostUpdateSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("should NOT fill defaults for omitted fields", () => {
    const parsed = blogPostUpdateSchema.safeParse({ title: "New Title" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("status");
      expect(parsed.data).not.toHaveProperty("tags");
    }
  });

  it("should preserve explicitly provided status and tags", () => {
    const parsed = blogPostUpdateSchema.safeParse({
      title: "New Title",
      status: "PUBLISHED",
      tags: ["aws", "cloud"],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("PUBLISHED");
      expect(parsed.data.tags).toEqual(["aws", "cloud"]);
    }
  });

  it("should accept a partial update with only slug", () => {
    const parsed = blogPostUpdateSchema.safeParse({ slug: "new-slug" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.slug).toBe("new-slug");
      expect(Object.keys(parsed.data)).toEqual(["slug"]);
    }
  });
});
