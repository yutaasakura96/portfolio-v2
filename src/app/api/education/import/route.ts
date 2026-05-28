import { z } from "zod";

import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { entityConfigs } from "@/lib/import-export";
import { lookupUniqueKey } from "@/lib/import-export/validation-helpers";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const config = entityConfigs.education;

const importBodySchema = z.object({
  items: z.array(config.importSchema).min(1).max(500),
  mode: z.enum(["create", "upsert"]),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const rl = await rateLimit(getClientIp(request), 10, 60_000);
  if (!rl.success) {
    throw new ApiError("Rate limit exceeded", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const contentLength = parseInt(request.headers.get("content-length") ?? "0");
  if (contentLength > 5 * 1024 * 1024) {
    throw new ApiError("Request body too large. Max 5MB.", 400, ErrorCodes.VALIDATION_ERROR);
  }

  const body = await request.json();
  const parsed = importBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const { items, mode } = parsed.data;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const where = lookupUniqueKey(config, item as Record<string, unknown>);
      const existing = where ? await tx.education.findFirst({ where }) : null;

      if (existing) {
        if (mode === "create") {
          skipped++;
        } else {
          await tx.education.update({ where: { id: existing.id }, data: item as never });
          updated++;
        }
      } else {
        await tx.education.create({ data: item as never });
        created++;
      }
    }
  });

  for (const p of config.revalidatePaths) {
    revalidatePath(p);
  }

  return Response.json({ data: { created, updated, skipped } });
});
