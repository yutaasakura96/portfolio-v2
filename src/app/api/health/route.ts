import { withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prisma-client";
import { NextRequest } from "next/server";

/**
 * Health check.
 *
 * Defaults to a **liveness** check with no database access. The DB probe is
 * opt-in via `?deep=1` because this route is uncached (`no-store` on all
 * `/api/*`), so an unconditional `SELECT 1` here means any caller — an uptime
 * monitor, or the admin dashboard's own site-health card — wakes the Neon
 * compute on every poll. Neon only scales to zero after 5 idle minutes, so a
 * frequent shallow ping was enough to keep it awake indefinitely.
 *
 * - `GET /api/health`        → `{ status: "ok", database: "skipped" }`, 200
 * - `GET /api/health?deep=1` → runs `SELECT 1`; 200 when connected, 503 when not
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const deep = request.nextUrl.searchParams.get("deep") === "1";

  if (!deep) {
    return Response.json({
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "skipped",
      },
    });
  }

  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    // DB unreachable — report degraded
  }

  const status = database === "connected" ? "ok" : "degraded";
  const statusCode = status === "ok" ? 200 : 503;

  return Response.json(
    {
      data: {
        status,
        timestamp: new Date().toISOString(),
        database,
      },
    },
    { status: statusCode }
  );
});
