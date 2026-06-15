import { withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prisma-client";

export const GET = withErrorHandler(async () => {
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
