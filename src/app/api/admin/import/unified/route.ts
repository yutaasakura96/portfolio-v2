import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { entityConfigs } from "@/lib/import-export";
import { IMPORT_ORDER, unifiedImportBodySchema } from "@/lib/import-export/unified-import";
import { lookupUniqueKey } from "@/lib/import-export/validation-helpers";
import { prisma } from "@/lib/prismaClient";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

import type { ImportMode, ImportResult } from "@/lib/import-export/types";

async function importCollectionItems(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  config: (typeof entityConfigs)[string],
  items: Record<string, unknown>[],
  mode: ImportMode
): Promise<ImportResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const model = (tx as never)[config.prismaModel] as {
    findFirst: (args: { where: Record<string, unknown> }) => Promise<{ id: string } | null>;
    create: (args: { data: unknown }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
  };

  for (const item of items) {
    const where = lookupUniqueKey(config, item);
    const existing = where ? await model.findFirst({ where }) : null;

    if (existing) {
      if (mode === "create") {
        skipped++;
      } else {
        await model.update({ where: { id: existing.id }, data: item });
        updated++;
      }
    } else {
      await model.create({ data: item });
      created++;
    }
  }

  return { created, updated, skipped };
}

async function importSingletonItem(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  config: (typeof entityConfigs)[string],
  data: Record<string, unknown>
): Promise<ImportResult> {
  const model = (tx as never)[config.prismaModel] as {
    findFirst: () => Promise<{ id: string } | null>;
    upsert: (args: {
      where: { id: string };
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }) => Promise<unknown>;
  };

  const existing = await model.findFirst();
  const id = existing?.id ?? "default";

  await model.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });

  return { created: existing ? 0 : 1, updated: existing ? 1 : 0, skipped: 0 };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const rl = await rateLimit(getClientIp(request), 5, 60_000);
  if (!rl.success) {
    throw new ApiError("Rate limit exceeded", 429, ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  const contentLength = parseInt(request.headers.get("content-length") ?? "0");
  if (contentLength > 10 * 1024 * 1024) {
    throw new ApiError("Request body too large. Max 10MB.", 400, ErrorCodes.VALIDATION_ERROR);
  }

  const body = await request.json();
  const parsed = unifiedImportBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const { mode, ...entities } = parsed.data;
  const results: Record<string, ImportResult> = {};
  const allRevalidatePaths = new Set<string>();

  await prisma.$transaction(
    async (tx) => {
      for (const entityKey of IMPORT_ORDER) {
        const entityData = (entities as Record<string, unknown>)[entityKey];
        if (!entityData) continue;

        const config = entityConfigs[entityKey];

        if (config.isSingleton) {
          results[entityKey] = await importSingletonItem(
            tx,
            config,
            entityData as Record<string, unknown>
          );
        } else {
          results[entityKey] = await importCollectionItems(
            tx,
            config,
            entityData as Record<string, unknown>[],
            mode
          );
        }

        for (const p of config.revalidatePaths) {
          allRevalidatePaths.add(p);
        }
      }
    },
    { timeout: 30_000 }
  );

  for (const p of allRevalidatePaths) {
    revalidatePath(p);
  }

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  for (const r of Object.values(results)) {
    totalCreated += r.created;
    totalUpdated += r.updated;
    totalSkipped += r.skipped;
  }

  return Response.json({
    data: { results, totalCreated, totalUpdated, totalSkipped },
  });
});
