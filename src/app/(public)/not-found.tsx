import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function PublicNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">Page not found</h1>
      <p className="mt-4 text-muted-foreground">
        Sorry, the page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go Home
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
        >
          View Projects
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
        >
          Read the Blog
        </Link>
      </div>
    </div>
  );
}
