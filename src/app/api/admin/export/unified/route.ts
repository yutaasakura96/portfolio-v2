import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { entityConfigs } from "@/lib/import-export";
import { IMPORT_ORDER } from "@/lib/import-export/unified-import";
import {
  stripInternalFields,
  stripInternalFieldsFromArray,
} from "@/lib/import-export/validation-helpers";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const rl = await rateLimit(getClientIp(request), 30, 60_000);
  if (!rl.success) {
    throw new ApiError("Rate limit exceeded", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  if (format !== "json") {
    throw new ApiError(
      "Unified export only supports JSON format.",
      400,
      ErrorCodes.VALIDATION_ERROR
    );
  }

  const result: Record<string, unknown> = {};

  for (const key of IMPORT_ORDER) {
    const config = entityConfigs[key];
    if (!config || config.importDisabled) continue;

    const model = (prisma as never)[config.prismaModel] as {
      findMany: (args: { orderBy: Record<string, string> }) => Promise<Record<string, unknown>[]>;
      findFirst: () => Promise<Record<string, unknown> | null>;
    };

    if (config.isSingleton) {
      const row = await model.findFirst();
      if (row) {
        result[key] = stripInternalFields(row);
      }
    } else {
      const rows = await model.findMany({ orderBy: config.orderBy });
      result[key] = stripInternalFieldsFromArray(rows);
    }
  }

  const date = new Date().toISOString().split("T")[0];
  const filename = `all-entities-${date}.json`;

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
