import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { aboutPageUpdateSchema } from "@/lib/validations/about";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const DEFAULTS = {
  heading: "About Me",
  subheading: "My skills, professional experience, education, and certifications.",
};

export const GET = withErrorHandler(async () => {
  const aboutPage = await prisma.aboutPage.findUnique({ where: { id: "default" } });
  return Response.json({ data: aboutPage ?? { ...DEFAULTS, id: "default" } });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = aboutPageUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const aboutPage = await prisma.aboutPage.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/about");

  return Response.json({ data: aboutPage });
});
