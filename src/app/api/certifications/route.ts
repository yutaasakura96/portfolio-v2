import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";
import { certificationCreateSchema } from "@/lib/validations/certification";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const visible = searchParams.get("visible") ?? "true";

  const where: Prisma.CertificationWhereInput = {};

  if (visible === "all") {
    await requireAuth();
  } else if (visible === "true") {
    where.visible = true;
  } else {
    where.visible = false;
  }

  const certifications = await prisma.certification.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({
    data: certifications,
    meta: { total: certifications.length },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = certificationCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const certification = await prisma.certification.create({ data: parsed.data });

  revalidatePath("/about");

  return Response.json({ data: certification }, { status: 201 });
});
