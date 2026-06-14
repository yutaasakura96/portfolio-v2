import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { withErrorHandler, ApiError, ErrorCodes } from "@/lib/errors";
import { requireAuthOrApiKey } from "@/app/api/auth";
import { messageBulkUpdateSchema } from "@/lib/validations/message";

export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

  const body = await request.json();
  const parsed = messageBulkUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten().fieldErrors
    );
  }

  const { ids, update } = parsed.data;

  const result = await prisma.contactMessage.updateMany({
    where: { id: { in: ids } },
    data: update,
  });

  return Response.json({ data: { count: result.count } });
});
