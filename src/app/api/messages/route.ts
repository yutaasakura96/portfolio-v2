import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prismaClient";
import { withErrorHandler } from "@/lib/errors";
import { requireAuth } from "@/app/api/auth";

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const { searchParams } = new URL(request.url);

  const readParam = searchParams.get("read") ?? "all";
  const archivedParam = searchParams.get("archived") ?? "false";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  // Build where clause
  const where: Record<string, unknown> = {};

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
  const skip = (page - 1) * pageSize;

  const [messages, total, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({
      where: { read: false, archived: false },
    }),
  ]);

  return NextResponse.json({
    data: messages,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount,
    },
  });
});
