import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { reorderSchema } from "@/lib/validations/shared";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = reorderSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const updates = parsed.data.orderedIds.map((id, index) =>
    prisma.skill.update({ where: { id }, data: { displayOrder: index } })
  );

  await prisma.$transaction(updates);

  revalidatePath("/about");

  return Response.json({
    data: { success: true, count: parsed.data.orderedIds.length },
  });
});
