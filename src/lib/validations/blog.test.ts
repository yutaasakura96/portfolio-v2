// @vitest-environment node
import { describe, it, expect } from "vitest";
import { blogPostCreateSchema, blogPostUpdateSchema } from "./blog";

const validCreate = {
  title: "My First Post",
  slug: "my-first-post",
  content: "Some content here.",
  excerpt: "A short excerpt.",
};

describe("blogPostCreateSchema", () => {
  describe("happy path", () => {
    it("should accept a minimal valid payload and apply defaults", () => {
      const parsed = blogPostCreateSchema.safeParse(validCreate);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.status).toBe("DRAFT");
        expect(parsed.data.tags).toEqual([]);
      }
    });

    it("should accept PUBLISHED status", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, status: "PUBLISHED" });
      expect(parsed.success).toBe(true);
    });
  });

  describe("slug validation", () => {
    it.each([["my-post"], ["a"], ["post-123"], ["123-abc"], ["a-b-c-d"]])(
      "should accept valid slug %s",
      (slug) => {
        const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug });
        expect(parsed.success).toBe(true);
      }
    );

    it("should reject a slug with uppercase letters", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "My-Post" });
      expect(parsed.success).toBe(false);
    });

    it("should reject a slug with spaces", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "my post" });
      expect(parsed.success).toBe(false);
    });

    it("should reject a slug with special characters", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "my_post!" });
      expect(parsed.success).toBe(false);
    });

    it("should reject a slug with a leading hyphen", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "-my-post" });
      expect(parsed.success).toBe(false);
    });

    it("should reject a slug with a trailing hyphen", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "my-post-" });
      expect(parsed.success).toBe(false);
    });

    it("should reject a slug with consecutive hyphens", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "my--post" });
      expect(parsed.success).toBe(false);
    });

    it("should reject an empty slug", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, slug: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("title boundaries", () => {
    it("should accept a 200-character title", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        title: "a".repeat(200),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 201-character title", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        title: "a".repeat(201),
      });
      expect(parsed.success).toBe(false);
    });

    it("should reject an empty title", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, title: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("excerpt boundaries", () => {
    it("should accept a 500-character excerpt", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        excerpt: "a".repeat(500),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 501-character excerpt", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        excerpt: "a".repeat(501),
      });
      expect(parsed.success).toBe(false);
    });

    it("should reject an empty excerpt", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, excerpt: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("featuredImage", () => {
    it("should accept a valid URL", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        featuredImage: "https://cdn.example.com/image.webp",
      });
      expect(parsed.success).toBe(true);
    });

    it("should accept an empty string (optional field)", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        featuredImage: "",
      });
      expect(parsed.success).toBe(true);
    });

    it("should accept when featuredImage is omitted", () => {
      const parsed = blogPostCreateSchema.safeParse(validCreate);
      expect(parsed.success).toBe(true);
    });

    it("should reject an invalid URL string", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        featuredImage: "not-a-url",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("content", () => {
    it("should accept content with 1 character (minimum)", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, content: "x" });
      expect(parsed.success).toBe(true);
    });

    it("should reject an empty content string", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, content: "" });
      expect(parsed.success).toBe(false);
    });
  });

  describe("tags", () => {
    it("should accept tags with entries up to 50 characters", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        tags: ["a".repeat(50), "typescript"],
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a tag entry longer than 50 characters", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        tags: ["a".repeat(51)],
      });
      expect(parsed.success).toBe(false);
    });

    it("should default tags to an empty array when omitted", () => {
      const parsed = blogPostCreateSchema.safeParse(validCreate);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.tags).toEqual([]);
      }
    });
  });

  describe("publishedAt", () => {
    it("should coerce an ISO date string to a Date object", () => {
      const parsed = blogPostCreateSchema.safeParse({
        ...validCreate,
        publishedAt: "2025-01-15T00:00:00.000Z",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.publishedAt).toBeInstanceOf(Date);
        expect(parsed.data.publishedAt?.toISOString()).toBe("2025-01-15T00:00:00.000Z");
      }
    });

    it("should accept null publishedAt", () => {
      const parsed = blogPostCreateSchema.safeParse({ ...validCreate, publishedAt: null });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.publishedAt).toBeNull();
      }
    });

    it("should accept when publishedAt is omitted", () => {
      const parsed = blogPostCreateSchema.safeParse(validCreate);
      expect(parsed.success).toBe(true);
    });
  });
});

describe("blogPostUpdateSchema", () => {
  it("should accept an empty object (all fields optional via .partial())", () => {
    const parsed = blogPostUpdateSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("should accept a single-field update", () => {
    const parsed = blogPostUpdateSchema.safeParse({ title: "Updated Title" });
    expect(parsed.success).toBe(true);
  });

  it("should still reject an invalid slug in a partial update", () => {
    const parsed = blogPostUpdateSchema.safeParse({ slug: "INVALID SLUG" });
    expect(parsed.success).toBe(false);
  });

  it("should still reject an oversized excerpt in a partial update", () => {
    const parsed = blogPostUpdateSchema.safeParse({ excerpt: "x".repeat(501) });
    expect(parsed.success).toBe(false);
  });
});
