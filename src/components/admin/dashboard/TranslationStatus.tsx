"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import { Check, Circle, Globe, Languages } from "lucide-react";
import Link from "next/link";

type TranslationStatusProps = {
  stats: DashboardStats["translationStats"];
  totals: {
    projects: number;
    blogPosts: number;
    experience: number;
    education: number;
  };
};

type TranslationItem = {
  label: string;
  translated: boolean | number;
  total?: number;
};

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function TranslationStatus({ stats, totals }: TranslationStatusProps) {
  const items: TranslationItem[] = [
    { label: "Hero", translated: stats.hero },
    { label: "About", translated: stats.about },
    { label: "Settings", translated: stats.settings },
    { label: "Projects", translated: stats.projects, total: totals.projects },
    { label: "Blog Posts", translated: stats.blogPosts, total: totals.blogPosts },
    { label: "Experience", translated: stats.experience, total: totals.experience },
    { label: "Education", translated: stats.education, total: totals.education },
  ];

  const singletonsDone = [stats.hero, stats.about, stats.settings].filter(Boolean).length;
  const collectionsDone = stats.projects + stats.blogPosts + stats.experience + stats.education;
  const collectionsTotal =
    totals.projects + totals.blogPosts + totals.experience + totals.education;
  const totalDone = singletonsDone + collectionsDone;
  const totalAll = 3 + collectionsTotal;
  const percentage = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-[var(--accent-signature)]" />
            Japanese Translation
          </span>
          <span className="text-muted-foreground tabular-nums">{percentage}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--accent-signature)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
          {items.map((item) => {
            const isDone =
              typeof item.translated === "boolean"
                ? item.translated
                : item.total !== undefined && item.translated >= item.total && item.total > 0;

            return (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {isDone ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className={cn("truncate", !isDone && "text-muted-foreground")}>
                  {item.label}
                </span>
                {item.total !== undefined && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.translated}/{item.total}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t pt-2">
          {stats.lastUpdated ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              Last updated {formatTimeAgo(stats.lastUpdated)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">No translations yet</span>
          )}
          <Link
            href="/admin/translations"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Manage &rarr;
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
