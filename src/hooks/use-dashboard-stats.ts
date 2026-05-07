"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export type DashboardRecentItem = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
};

export type DashboardStats = {
  projectCount: number;
  postCount: number;
  messageCount: number;
  recentProjects: DashboardRecentItem[];
  recentPosts: DashboardRecentItem[];
};

const DASHBOARD_STATS_KEY = ["admin", "dashboard-stats"] as const;

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: () => apiClient.getDashboardStats<DashboardStats>().then((res) => res.data),
    staleTime: 30_000,
  });
}
