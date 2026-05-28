import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { entityConfigs, flattenForCsv, generateCsv } from "@/lib/import-export";
import { getExportFilename, stripInternalFields } from "@/lib/import-export/validation-helpers";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const config = entityConfigs.messages;

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const rl = await rateLimit(getClientIp(request), 30, 60_000);
  if (!rl.success) {
    throw new ApiError("Rate limit exceeded", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") {
    throw new ApiError("Invalid format. Use 'json' or 'csv'.", 400, ErrorCodes.VALIDATION_ERROR);
  }

  const rows = await prisma.contactMessage.findMany({ orderBy: config.orderBy });
  const stripped = rows.map((row) =>
    stripInternalFields(row as unknown as Record<string, unknown>)
  );
  const filename = getExportFilename("messages", format);

  if (format === "csv") {
    const flat = flattenForCsv(stripped, config);
    const csv = generateCsv(flat);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  return new Response(JSON.stringify(stripped, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
