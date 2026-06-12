"use client";

import { CertificationAlerts } from "@/components/admin/dashboard/CertificationAlerts";
import { ContentCompleteness } from "@/components/admin/dashboard/ContentCompleteness";
import { ExternalServices } from "@/components/admin/dashboard/ExternalServices";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { RecentMessages } from "@/components/admin/dashboard/RecentMessages";
import { StatsCards } from "@/components/admin/dashboard/StatsCards";
import { TranslationStatus } from "@/components/admin/dashboard/TranslationStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { AlertCircle } from "lucide-react";

export default function AdminDashboard() {
  const { data, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-medium text-foreground">Failed to load dashboard</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unable to load dashboard stats."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-display">Dashboard</h1>
      <StatsCards data={data} />
      <QuickActions messageCount={data.messageCount} />
      <CertificationAlerts certs={data.expiringCertifications} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentMessages messages={data.recentMessages} totalUnread={data.messageCount} />
        <RecentActivity projects={data.recentProjects} posts={data.recentPosts} />
      </div>
      <TranslationStatus
        stats={data.translationStats}
        totals={{
          projects: data.publishedProjectCount,
          blogPosts: data.publishedPostCount,
          experience: data.experienceCount,
          education: data.educationCount,
        }}
      />
      <ExternalServices />
      <ContentCompleteness data={data} />
    </div>
  );
}
