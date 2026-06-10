"use client";

import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import Link from "next/link";

export default function BlogPostError({ reset }: { reset: () => void }) {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">{ui("errorLoadingPost", locale)}</h1>
      <p className="mt-4 text-muted-foreground">{ui("errorPostDescription", locale)}</p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          {ui("tryAgain", locale)}
        </button>
        <Link
          href="/blog"
          className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent"
        >
          {ui("allPosts", locale)}
        </Link>
      </div>
    </div>
  );
}
