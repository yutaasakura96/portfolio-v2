"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/hooks/use-dashboard-stats";
import { FileText, FolderKanban, Mail, Sparkles } from "lucide-react";

type StatsCardsProps = {
  data: DashboardStats;
};

export function StatsCards({ data }: StatsCardsProps) {
  const cards = [
    {
      label: "Projects",
      icon: FolderKanban,
      total: data.projectCount,
      detail: `${data.publishedProjectCount} published, ${data.draftProjectCount} draft`,
    },
    {
      label: "Blog Posts",
      icon: FileText,
      total: data.postCount,
      detail: `${data.publishedPostCount} published, ${data.draftPostCount} draft`,
    },
    {
      label: "Messages",
      icon: Mail,
      total: data.totalMessageCount,
      detail: `${data.messageCount} unread, ${data.archivedMessageCount} archived`,
      accent: data.messageCount > 0,
    },
    {
      label: "Skills",
      icon: Sparkles,
      total: data.skillCount,
      detail: `${data.experienceCount} exp, ${data.educationCount} edu, ${data.certificationCount} certs`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="transition-shadow duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <Icon
                className={`h-4 w-4 ${card.accent ? "text-destructive" : "text-[var(--accent-signature)]"}`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{card.total}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
