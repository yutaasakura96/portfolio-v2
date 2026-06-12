"use client";

import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

export type SentryIssue = {
  id: string;
  title: string;
  level: string;
  count: string;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

export type SentryStats = {
  configured: boolean;
  unresolved: number;
  issues: SentryIssue[];
};

export type AmplifyBuild = {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  branchName: string;
  commitMessage: string;
};

export type AmplifyStats = {
  configured: boolean;
  lastBuild: AmplifyBuild | null;
  recentBuilds: AmplifyBuild[];
};

export type SiteHealthStats = {
  status: "ok" | "degraded" | "unreachable";
  responseTime: number;
  database: string;
};

export type AnalyticsStats = {
  configured: boolean;
  propertyId: string | null;
};

export type ExternalStats = {
  sentry: SentryStats | null;
  amplify: AmplifyStats | null;
  siteHealth: SiteHealthStats | null;
  analytics: AnalyticsStats | null;
};

const EXTERNAL_STATS_KEY = ["admin", "dashboard-external"] as const;

export function useDashboardExternal() {
  return useQuery({
    queryKey: EXTERNAL_STATS_KEY,
    queryFn: () => apiClient.getDashboardExternal<ExternalStats>().then((res) => res.data),
    staleTime: 60_000,
    retry: 1,
  });
}
