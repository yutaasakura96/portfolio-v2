import { describe, it, expect } from "vitest";
import { t, tArray, tJson, ui, localizeSkillCategory } from "./i18n";

// ── t() ──────────────────────────────────────────────────────────────────────

describe("t()", () => {
  it("should return the EN field value for en locale", () => {
    const record = { title: "Hello", titleJa: "こんにちは" };
    expect(t(record, "title", "en")).toBe("Hello");
  });

  it("should return the JA field value when locale is ja and JA value is non-empty", () => {
    const record = { title: "Hello", titleJa: "こんにちは" };
    expect(t(record, "title", "ja")).toBe("こんにちは");
  });

  it("should fall back to EN when locale is ja and JA value is an empty string", () => {
    const record = { title: "Hello", titleJa: "" };
    expect(t(record, "title", "ja")).toBe("Hello");
  });

  it("should fall back to EN when locale is ja and JA value is whitespace only", () => {
    const record = { title: "Hello", titleJa: "   " };
    expect(t(record, "title", "ja")).toBe("Hello");
  });

  it("should fall back to EN when locale is ja and JA field is undefined", () => {
    const record = { title: "Hello" } as { title: string; titleJa?: string };
    expect(t(record, "title", "ja")).toBe("Hello");
  });

  it("should fall back to EN when locale is ja and JA field is null", () => {
    const record = { title: "Hello", titleJa: null } as unknown as {
      title: string;
      titleJa: string | null;
    };
    expect(t(record, "title", "ja")).toBe("Hello");
  });

  it("should return empty string when EN field is not a string", () => {
    const record = { title: 42 } as unknown as { title: string };
    expect(t(record, "title", "en")).toBe("");
  });
});

// ── tArray() ─────────────────────────────────────────────────────────────────

describe("tArray()", () => {
  it("should return the EN array for en locale", () => {
    const record = { tags: ["a", "b"], tagsJa: ["あ", "い"] };
    expect(tArray(record, "tags", "en")).toEqual(["a", "b"]);
  });

  it("should return the JA array when locale is ja and JA array is non-empty", () => {
    const record = { tags: ["a", "b"], tagsJa: ["あ", "い"] };
    expect(tArray(record, "tags", "ja")).toEqual(["あ", "い"]);
  });

  it("should fall back to EN when locale is ja and JA array is empty", () => {
    const record = { tags: ["a", "b"], tagsJa: [] };
    expect(tArray(record, "tags", "ja")).toEqual(["a", "b"]);
  });

  it("should fall back to EN when locale is ja and JA field is null", () => {
    const record = { tags: ["a", "b"], tagsJa: null } as unknown as {
      tags: string[];
      tagsJa: string[] | null;
    };
    expect(tArray(record, "tags", "ja")).toEqual(["a", "b"]);
  });

  it("should fall back to EN when locale is ja and JA field is undefined", () => {
    const record = { tags: ["a", "b"] } as { tags: string[]; tagsJa?: string[] };
    expect(tArray(record, "tags", "ja")).toEqual(["a", "b"]);
  });

  it("should return empty array when EN field is not an array", () => {
    const record = { tags: "not-an-array" } as unknown as { tags: string[] };
    expect(tArray(record, "tags", "en")).toEqual([]);
  });
});

// ── tJson() ──────────────────────────────────────────────────────────────────

describe("tJson()", () => {
  it("should return the EN JSON value for en locale", () => {
    const enValue = { label: "Click me", href: "/en" };
    const jaValue = { label: "クリック", href: "/ja" };
    const record = { cta: enValue, ctaJa: jaValue };
    expect(tJson<typeof record, typeof enValue>(record, "cta", "en")).toEqual(enValue);
  });

  it("should return the JA JSON value when locale is ja and JA value is present", () => {
    const enValue = { label: "Click me", href: "/en" };
    const jaValue = { label: "クリック", href: "/ja" };
    const record = { cta: enValue, ctaJa: jaValue };
    expect(tJson<typeof record, typeof jaValue>(record, "cta", "ja")).toEqual(jaValue);
  });

  it("should fall back to EN when locale is ja and JA field is null", () => {
    const enValue = { label: "Click me" };
    const record = { cta: enValue, ctaJa: null } as {
      cta: typeof enValue;
      ctaJa: typeof enValue | null;
    };
    expect(tJson<typeof record, typeof enValue>(record, "cta", "ja")).toEqual(enValue);
  });

  it("should fall back to EN when locale is ja and JA field is undefined", () => {
    const enValue = { label: "Click me" };
    const record = { cta: enValue } as { cta: typeof enValue; ctaJa?: typeof enValue };
    expect(tJson<typeof record, typeof enValue>(record, "cta", "ja")).toEqual(enValue);
  });
});

// ── ui() ─────────────────────────────────────────────────────────────────────

describe("ui()", () => {
  it("should return the correct EN string for 'home'", () => {
    expect(ui("home", "en")).toBe("Home");
  });

  it("should return the correct JA string for 'home'", () => {
    expect(ui("home", "ja")).toBe("ホーム");
  });

  it("should return the correct EN string for 'projects'", () => {
    expect(ui("projects", "en")).toBe("Projects");
  });

  it("should return the correct JA string for 'projects'", () => {
    expect(ui("projects", "ja")).toBe("プロジェクト");
  });

  it("should return the correct EN string for 'blog'", () => {
    expect(ui("blog", "en")).toBe("Blog");
  });

  it("should return the correct JA string for 'blog'", () => {
    expect(ui("blog", "ja")).toBe("ブログ");
  });

  it("should return the correct EN string for 'send'", () => {
    expect(ui("send", "en")).toBe("Send Message");
  });

  it("should return the correct JA string for 'send'", () => {
    expect(ui("send", "ja")).toBe("送信する");
  });

  it("should return the correct EN string for 'copyright'", () => {
    expect(ui("copyright", "en")).toBe("Yuta Asakura | Portfolio");
  });

  it("should return the correct JA string for 'copyright'", () => {
    expect(ui("copyright", "ja")).toBe("朝倉優太 | ポートフォリオ");
  });
});

// ── localizeSkillCategory() ──────────────────────────────────────────────────

describe("localizeSkillCategory()", () => {
  it("should return the JA translation for a known category", () => {
    expect(localizeSkillCategory("Languages", "ja")).toBe("言語");
  });

  it("should return the JA translation for 'Cloud & DevOps'", () => {
    expect(localizeSkillCategory("Cloud & DevOps", "ja")).toBe("クラウド & DevOps");
  });

  it("should return the JA translation for 'AWS Services'", () => {
    expect(localizeSkillCategory("AWS Services", "ja")).toBe("AWSサービス");
  });

  it("should pass through an unknown category unchanged in ja locale", () => {
    expect(localizeSkillCategory("UnknownCategory", "ja")).toBe("UnknownCategory");
  });

  it("should always pass through the category unchanged in en locale", () => {
    expect(localizeSkillCategory("Languages", "en")).toBe("Languages");
  });

  it("should always pass through an unknown category unchanged in en locale", () => {
    expect(localizeSkillCategory("UnknownCategory", "en")).toBe("UnknownCategory");
  });
});
