import GithubSlugger from "github-slugger";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

// Extend the default sanitize schema to allow className on code/span
// so rehype-highlight's syntax-highlighting CSS classes survive sanitization
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
  },
};

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export function extractHeadings(markdown: string): TocItem[] {
  if (!markdown) return [];

  const slugger = new GithubSlugger();
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const text = match[2]
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .trim();
    items.push({
      id: slugger.slug(text),
      text,
      level: match[1].length,
    });
  }

  return items;
}

/**
 * Convert Markdown string to sanitized HTML.
 * Used for blog posts and project descriptions.
 *
 * Features:
 * - GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
 * - Automatic heading IDs for anchor links
 * - Automatic heading anchor links
 * - Syntax highlighting for code blocks
 * - XSS protection (dangerousHtml disabled)
 *
 * @param markdown - The markdown content to convert
 * @returns Promise<string> - The processed HTML string
 * @throws Error if markdown processing fails
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown || markdown.trim() === "") {
    return "";
  }

  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeSlug)
      .use(rehypeHighlight, { detect: true })
      .use(rehypeStringify)
      .process(markdown);

    return result.toString();
  } catch (error) {
    console.error("Markdown processing failed:", error);
    throw new Error(
      `Failed to process markdown content: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
