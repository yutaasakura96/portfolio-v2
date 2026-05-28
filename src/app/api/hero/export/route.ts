import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { getExportFilename, stripInternalFields } from "@/lib/import-export/validation-helpers";
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
    throw new ApiError("Hero export only supports JSON format.", 400, ErrorCodes.VALIDATION_ERROR);
  }

  const hero = await prisma.hero.findFirst();
  if (!hero) {
    throw new ApiError("No hero data found.", 404, ErrorCodes.NOT_FOUND);
  }

  const stripped = stripInternalFields(hero as unknown as Record<string, unknown>);
  const filename = getExportFilename("hero", "json");

  return new Response(JSON.stringify(stripped, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
});
