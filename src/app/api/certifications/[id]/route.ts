import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { certificationUpdateSchema } from "@/lib/validations/certification";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const PUT = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.certification.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Certification not found", 404, ErrorCodes.NOT_FOUND);
    }

    const body = await request.json();
    const parsed = certificationUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "Validation error",
        400,
        ErrorCodes.VALIDATION_ERROR,
        parsed.error.flatten()
      );
    }

    const certification = await prisma.certification.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/about");

    return Response.json({ data: certification });
  }
);

export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.certification.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Certification not found", 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.certification.delete({ where: { id } });

    revalidatePath("/about");

    return new Response(null, { status: 204 });
  }
);
