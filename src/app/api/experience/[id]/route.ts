import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { experienceUpdateSchema } from "@/lib/validations/experience";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const PUT = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.experience.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Experience not found", 404, ErrorCodes.NOT_FOUND);
    }

    const body = await request.json();
    const parsed = experienceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "Validation error",
        400,
        ErrorCodes.VALIDATION_ERROR,
        parsed.error.flatten()
      );
    }

    const experience = await prisma.experience.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/about");

    return Response.json({ data: experience });
  }
);

export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.experience.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Experience not found", 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.experience.delete({ where: { id } });

    revalidatePath("/about");

    return new Response(null, { status: 204 });
  }
);
