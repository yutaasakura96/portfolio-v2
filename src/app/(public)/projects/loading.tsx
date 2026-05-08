export default function ProjectsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-44 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-[28rem] max-w-full bg-muted/60 rounded animate-pulse" />
      </div>

      {/* Filter / search bar (ProjectBrowser) */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-10 w-full sm:max-w-xs bg-muted/60 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-muted/60 rounded-lg animate-pulse" />
          <div className="h-10 w-24 bg-muted/60 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Tag pills row */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[64, 80, 56, 72, 68, 60, 88].map((w, i) => (
          <div
            key={i}
            className="h-7 bg-muted/60 rounded-full animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Project cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="aspect-video w-full bg-muted animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="h-5 w-14 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-5 w-16 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-5 w-12 bg-muted/60 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
