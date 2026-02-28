import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { withErrorHandler } from "@/lib/errors";
import { requireAuth } from "@/app/api/auth";
import { siteSettingsUpdateSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";

// GET /api/settings — Public (used for site metadata)
export const GET = withErrorHandler(async () => {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    return NextResponse.json({
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

  return NextResponse.json({ data: settings });
});

// PUT /api/settings — Auth required
export const PUT = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = siteSettingsUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  // Filter empty strings from socialLinks
  const socialLinks = parsed.data.socialLinks
    ? Object.fromEntries(
        Object.entries(parsed.data.socialLinks).filter(
          ([, v]) => v && v.length > 0
        )
      )
    : null;

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

  return NextResponse.json({ data: settings });
});
