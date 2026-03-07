import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";

export const GET = withErrorHandler(async () => {
  const hero = await prisma.hero.findFirst();

  if (!hero?.resumeUrl) {
    throw new ApiError("No resume found", 404, ErrorCodes.NOT_FOUND);
  }

  const response = await fetch(hero.resumeUrl);

  if (!response.ok) {
    throw new ApiError("Failed to fetch resume", 502, ErrorCodes.INTERNAL_ERROR);
  }

  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
});
