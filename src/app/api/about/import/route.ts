import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { entityConfigs } from "@/lib/import-export";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const config = entityConfigs.about;

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const rl = await rateLimit(getClientIp(request), 10, 60_000);
  if (!rl.success) {
    throw new ApiError("Rate limit exceeded", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const body = await request.json();
  const parsed = config.importSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const existing = await prisma.aboutPage.findFirst();
  const id = existing?.id ?? "default";

  await prisma.aboutPage.upsert({
    where: { id },
    create: { id, ...(parsed.data as Record<string, unknown>) } as never,
    update: parsed.data as never,
  });

  for (const p of config.revalidatePaths) {
    revalidatePath(p);
  }

  return Response.json({ data: { created: 0, updated: 1, skipped: 0 } });
});
