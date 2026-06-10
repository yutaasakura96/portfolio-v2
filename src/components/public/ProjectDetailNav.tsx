"use client";

import { useLocale } from "@/hooks/use-locale";
import { ui } from "@/lib/i18n";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

interface NavProject {
  slug: string;
  title: string;
  titleJa: string | null;
}

interface ProjectDetailNavProps {
  prev: NavProject | null;
  next: NavProject | null;
}

export function ProjectDetailNav({ prev, next }: ProjectDetailNavProps) {
  const { locale } = useLocale();

  const getTitle = (p: NavProject): string =>
    locale === "ja" && p.titleJa?.trim() ? p.titleJa : p.title;

  return (
    <nav className="mt-12 pt-8 border-t border-border flex justify-between">
      {prev ? (
        <Link
          href={`/projects/${prev.slug}`}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <div>
            <div className="text-xs text-muted-foreground">{ui("previous", locale)}</div>
            <div className="font-medium">{getTitle(prev)}</div>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={`/projects/${next.slug}`}
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
        >
          <div>
            <div className="text-xs text-muted-foreground">{ui("next", locale)}</div>
            <div className="font-medium">{getTitle(next)}</div>
          </div>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
