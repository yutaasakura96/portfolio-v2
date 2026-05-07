"use client";

import Link from "next/link";

export default function ProjectError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">Error loading project</h1>
      <p className="mt-4 text-muted-foreground">
        Something went wrong. The project may have been removed.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          Try Again
        </button>
        <Link
          href="/projects"
          className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent"
        >
          All Projects
        </Link>
      </div>
    </div>
  );
}
