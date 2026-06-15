import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withErrorHandler, ApiError, ErrorCodes } from "@/lib/errors";
import { requireAuth, requireAuthOrApiKey } from "@/app/api/auth";
import { messageUpdateSchema } from "@/lib/validations/message";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  await requireAuthOrApiKey(request);

  const { id } = await context.params;

  const message = await prisma.contactMessage.findUnique({ where: { id } });

  if (!message) {
    throw new ApiError("Message not found", 404, ErrorCodes.NOT_FOUND);
  }

  // Auto-mark as read when viewed
  if (!message.read) {
    await prisma.contactMessage.update({
      where: { id },
      data: { read: true },
    });
  }

  return Response.json({ data: { ...message, read: true } });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  await requireAuthOrApiKey(request);

  const { id } = await context.params;

  const body = await request.json();
  const parsed = messageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten().fieldErrors
    );
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Message not found", 404, ErrorCodes.NOT_FOUND);
  }

  const updated = await prisma.contactMessage.update({
    where: { id },
    data: parsed.data,
  });

  return Response.json({ data: updated });
});

export const DELETE = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  await requireAuth();

  const { id } = await context.params;

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Message not found", 404, ErrorCodes.NOT_FOUND);
  }

  await prisma.contactMessage.delete({ where: { id } });

  return new Response(null, { status: 204 });
});
