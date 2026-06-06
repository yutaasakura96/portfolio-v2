import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { requireAuthOrApiKey } from "@/app/api/auth";
import { withErrorHandler, ApiError, ErrorCodes } from "@/lib/errors";
import { reorderSchema } from "@/lib/validations/shared";
import { revalidatePath } from "next/cache";

export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

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
    prisma.project.update({
      where: { id },
      data: { displayOrder: index },
    })
  );

  await prisma.$transaction(updates);

  revalidatePath("/projects");
  revalidatePath("/");

  return Response.json({
    data: { count: parsed.data.orderedIds.length },
  });
});
