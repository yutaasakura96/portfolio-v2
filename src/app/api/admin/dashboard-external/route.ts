import { requireAuthOrApiKey } from "@/app/api/auth";
import { withErrorHandler } from "@/lib/errors";
import type { JobSummary } from "@aws-sdk/client-amplify";
import { NextRequest } from "next/server";

type SentryIssue = {
  id: string;
  title: string;
  level: string;
  count: string;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
};

type SentryStats = {
  configured: boolean;
  unresolved: number;
  issues: SentryIssue[];
};

type AmplifyBuild = {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  branchName: string;
  commitMessage: string;
};

type AmplifyStats = {
  configured: boolean;
  lastBuild: AmplifyBuild | null;
  recentBuilds: AmplifyBuild[];
};

type SiteHealthStats = {
  status: "ok" | "degraded" | "unreachable";
  responseTime: number;
  database: string;
};

type AnalyticsStats = {
  configured: boolean;
  propertyId: string | null;
};

type ExternalStats = {
  sentry: SentryStats | null;
  amplify: AmplifyStats | null;
  siteHealth: SiteHealthStats | null;
  analytics: AnalyticsStats | null;
};

async function fetchSentryStats(): Promise<SentryStats | null> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG_SLUG;
  const project = process.env.SENTRY_PROJECT_SLUG;

  if (!token || !org || !project) {
    return { configured: false, unresolved: 0, issues: [] };
  }

  try {
    const res = await fetch(
      `https://sentry.io/api/0/projects/${org}/${project}/issues/?query=is:unresolved&sort=date&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      console.error(`Sentry API error: ${res.status}`);
      return { configured: true, unresolved: 0, issues: [] };
    }

    const issues: SentryIssue[] = await res.json();
    const totalHeader = res.headers.get("X-Hits");
    const unresolved = totalHeader ? parseInt(totalHeader, 10) : issues.length;

    return {
      configured: true,
      unresolved,
      issues: issues.map((i) => ({
        id: i.id,
        title: i.title,
        level: i.level,
        count: i.count,
        firstSeen: i.firstSeen,
        lastSeen: i.lastSeen,
        permalink: i.permalink,
      })),
    };
  } catch (e) {
    console.error("Failed to fetch Sentry stats:", e);
    return null;
  }
}

async function fetchAmplifyStats(): Promise<AmplifyStats | null> {
  const appId = process.env.AMPLIFY_APP_ID;
  const region = process.env.APP_AWS_REGION;
  const accessKey = process.env.APP_AWS_ACCESS_KEY_ID;
  const secretKey = process.env.APP_AWS_SECRET_ACCESS_KEY;

  if (!appId || !region || !accessKey || !secretKey) {
    return { configured: false, lastBuild: null, recentBuilds: [] };
  }

  try {
    const { AmplifyClient, ListJobsCommand } = await import("@aws-sdk/client-amplify");
    const client = new AmplifyClient({
      region,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const result = await client.send(
      new ListJobsCommand({ appId, branchName: "main", maxResults: 5 })
    );

    const builds: AmplifyBuild[] =
      result.jobSummaries?.map((j: JobSummary) => ({
        id: j.jobId ?? "",
        status: j.status ?? "UNKNOWN",
        startTime: j.startTime?.toISOString() ?? "",
        endTime: j.endTime?.toISOString() ?? null,
        branchName: "main",
        commitMessage: j.commitMessage ?? "",
      })) ?? [];

    return {
      configured: true,
      lastBuild: builds[0] ?? null,
      recentBuilds: builds,
    };
  } catch (e) {
    console.error("Failed to fetch Amplify stats:", e);
    return null;
  }
}

async function fetchSiteHealth(): Promise<SiteHealthStats | null> {
  try {
    const start = Date.now();
    const res = await fetch("https://asakurayuta.dev/api/health", {
      signal: AbortSignal.timeout(10000),
    });
    const responseTime = Date.now() - start;

    if (!res.ok) {
      return { status: "degraded", responseTime, database: "unknown" };
    }

    const body = await res.json();
    return {
      status: body.data?.status ?? "ok",
      responseTime,
      database: body.data?.database ?? "unknown",
    };
  } catch {
    return { status: "unreachable", responseTime: -1, database: "unknown" };
  }
}

function getAnalyticsConfig(): AnalyticsStats {
  const propertyId = process.env.GA_PROPERTY_ID ?? null;
  return { configured: propertyId !== null, propertyId };
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

  const [sentry, amplify, siteHealth] = await Promise.all([
    fetchSentryStats(),
    fetchAmplifyStats(),
    fetchSiteHealth(),
  ]);

  const analytics = getAnalyticsConfig();

  const data: ExternalStats = { sentry, amplify, siteHealth, analytics };

  return Response.json({ data });
});
