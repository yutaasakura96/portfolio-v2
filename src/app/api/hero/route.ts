import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";
import { heroUpdateSchema } from "@/lib/validations/hero";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async () => {
  const hero = await prisma.hero.findFirst();

  if (!hero) {
    throw new ApiError("Hero not found", 404, ErrorCodes.NOT_FOUND);
  }

  return Response.json({ data: hero });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = heroUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const existingHero = await prisma.hero.findFirst();

  const hero = await prisma.hero.upsert({
    where: { id: existingHero?.id ?? "default" },
    update: {
      headline: parsed.data.headline,
      subheadline: parsed.data.subheadline,
      bio: parsed.data.bio,
      profileImage: parsed.data.profileImage,
      resumeUrl: parsed.data.resumeUrl,
      ctaButtons: parsed.data.ctaButtons ?? Prisma.JsonNull,
    },
    create: {
      headline: parsed.data.headline,
      subheadline: parsed.data.subheadline,
      bio: parsed.data.bio,
      profileImage: parsed.data.profileImage ?? "",
      resumeUrl: parsed.data.resumeUrl,
      ctaButtons: parsed.data.ctaButtons ?? Prisma.JsonNull,
    },
  });

  revalidatePath("/");

  return Response.json({ data: hero });
});
