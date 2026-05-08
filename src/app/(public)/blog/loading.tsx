export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-24 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-[26rem] max-w-full bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Post cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-video w-full bg-muted animate-pulse" />
            <div className="p-5 space-y-3">
              {/* Tag chip */}
              <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
              {/* Title */}
              <div className="h-5 w-5/6 bg-muted rounded animate-pulse" />
              <div className="h-5 w-2/3 bg-muted rounded animate-pulse" />
              {/* Excerpt */}
              <div className="space-y-2 pt-1">
                <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-11/12 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
              </div>
              {/* Meta */}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
