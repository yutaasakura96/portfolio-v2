# Markdown Processing Utility

This utility provides server-side markdown to HTML conversion with enhanced features.

## Features

- ✅ **GitHub Flavored Markdown (GFM)**: Tables, strikethrough, task lists, autolinks
- ✅ **Syntax Highlighting**: Automatic code block highlighting with `highlight.js`
- ✅ **Auto-linked Headings**: Headings get IDs and clickable anchor links
- ✅ **XSS Protection**: `allowDangerousHtml: false` prevents injection attacks
- ✅ **Error Handling**: Graceful error handling with helpful messages

## Installation

All required dependencies are already installed:
```bash
npm install unified remark-parse remark-gfm remark-rehype
npm install rehype-slug rehype-autolink-headings rehype-highlight rehype-stringify
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
import { markdownToHtml } from '@/lib/markdown';

export const GET = async (req, { params }) => {
  const project = await prisma.project.findUnique({
    where: { id: params.id }
  });
  
  const descriptionHtml = await markdownToHtml(project.description);
  
  return Response.json({
    ...project,
    descriptionHtml
  });
};
```

### In Server Components (Blog Posts)

```typescript
// src/app/blog/[slug]/page.tsx
import { markdownToHtml } from '@/lib/markdown';

export default async function BlogPost({ params }) {
  const post = await getBlogPost(params.slug);
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
|---------|-----------|
| Tables | ✅ |
| Links | ✅ |
| Images | ✅ |

### Task Lists

- [x] Completed task
- [ ] Pending task

### Strikethrough

~~This text is crossed out~~

### Autolinks

https://example.com becomes a clickable link

## Styling

### Syntax Highlighting Theme

The app uses `github-dark` theme from highlight.js (imported in `src/app/layout.tsx`).

To change the theme, replace the import:
```typescript
// Available themes: github-dark, monokai, atom-one-dark, vs2015, etc.
import "highlight.js/styles/monokai.css";
```

### Markdown Content Styling

Use Tailwind's `prose` classes for beautiful typography:

```tsx
<div className="prose prose-lg dark:prose-invert max-w-none">
  {/* Your rendered HTML here */}
</div>
```

## Error Handling

The function handles errors gracefully:

```typescript
try {
  const html = await markdownToHtml(markdownContent);
  return html;
} catch (error) {
  console.error('Markdown processing failed:', error);
  return '<p>Unable to display content</p>';
}
```

## Security

- **XSS Protection**: `allowDangerousHtml: false` prevents malicious HTML injection
- **Safe by Default**: All HTML is escaped except for markdown-generated elements
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
- Ensure `highlight.js` CSS is imported in root layout
- Check that code blocks have language specified: \`\`\`typescript

### Headings not getting IDs?
- `rehype-slug` automatically adds IDs based on heading text
- Links are automatically wrapped around headings by `rehype-autolink-headings`

### Performance issues?
- Process markdown once and cache the HTML
- Don't call `markdownToHtml` on every render
- Use server components or API routes for processing
