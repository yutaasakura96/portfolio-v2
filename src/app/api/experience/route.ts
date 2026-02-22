import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma, Prisma } from "@/lib/prismaClient";
import { experienceCreateSchema } from "@/lib/validations/experience";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const visible = searchParams.get("visible") ?? "true";

  const where: Prisma.ExperienceWhereInput = {};

  if (visible === "all") {
    await requireAuth();
  } else if (visible === "true") {
    where.visible = true;
  } else {
    where.visible = false;
  }

  const experiences = await prisma.experience.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({ data: experiences, meta: { total: experiences.length } });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = experienceCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const experience = await prisma.experience.create({ data: parsed.data });

  revalidatePath("/about");

  return Response.json({ data: experience }, { status: 201 });
});
