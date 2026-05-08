export default function ProjectDetailLoading() {
  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Back link */}
      <div className="mb-8 h-4 w-28 bg-muted/60 rounded animate-pulse" />

      {/* Header */}
      <header className="mb-8">
        <div className="h-10 w-3/4 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-5 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-5 w-5/6 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted/60 rounded animate-pulse" />
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-muted/60 rounded-lg animate-pulse" />
        </div>
      </header>

      {/* Hero image */}
      <div className="rounded-xl overflow-hidden mb-8 aspect-video bg-muted animate-pulse" />

      {/* Tech stack */}
      <div className="mb-8">
        <div className="h-4 w-24 bg-muted/60 rounded animate-pulse mb-3" />
        <div className="flex flex-wrap gap-2">
          {[60, 72, 80, 56, 68, 64].map((w, i) => (
            <div
              key={i}
              className="h-7 bg-muted/60 rounded-full animate-pulse"
              style={{ width: w }}
            />
          ))}
        </div>
      </div>

      {/* Problem / Solution cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[0, 1].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-border bg-card space-y-3">
            <div className="h-4 w-28 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-muted/60 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-muted/60 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Body / description */}
      <div className="space-y-3 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-muted/60 rounded animate-pulse"
            style={{ width: `${85 + ((i * 7) % 15)}%` }}
          />
        ))}
      </div>

      {/* Prev/Next nav */}
      <nav className="mt-12 pt-8 border-t border-border flex justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 w-12 bg-muted/60 rounded animate-pulse ml-auto" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </nav>
    </article>
  );
}
