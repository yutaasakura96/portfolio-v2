"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-destructive">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground">Unexpected Error</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        An error occurred while loading this page. Please try again, or return to the homepage.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
