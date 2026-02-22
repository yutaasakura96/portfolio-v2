import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";
import { educationCreateSchema } from "@/lib/validations/education";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const visible = searchParams.get("visible") ?? "true";

  const where: Prisma.EducationWhereInput = {};

  if (visible === "all") {
    await requireAuth();
  } else if (visible === "true") {
    where.visible = true;
  } else {
    where.visible = false;
  }

  const education = await prisma.education.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });

  return Response.json({ data: education, meta: { total: education.length } });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = educationCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const education = await prisma.education.create({ data: parsed.data });

  revalidatePath("/about");

  return Response.json({ data: education }, { status: 201 });
});
