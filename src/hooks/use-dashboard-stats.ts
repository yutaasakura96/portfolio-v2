"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export type DashboardRecentItem = {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
};

export type DashboardRecentMessage = {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
};

export type ExpiringCertification = {
  id: string;
  name: string;
  issuer: string;
  expirationDate: string;
};

export type DashboardStats = {
  projectCount: number;
  postCount: number;
  messageCount: number;
  recentProjects: DashboardRecentItem[];
  recentPosts: DashboardRecentItem[];
  publishedProjectCount: number;
  draftProjectCount: number;
  publishedPostCount: number;
  draftPostCount: number;
  totalMessageCount: number;
  archivedMessageCount: number;
  recentMessages: DashboardRecentMessage[];
  skillCount: number;
  experienceCount: number;
  educationCount: number;
  certificationCount: number;
  expiringCertifications: ExpiringCertification[];
  lastPublishedPost: { publishedAt: string; title: string } | null;
  hasHero: boolean;
  hasAbout: boolean;
  translationStats: {
    hero: boolean;
    about: boolean;
    settings: boolean;
    projects: number;
    blogPosts: number;
    experience: number;
    education: number;
    lastUpdated: string | null;
  };
};

const DASHBOARD_STATS_KEY = ["admin", "dashboard-stats"] as const;

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: () => apiClient.getDashboardStats<DashboardStats>().then((res) => res.data),
    staleTime: 30_000,
  });
}
