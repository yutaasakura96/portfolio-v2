"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/hooks/use-dashboard-stats";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";
import Link from "next/link";

type ContentCompletenessProps = {
  data: DashboardStats;
};

type CheckItem = {
  label: string;
  done: boolean;
  count?: number;
  href: string;
};

export function ContentCompleteness({ data }: ContentCompletenessProps) {
  const items: CheckItem[] = [
    { label: "Hero section", done: data.hasHero, href: "/admin/hero" },
    { label: "About page", done: data.hasAbout, href: "/admin/about" },
    {
      label: "Projects",
      done: data.projectCount > 0,
      count: data.projectCount,
      href: "/admin/projects",
    },
    { label: "Blog posts", done: data.postCount > 0, count: data.postCount, href: "/admin/blog" },
    { label: "Skills", done: data.skillCount > 0, count: data.skillCount, href: "/admin/skills" },
    {
      label: "Experience",
      done: data.experienceCount > 0,
      count: data.experienceCount,
      href: "/admin/experience",
    },
    {
      label: "Education",
      done: data.educationCount > 0,
      count: data.educationCount,
      href: "/admin/education",
    },
    {
      label: "Certifications",
      done: data.certificationCount > 0,
      count: data.certificationCount,
      href: "/admin/certifications",
    },
  ];

  const completed = items.filter((i) => i.done).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>Content Completeness</span>
          <span className="text-muted-foreground tabular-nums">
            {completed}/{items.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted"
            >
              {item.done ? (
                <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className={cn("truncate", !item.done && "text-muted-foreground")}>
                {item.label}
              </span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs text-muted-foreground tabular-nums">{item.count}</span>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
