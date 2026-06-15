# Markdown Processing Utility

This utility provides server-side markdown to HTML conversion with enhanced features.

## Features

- ✅ **GitHub Flavored Markdown (GFM)**: Tables, strikethrough, task lists, autolinks
- ✅ **Syntax Highlighting**: Automatic code block highlighting with `highlight.js`
- ✅ **Heading IDs**: Headings get stable IDs via `rehype-slug`
- ✅ **XSS Protection**: `allowDangerousHtml: false` prevents injection attacks
- ✅ **Error Handling**: Graceful error handling with helpful messages

## Installation

All required dependencies are already installed:

```bash
npm install unified remark-parse remark-gfm remark-rehype
npm install rehype-sanitize rehype-slug rehype-highlight rehype-stringify
npm install highlight.js
```

## Usage

### Basic Usage

```typescript
import { markdownToHtml } from '@/lib/markdown';

async function MyComponent() {
  const markdown = '# Hello World\n\nThis is **bold** text.';
  const html = await markdownToHtml(markdown);

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

### In API Routes (Project Descriptions)

```typescript
// src/app/api/projects/[id]/route.ts
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { markdownToHtml } from "@/lib/markdown";
import { prisma } from "@/lib/prisma-client";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new ApiError("Project not found", 404, ErrorCodes.NOT_FOUND);
    }

    const descriptionHtml = await markdownToHtml(project.description ?? "");

    return Response.json({ data: { ...project, descriptionHtml } });
  }
);
```

### In Server Components (Blog Posts)

```typescript
// src/app/blog/[slug]/page.tsx
import { markdownToHtml } from '@/lib/markdown';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  const contentHtml = await markdownToHtml(post.content);

  return (
    <article>
      <h1>{post.title}</h1>
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
}
```

## Supported Markdown Features

### Code Blocks with Syntax Highlighting

\`\`\`typescript
const greeting: string = "Hello, World!";
console.log(greeting);
\`\`\`

### Tables

| Feature | Supported |
| ------- | --------- |
| Tables  | ✅        |
| Links   | ✅        |
| Images  | ✅        |

### Task Lists

- [x] Completed task
- [ ] Pending task

### Strikethrough

~~This text is crossed out~~

### Autolinks

https://example.com becomes a clickable link

## Styling

### Syntax Highlighting Theme

The blog detail route imports `github-dark` from highlight.js in `src/app/(public)/blog/[slug]/page.tsx`. Project detail pages use the same `markdownToHtml` pipeline but rely on their local prose styling.

To change the theme, replace the import:

```typescript
// Available themes: github-dark, monokai, atom-one-dark, vs2015, etc.
import "highlight.js/styles/monokai.css";
```

### Markdown Content Styling

Use Tailwind's `prose` classes for beautiful typography:

```tsx
<div className="prose prose-lg dark:prose-invert max-w-none">{/* Your rendered HTML here */}</div>
```

## Error Handling

The function handles errors gracefully:

```typescript
try {
  const html = await markdownToHtml(markdownContent);
  return html;
} catch (error) {
  console.error("Markdown processing failed:", error);
  return "<p>Unable to display content</p>";
}
```

## Security

- **XSS Protection**: `allowDangerousHtml: false` prevents raw HTML injection, and `rehype-sanitize` strips unsafe generated attributes while allowing highlight.js code/span classes
- **Safe by Default**: Raw HTML is escaped; only sanitized markdown-generated HTML is emitted
- **No Script Execution**: User-provided markdown cannot execute JavaScript

## Performance Considerations

- Process markdown on the server side (not client side)
- Cache processed HTML in the database for frequently accessed content
- Use Next.js caching for static content

## Common Use Cases

1. **Blog Posts**: Full markdown content → HTML
2. **Project Descriptions**: Rich formatting for project details
3. **README Files**: Display GitHub-style markdown
4. **Documentation**: Technical docs with code examples
5. **Comments**: User-generated content (with sanitization)

## Troubleshooting

### Syntax highlighting not working?

- Ensure the relevant route imports a `highlight.js` CSS theme
- Check that code blocks have language specified, for example: \`\`\`typescript

### Headings not getting IDs?

- `rehype-slug` automatically adds IDs based on heading text
- Heading anchor links are not currently injected; add `rehype-autolink-headings` deliberately if clickable heading links become a product requirement

### Performance issues?

- Process markdown once and cache the HTML
- Don't call `markdownToHtml` on every render
- Use server components or API routes for processing
