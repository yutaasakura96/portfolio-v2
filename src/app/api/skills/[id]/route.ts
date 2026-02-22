import { NextRequest } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { requireAuth } from "@/app/api/auth";
import { withErrorHandler, ApiError, ErrorCodes } from "@/lib/errors";
import { skillUpdateSchema } from "@/lib/validations/skill";
import { revalidatePath } from "next/cache";

export const PUT = withErrorHandler(
  async (
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
  ) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Skill not found", 404, ErrorCodes.NOT_FOUND);
    }

    const body = await request.json();
    const parsed = skillUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "Validation error",
        400,
        ErrorCodes.VALIDATION_ERROR,
        parsed.error.flatten()
      );
    }

    const skill = await prisma.skill.update({ where: { id }, data: parsed.data });

    revalidatePath("/about");

    return Response.json({ data: skill });
  }
);

export const DELETE = withErrorHandler(
  async (
    request: NextRequest,
    context?: { params: Promise<{ id: string }> }
  ) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Skill not found", 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.skill.delete({ where: { id } });

    revalidatePath("/about");

    return new Response(null, { status: 204 });
  }
);
