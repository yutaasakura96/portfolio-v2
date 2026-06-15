import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prisma-client";
import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { NextRequest } from "next/server";
import { z } from "zod";

const apiKeyCreateSchema = z.object({
  description: z.string().min(1, "Description required").max(200),
});

export const GET = withErrorHandler(async () => {
  await requireAuth();

  const keys = await prisma.apiKey.findMany({
    select: { id: true, description: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: keys });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = apiKeyCreateSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const rawKey = nanoid(32);
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: { keyHash, description: parsed.data.description },
  });

  return Response.json(
    {
      data: {
        id: apiKey.id,
        description: apiKey.description,
        createdAt: apiKey.createdAt,
        key: rawKey,
      },
      meta: { warning: "Store this key securely. It will not be shown again." },
    },
    { status: 201 }
  );
});
