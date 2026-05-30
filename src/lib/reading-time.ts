const WORDS_PER_MINUTE = 200;

function stripMarkdown(markdown: string): string {
  return (
    markdown
      // Code fences (exclude code block content from word count)
      .replace(/```[\s\S]*?```/g, "")
      // Inline code
      .replace(/`[^`]+`/g, "")
      // Images
      .replace(/!\[.*?\]\(.*?\)/g, "")
      // Links (keep link text)
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // HTML tags
      .replace(/<[^>]+>/g, "")
      // Heading markers
      .replace(/^#{1,6}\s+/gm, "")
      // Bold/italic markers
      .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
      // Horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, "")
      // Blockquote markers
      .replace(/^>\s?/gm, "")
  );
}

export function calculateReadingTime(markdown: string): number {
  if (!markdown || !markdown.trim()) return 0;

  const stripped = stripMarkdown(markdown);
  const words = stripped.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 0;

  return Math.ceil(words.length / WORDS_PER_MINUTE);
}

export function formatReadingTime(minutes: number | null): string {
  if (!minutes || minutes <= 0) return "< 1 min read";
  return `${minutes} min read`;
}
