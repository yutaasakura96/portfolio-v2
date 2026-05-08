export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="h-9 w-48 bg-muted rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted/60 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-muted/60 rounded animate-pulse" />
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Form skeleton — 2/3 width on lg */}
        <div className="lg:col-span-2 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
            <div className="h-10 w-full bg-muted/60 rounded-lg animate-pulse" />
          </div>
          {/* Email */}
          <div className="space-y-2">
            <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
            <div className="h-10 w-full bg-muted/60 rounded-lg animate-pulse" />
          </div>
          {/* Subject */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
            <div className="h-10 w-full bg-muted/60 rounded-lg animate-pulse" />
          </div>
          {/* Message */}
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
            <div className="h-32 w-full bg-muted/60 rounded-lg animate-pulse" />
          </div>
          {/* Submit */}
          <div className="h-10 w-36 bg-muted rounded-lg animate-pulse" />
        </div>

        {/* Sidebar info skeleton */}
        <div className="space-y-6">
          {/* "Other ways" card */}
          <div className="rounded-lg border border-border bg-muted p-6">
            <div className="h-4 w-40 bg-muted-foreground/20 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-12 bg-muted-foreground/20 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted-foreground/20 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-5 w-5 bg-muted-foreground/20 rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-muted-foreground/20 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* "Response time" card */}
          <div className="rounded-lg border border-border bg-muted p-6">
            <div className="h-4 w-32 bg-muted-foreground/20 rounded animate-pulse mb-3" />
            <div className="h-3 w-full bg-muted-foreground/20 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-muted-foreground/20 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
