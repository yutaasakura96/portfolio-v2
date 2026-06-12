"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardExternal } from "@/hooks/use-dashboard-external";
import { cn } from "@/lib/utils";
import type {
  AmplifyStats,
  AnalyticsStats,
  SentryStats,
  SiteHealthStats,
} from "@/hooks/use-dashboard-external";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bug,
  CheckCircle2,
  Cloud,
  ExternalLink,
  Hammer,
  Settings2,
  XCircle,
} from "lucide-react";

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotConfigured({ service }: { service: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Settings2 className="h-3 w-3" />
      <span>{service} not configured</span>
    </div>
  );
}

function SentryCard({ stats }: { stats: SentryStats | null }) {
  if (!stats) {
    return (
      <ServiceCard title="Sentry" icon={Bug} status="error">
        <p className="text-xs text-muted-foreground">Failed to fetch</p>
      </ServiceCard>
    );
  }

  if (!stats.configured) {
    return (
      <ServiceCard title="Sentry" icon={Bug} status="unconfigured">
        <NotConfigured service="SENTRY_ORG_SLUG / SENTRY_PROJECT_SLUG" />
      </ServiceCard>
    );
  }

  return (
    <ServiceCard
      title="Sentry"
      icon={Bug}
      status={stats.unresolved > 0 ? "warning" : "ok"}
      badge={stats.unresolved > 0 ? `${stats.unresolved} unresolved` : "All clear"}
    >
      {stats.issues.length > 0 ? (
        <ul className="space-y-1.5">
          {stats.issues.slice(0, 3).map((issue) => (
            <li key={issue.id}>
              <a
                href={issue.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2 text-xs hover:text-foreground"
              >
                <span
                  className={cn(
                    "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    issue.level === "error"
                      ? "bg-destructive"
                      : issue.level === "fatal"
                        ? "bg-red-700 dark:bg-red-500"
                        : "bg-amber-500"
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground group-hover:text-foreground">
                  {issue.title}
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatTimeAgo(issue.lastSeen)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">No unresolved issues</p>
      )}
    </ServiceCard>
  );
}

function AmplifyCard({ stats }: { stats: AmplifyStats | null }) {
  if (!stats) {
    return (
      <ServiceCard title="AWS Amplify" icon={Cloud} status="error">
        <p className="text-xs text-muted-foreground">Failed to fetch</p>
      </ServiceCard>
    );
  }

  if (!stats.configured) {
    return (
      <ServiceCard title="AWS Amplify" icon={Cloud} status="unconfigured">
        <NotConfigured service="AMPLIFY_APP_ID" />
      </ServiceCard>
    );
  }

  const build = stats.lastBuild;
  if (!build) {
    return (
      <ServiceCard title="AWS Amplify" icon={Cloud} status="ok">
        <p className="text-xs text-muted-foreground">No builds found</p>
      </ServiceCard>
    );
  }

  const buildStatus = build.status.toUpperCase();
  const isSuccess = buildStatus === "SUCCEED";
  const isFailed = buildStatus === "FAILED";
  const isRunning = buildStatus === "RUNNING" || buildStatus === "PENDING";

  let duration = "";
  if (build.startTime && build.endTime) {
    const ms = new Date(build.endTime).getTime() - new Date(build.startTime).getTime();
    const secs = Math.floor(ms / 1000);
    duration = secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
  }

  return (
    <ServiceCard
      title="AWS Amplify"
      icon={Cloud}
      status={isFailed ? "error" : isRunning ? "warning" : "ok"}
      badge={isRunning ? "Building..." : isSuccess ? "Deployed" : buildStatus}
    >
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Hammer className="h-3 w-3 text-muted-foreground" />
          <span className="truncate text-muted-foreground">{build.commitMessage || "—"}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{build.branchName}</span>
          {duration && <span>{duration}</span>}
          <span>{formatTimeAgo(build.startTime)}</span>
        </div>
      </div>
    </ServiceCard>
  );
}

function SiteHealthCard({ stats }: { stats: SiteHealthStats | null }) {
  if (!stats) {
    return (
      <ServiceCard title="Site Health" icon={Activity} status="error">
        <p className="text-xs text-muted-foreground">Check failed</p>
      </ServiceCard>
    );
  }

  const isOk = stats.status === "ok";
  const isDown = stats.status === "unreachable";

  return (
    <ServiceCard
      title="Site Health"
      icon={Activity}
      status={isDown ? "error" : isOk ? "ok" : "warning"}
      badge={isDown ? "Unreachable" : isOk ? "Healthy" : "Degraded"}
    >
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {stats.responseTime >= 0 && <span>{stats.responseTime}ms response</span>}
        <span>DB: {stats.database}</span>
      </div>
    </ServiceCard>
  );
}

function AnalyticsCard({ stats }: { stats: AnalyticsStats | null }) {
  if (!stats || !stats.configured) {
    return (
      <ServiceCard title="Google Analytics" icon={BarChart3} status="unconfigured">
        <NotConfigured service="GA_PROPERTY_ID" />
      </ServiceCard>
    );
  }

  return (
    <ServiceCard title="Google Analytics" icon={BarChart3} status="ok">
      <a
        href={`https://analytics.google.com/analytics/web/#/p${stats.propertyId}/reports/reportinghub`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Open Analytics Dashboard
        <ExternalLink className="h-3 w-3" />
      </a>
    </ServiceCard>
  );
}

type ServiceCardProps = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "ok" | "warning" | "error" | "unconfigured";
  badge?: string;
  children: React.ReactNode;
};

function ServiceCard({ title, icon: Icon, status, badge, children }: ServiceCardProps) {
  const StatusIcon =
    status === "ok"
      ? CheckCircle2
      : status === "warning"
        ? AlertTriangle
        : status === "error"
          ? XCircle
          : Settings2;

  const statusColor =
    status === "ok"
      ? "text-green-600 dark:text-green-400"
      : status === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : status === "error"
          ? "text-destructive"
          : "text-muted-foreground";

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span
              className={cn(
                "text-xs font-medium",
                status === "ok" && "text-green-600 dark:text-green-400",
                status === "warning" && "text-amber-600 dark:text-amber-400",
                status === "error" && "text-destructive"
              )}
            >
              {badge}
            </span>
          )}
          <StatusIcon className={cn("h-3.5 w-3.5", statusColor)} />
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ExternalServices() {
  const { data, isLoading } = useDashboardExternal();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">External Services</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">External Services</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SiteHealthCard stats={data?.siteHealth ?? null} />
        <SentryCard stats={data?.sentry ?? null} />
        <AmplifyCard stats={data?.amplify ?? null} />
        <AnalyticsCard stats={data?.analytics ?? null} />
      </div>
    </div>
  );
}
