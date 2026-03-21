import { withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";

export const GET = withErrorHandler(async () => {
  const categories = await prisma.skillCategory.findMany({
    orderBy: { displayOrder: "asc" },
  });
  return Response.json({ data: categories, meta: { total: categories.length } });
});
