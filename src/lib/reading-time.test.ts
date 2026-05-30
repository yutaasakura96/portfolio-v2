import { describe, expect, it } from "vitest";

import { calculateReadingTime, formatReadingTime } from "./reading-time";

describe("calculateReadingTime", () => {
  it("should return 0 for empty string", () => {
    expect(calculateReadingTime("")).toBe(0);
  });

  it("should return 0 for whitespace-only string", () => {
    expect(calculateReadingTime("   \n\t  ")).toBe(0);
  });

  it("should return 1 for a single word", () => {
    expect(calculateReadingTime("hello")).toBe(1);
  });

  it("should return 1 for exactly 200 words", () => {
    const words = Array(200).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(1);
  });

  it("should return 2 for 201 words", () => {
    const words = Array(201).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("should return 2 for 400 words", () => {
    const words = Array(400).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(2);
  });

  it("should return 3 for 401 words", () => {
    const words = Array(401).fill("word").join(" ");
    expect(calculateReadingTime(words)).toBe(3);
  });

  it("should exclude code fence content from word count", () => {
    const md = `Some intro text here.\n\n\`\`\`js\nconst x = 1;\nconst y = 2;\nconst z = 3;\n\`\`\`\n\nSome outro text.`;
    const withoutCode = calculateReadingTime("Some intro text here. Some outro text.");
    expect(calculateReadingTime(md)).toBe(withoutCode);
  });

  it("should exclude inline code from word count", () => {
    const md = "Use the `calculateReadingTime` function";
    expect(calculateReadingTime(md)).toBe(calculateReadingTime("Use the  function"));
  });

  it("should exclude image syntax from word count", () => {
    const md = "Before ![alt text](https://example.com/image.png) after";
    expect(calculateReadingTime(md)).toBe(calculateReadingTime("Before  after"));
  });

  it("should keep link text but exclude URLs", () => {
    const md = "Click [this link](https://example.com) here";
    expect(calculateReadingTime(md)).toBe(calculateReadingTime("Click this link here"));
  });

  it("should strip HTML tags", () => {
    const md = "Hello <strong>world</strong> test";
    expect(calculateReadingTime(md)).toBe(calculateReadingTime("Hello world test"));
  });

  it("should strip heading markers", () => {
    const md = "# Heading One\n\n## Heading Two\n\nBody text here.";
    expect(calculateReadingTime(md)).toBe(
      calculateReadingTime("Heading One\n\nHeading Two\n\nBody text here.")
    );
  });

  it("should strip bold and italic markers", () => {
    const md = "This is **bold** and *italic* and ***both*** text";
    expect(calculateReadingTime(md)).toBe(
      calculateReadingTime("This is bold and italic and both text")
    );
  });

  it("should strip blockquote markers", () => {
    const md = "> This is a quote\n> with two lines";
    expect(calculateReadingTime(md)).toBe(calculateReadingTime("This is a quote\nwith two lines"));
  });

  it("should return 0 when content is only markdown syntax", () => {
    const md = "```\n```\n\n---\n\n![](url)";
    expect(calculateReadingTime(md)).toBe(0);
  });
});

describe("formatReadingTime", () => {
  it('should return "< 1 min read" for null', () => {
    expect(formatReadingTime(null)).toBe("< 1 min read");
  });

  it('should return "< 1 min read" for 0', () => {
    expect(formatReadingTime(0)).toBe("< 1 min read");
  });

  it('should return "< 1 min read" for negative numbers', () => {
    expect(formatReadingTime(-1)).toBe("< 1 min read");
  });

  it('should return "1 min read" for 1', () => {
    expect(formatReadingTime(1)).toBe("1 min read");
  });

  it('should return "5 min read" for 5', () => {
    expect(formatReadingTime(5)).toBe("5 min read");
  });

  it('should return "15 min read" for 15', () => {
    expect(formatReadingTime(15)).toBe("15 min read");
  });
});
