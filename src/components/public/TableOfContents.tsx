"use client";

import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/markdown";

interface TableOfContentsProps {
  headings: TocItem[];
  variant: "mobile" | "desktop";
}

export function TableOfContents({ headings, variant }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const el of elements) {
      observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const tocContent = (
    <ul className="space-y-1 text-sm">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            onClick={(e) => handleClick(e, heading.id)}
            className={cn(
              "block py-1 transition-colors duration-150 hover:text-foreground",
              heading.level === 3 && "pl-4",
              heading.level === 4 && "pl-8",
              activeId === heading.id
                ? "text-[var(--accent-signature)] font-medium"
                : "text-muted-foreground"
            )}
          >
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  );

  if (variant === "mobile") {
    return (
      <details className="lg:hidden border border-border rounded-lg p-4 mb-8 bg-card">
        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground select-none">
          <List className="h-4 w-4" />
          Table of Contents
        </summary>
        <div className="mt-3 pt-3 border-t border-border">{tocContent}</div>
      </details>
    );
  }

  return (
    <nav
      className="hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
      aria-label="Table of contents"
    >
      <p className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <List className="h-4 w-4" />
        On this page
      </p>
      {tocContent}
    </nav>
  );
}
