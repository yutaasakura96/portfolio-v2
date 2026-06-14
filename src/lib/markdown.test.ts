import { describe, it, expect } from "vitest";
import { extractHeadings, markdownToHtml } from "./markdown";

describe("extractHeadings", () => {
  it("should return [] for empty string", () => {
    expect(extractHeadings("")).toEqual([]);
  });

  it("should return [] for whitespace-only input", () => {
    expect(extractHeadings("   \n\t  ")).toEqual([]);
  });

  it("should return [] when only h1 headings are present", () => {
    const md = "# Title\n# Another Title";
    expect(extractHeadings(md)).toEqual([]);
  });

  it("should capture h2 headings with correct level and text", () => {
    const md = "## Section One";
    const result = extractHeadings(md);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: "section-one", text: "Section One", level: 2 });
  });

  it("should capture h3 and h4 headings with correct levels", () => {
    const md = "### Subsection\n#### Deep";
    const result = extractHeadings(md);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ level: 3, text: "Subsection" });
    expect(result[1]).toMatchObject({ level: 4, text: "Deep" });
  });

  it("should capture mixed heading levels (h2, h3, h4)", () => {
    const md = "## A\n### B\n#### C";
    const result = extractHeadings(md);
    expect(result.map((r) => r.level)).toEqual([2, 3, 4]);
    expect(result.map((r) => r.text)).toEqual(["A", "B", "C"]);
  });

  it("should strip inline bold from heading text", () => {
    const md = "## **Bold Heading**";
    const result = extractHeadings(md);
    expect(result[0].text).toBe("Bold Heading");
  });

  it("should strip inline code from heading text", () => {
    const md = "## Use `code` here";
    const result = extractHeadings(md);
    expect(result[0].text).toBe("Use code here");
  });

  it("should strip inline bold and code together", () => {
    const md = "## **Strong** and `code`";
    const result = extractHeadings(md);
    expect(result[0].text).toBe("Strong and code");
  });

  it("should produce unique slugs for duplicate heading text (GithubSlugger behavior)", () => {
    const md = "## Heading\n## Heading\n## Heading";
    const result = extractHeadings(md);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("heading");
    expect(result[1].id).toBe("heading-1");
    expect(result[2].id).toBe("heading-2");
  });

  it("should not count h1 toward duplicate slug numbering", () => {
    const md = "# Intro\n## Intro";
    const result = extractHeadings(md);
    // h1 is excluded — the h2 gets the base slug with no suffix
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("intro");
  });
});

describe("markdownToHtml", () => {
  it("should return empty string for empty input", async () => {
    expect(await markdownToHtml("")).toBe("");
  });

  it("should return empty string for whitespace-only input", async () => {
    expect(await markdownToHtml("   \n  ")).toBe("");
  });

  it("should strip script tags (XSS protection)", async () => {
    const html = await markdownToHtml("<script>alert('xss')</script>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert");
  });

  it("should render GFM tables as <table> elements", async () => {
    const md = "| A | B |\n|---|---|\n| 1 | 2 |";
    const html = await markdownToHtml(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
  });

  it("should highlight code blocks with hljs class", async () => {
    const md = "```js\nconst x = 1;\n```";
    const html = await markdownToHtml(md);
    expect(html).toContain("hljs");
  });

  it("should render bold text", async () => {
    const html = await markdownToHtml("**bold**");
    expect(html).toContain("<strong>");
  });

  it("should render italic text", async () => {
    const html = await markdownToHtml("_italic_");
    expect(html).toContain("<em>");
  });

  it("should render anchor links", async () => {
    const html = await markdownToHtml("[link](https://example.com)");
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("link");
  });

  it("should add id attributes to headings (rehype-slug)", async () => {
    const html = await markdownToHtml("## My Section");
    expect(html).toContain('id="my-section"');
  });
});
