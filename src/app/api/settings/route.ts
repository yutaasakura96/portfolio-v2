import { requireAuthOrApiKey } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { siteSettingsUpdateSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";
import { Prisma } from "../../../../generated/prisma/client";

// GET /api/settings — Public (used for site metadata)
export const GET = withErrorHandler(async () => {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return Response.json({
      data: {
        id: "default",
        siteName: "Portfolio",
        siteDescription: "",
        socialLinks: null,
        email: "",
        googleAnalyticsId: null,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  return Response.json({ data: settings });
});

// PUT /api/settings — Auth required
export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

  const body = await request.json();
  const parsed = siteSettingsUpdateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten().fieldErrors
    );
  }

  // Filter empty strings from socialLinks
  const socialLinks = parsed.data.socialLinks
    ? Object.fromEntries(
        Object.entries(parsed.data.socialLinks).filter(([, v]) => v && v.length > 0)
      )
    : Prisma.JsonNull;

  const settings = await prisma.siteSettings.upsert({
    where: { id: "default" },
    update: {
      ...parsed.data,
      socialLinks,
    },
    create: {
      id: "default",
      ...parsed.data,
      socialLinks,
    },
  });

  revalidatePath("/");
  revalidatePath("/contact");

  return Response.json({ data: settings });
});
