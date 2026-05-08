export default function BlogPostLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Back link */}
      <div className="mb-8 h-4 w-24 bg-muted/60 rounded animate-pulse" />

      {/* Header */}
      <header className="mb-8">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="h-5 w-14 bg-muted/60 rounded-full animate-pulse" />
          <div className="h-5 w-20 bg-muted/60 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
        </div>

        {/* Title */}
        <div className="space-y-3">
          <div className="h-9 w-full bg-muted rounded animate-pulse" />
          <div className="h-9 w-3/4 bg-muted rounded animate-pulse" />
        </div>

        {/* Meta */}
        <div className="mt-4 flex items-center gap-4">
          <div className="h-4 w-32 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
        </div>
      </header>

      {/* Featured image */}
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted mb-8 animate-pulse" />

      {/* Article body */}
      <div className="space-y-4">
        {/* Paragraph 1 */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-11/12 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Subheading */}
        <div className="h-7 w-2/3 bg-muted rounded animate-pulse mt-8" />

        {/* Paragraph 2 */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Code block placeholder */}
        <div className="h-32 w-full bg-muted rounded-lg animate-pulse mt-6" />

        {/* Paragraph 3 */}
        <div className="space-y-2 mt-6">
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-11/12 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-4/5 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 pt-8 border-t border-border">
        <div className="h-4 w-72 max-w-full bg-muted/60 rounded animate-pulse" />
      </div>
    </article>
  );
}
