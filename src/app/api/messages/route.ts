import { NextRequest } from "next/server";
import { Prisma, prisma } from "@/lib/prisma-client";
import { withErrorHandler } from "@/lib/errors";
import { requireAuthOrApiKey } from "@/app/api/auth";

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

  const { searchParams } = new URL(request.url);

  const readParam = searchParams.get("read") ?? "all";
  const archivedParam = searchParams.get("archived") ?? "false";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));

  // Build where clause
  const where: Prisma.ContactMessageWhereInput = {};

  if (archivedParam === "true") {
    where.archived = true;
  } else {
    where.archived = false;
  }

  if (readParam === "true") {
    where.read = true;
  } else if (readParam === "false") {
    where.read = false;
  }
  // "all" — no read filter applied

  const orderBy = { createdAt: sort === "oldest" ? "asc" : "desc" } as const;
  const skip = (page - 1) * limit;

  const [messages, total, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({
      where: { read: false, archived: false },
    }),
  ]);

  return Response.json({
    data: messages,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  });
});
