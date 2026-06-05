"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardRecentItem } from "@/hooks/use-dashboard-stats";
import { timeAgo } from "@/lib/time-ago";
import { FileText, FolderKanban } from "lucide-react";
import Link from "next/link";

type RecentActivityProps = {
  projects: DashboardRecentItem[];
  posts: DashboardRecentItem[];
};

type ActivityItem = DashboardRecentItem & { type: "project" | "post" };

export function RecentActivity({ projects, posts }: RecentActivityProps) {
  const items: ActivityItem[] = [
    ...projects.map((p) => ({ ...p, type: "project" as const })),
    ...posts.map((p) => ({ ...p, type: "post" as const })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = item.type === "project" ? FolderKanban : FileText;
              const href =
                item.type === "project"
                  ? `/admin/projects/${item.id}/edit`
                  : `/admin/blog/${item.id}/edit`;

              return (
                <Link
                  key={item.id}
                  href={href}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</span>
                  <Badge
                    variant={item.status === "PUBLISHED" ? "default" : "secondary"}
                    className="shrink-0 text-xs"
                  >
                    {item.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {timeAgo(item.updatedAt)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
