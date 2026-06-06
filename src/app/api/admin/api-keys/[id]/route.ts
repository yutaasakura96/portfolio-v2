import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { NextRequest } from "next/server";

export const DELETE = withErrorHandler(
  async (_request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();

    const { id } = await context!.params;

    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("API key not found", 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.apiKey.delete({ where: { id } });
    return new Response(null, { status: 204 });
  }
);
