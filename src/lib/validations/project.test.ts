// @vitest-environment node
import { describe, it, expect } from "vitest";
import { projectCreateSchema, projectUpdateSchema, normalizeImagesToGroups } from "./project";

const validCreate = {
  title: "My Project",
  slug: "my-project",
  shortDescription: "A short description.",
  description: "A longer description that explains the project in detail.",
  techTags: ["TypeScript", "Next.js"],
};

describe("projectCreateSchema", () => {
  describe("happy path", () => {
    it("should accept a minimal valid payload and apply defaults", () => {
      const parsed = projectCreateSchema.safeParse(validCreate);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        // Defaults from the base schema
        expect(parsed.data.featured).toBe(false);
        expect(parsed.data.displayOrder).toBe(0);
        expect(parsed.data.status).toBe("DRAFT");
        expect(parsed.data.images).toEqual([]);
      }
    });

    it("should accept PUBLISHED status", () => {
      const parsed = projectCreateSchema.safeParse({ ...validCreate, status: "PUBLISHED" });
      expect(parsed.success).toBe(true);
    });
  });

  describe("title boundaries", () => {
    it("should reject an empty title", () => {
      const parsed = projectCreateSchema.safeParse({ ...validCreate, title: "" });
      expect(parsed.success).toBe(false);
    });

    it("should accept a 200-character title", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        title: "a".repeat(200),
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject a 201-character title", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        title: "a".repeat(201),
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("slug validation", () => {
    it.each([["my-project"], ["a"], ["a-b-c"], ["project-123"], ["123-project"]])(
      "should accept valid slug %s",
      (slug) => {
        const parsed = projectCreateSchema.safeParse({ ...validCreate, slug });
        expect(parsed.success).toBe(true);
      }
    );

    it.each([
      ["My-Project"], // uppercase
      ["-leading-hyphen"],
      ["trailing-hyphen-"],
      ["double--hyphen"],
      ["has space"],
      ["has_underscore"],
      ["has.dot"],
      [""],
    ])("should reject invalid slug %s", (slug) => {
      const parsed = projectCreateSchema.safeParse({ ...validCreate, slug });
      expect(parsed.success).toBe(false);
    });
  });

  describe("techTags", () => {
    it("should reject an empty techTags array", () => {
      const parsed = projectCreateSchema.safeParse({ ...validCreate, techTags: [] });
      expect(parsed.success).toBe(false);
    });

    it("should reject techTags entries longer than 50 chars", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        techTags: ["a".repeat(51)],
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("optional URL fields", () => {
    it("should accept a valid liveUrl", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        liveUrl: "https://example.com",
      });
      expect(parsed.success).toBe(true);
    });

    it("should accept an empty-string liveUrl (literal('') branch)", () => {
      const parsed = projectCreateSchema.safeParse({ ...validCreate, liveUrl: "" });
      expect(parsed.success).toBe(true);
    });

    it("should reject a malformed liveUrl", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        liveUrl: "not a url",
      });
      expect(parsed.success).toBe(false);
    });

    it("should reject a malformed repoUrl", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        repoUrl: "not a url",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("startDate / endDate cross-field refinement", () => {
    it("should accept startDate before endDate", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
      });
      expect(parsed.success).toBe(true);
    });

    it("should reject endDate equal to or before startDate", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        startDate: "2024-12-31",
        endDate: "2024-01-01",
      });
      expect(parsed.success).toBe(false);
    });

    it("should accept startDate alone (endDate omitted)", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        startDate: "2024-01-01",
      });
      expect(parsed.success).toBe(true);
    });

    it("should accept endDate alone (startDate omitted)", () => {
      const parsed = projectCreateSchema.safeParse({
        ...validCreate,
        endDate: "2024-12-31",
      });
      expect(parsed.success).toBe(true);
    });
  });
});

describe("projectUpdateSchema", () => {
  it("should accept an empty object (all fields optional via .partial())", () => {
    const parsed = projectUpdateSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it("should accept a single-field update", () => {
    const parsed = projectUpdateSchema.safeParse({ title: "Updated" });
    expect(parsed.success).toBe(true);
  });

  it("should still apply the date-order refinement on partial updates", () => {
    const parsed = projectUpdateSchema.safeParse({
      startDate: "2024-12-31",
      endDate: "2024-01-01",
    });
    expect(parsed.success).toBe(false);
  });

  it("should reject an invalid slug in a partial update", () => {
    const parsed = projectUpdateSchema.safeParse({ slug: "INVALID SLUG" });
    expect(parsed.success).toBe(false);
  });

  it("should NOT fill defaults for omitted fields (status, featured, displayOrder, images)", () => {
    const parsed = projectUpdateSchema.safeParse({ title: "Updated" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).not.toHaveProperty("status");
      expect(parsed.data).not.toHaveProperty("featured");
      expect(parsed.data).not.toHaveProperty("displayOrder");
      expect(parsed.data).not.toHaveProperty("images");
    }
  });
});

describe("normalizeImagesToGroups", () => {
  it("should return [] for non-array input", () => {
    expect(normalizeImagesToGroups(null)).toEqual([]);
    expect(normalizeImagesToGroups(undefined)).toEqual([]);
    expect(normalizeImagesToGroups({})).toEqual([]);
  });

  it("should return [] for an empty array", () => {
    expect(normalizeImagesToGroups([])).toEqual([]);
  });

  it("should wrap legacy flat GalleryImage[] into a single unnamed group", () => {
    const legacy = [
      { url: "https://x.com/a.webp", alt: "A", order: 0 },
      { url: "https://x.com/b.webp", alt: "B", order: 1 },
    ];
    const result = normalizeImagesToGroups(legacy);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "", images: expect.any(Array) });
    expect(result[0].images).toHaveLength(2);
    expect(result[0].images[0]).toEqual({
      url: "https://x.com/a.webp",
      alt: "A",
      order: 0,
    });
  });

  it("should pass through the new GalleryImageGroup[] format unchanged", () => {
    const groups = [
      {
        name: "Hero",
        images: [{ url: "https://x.com/a.webp", alt: "A", order: 0 }],
      },
    ];
    const result = normalizeImagesToGroups(groups);
    expect(result).toEqual(groups);
  });
});
