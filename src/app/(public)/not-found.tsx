import { LocalizedUi } from "@/components/public/LocalizedContent";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
};

export default function PublicNotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-24 text-center">
      <p className="text-sm font-semibold text-muted-foreground">404</p>
      <LocalizedUi
        k="pageNotFound"
        as="h1"
        className="mt-2 text-3xl font-bold text-foreground sm:text-4xl"
      />
      <LocalizedUi k="pageNotFoundDescription" as="p" className="mt-4 text-muted-foreground" />
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <LocalizedUi k="goHome" />
        </Link>
        <Link
          href="/projects"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
        >
          <LocalizedUi k="viewProjects" />
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
        >
          <LocalizedUi k="readTheBlog" />
        </Link>
      </div>
    </div>
  );
}
