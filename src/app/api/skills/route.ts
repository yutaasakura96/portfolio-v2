import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma, Prisma } from "@/lib/prismaClient";
import { skillCreateSchema } from "@/lib/validations/skill";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const visible = searchParams.get("visible") ?? "true";
  const grouped = searchParams.get("grouped") === "true";

  const where: Prisma.SkillWhereInput = {};

  if (visible === "all") {
    await requireAuth();
  } else if (visible === "true") {
    where.visible = true;
  } else {
    where.visible = false;
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });

  if (grouped) {
    const groupedData: Record<string, typeof skills> = {};
    for (const skill of skills) {
      if (!groupedData[skill.category]) {
        groupedData[skill.category] = [];
      }
      groupedData[skill.category].push(skill);
    }
    return Response.json({ data: groupedData, meta: { total: skills.length } });
  }

  return Response.json({ data: skills, meta: { total: skills.length } });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = skillCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const skill = await prisma.skill.create({ data: parsed.data });

  revalidatePath("/about");

  return Response.json({ data: skill }, { status: 201 });
});
