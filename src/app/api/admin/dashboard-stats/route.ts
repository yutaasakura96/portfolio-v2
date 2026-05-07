import { requireAuth } from "@/app/api/auth";
import { withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";

const recentItemSelect = {
  id: true,
  title: true,
  status: true,
  updatedAt: true,
} as const;

const unreadMessagesWhere: Prisma.ContactMessageWhereInput = { read: false };

export const GET = withErrorHandler(async () => {
  await requireAuth();

  const [projectCount, postCount, messageCount, recentProjects, recentPosts] = await Promise.all([
    prisma.project.count(),
    prisma.blogPost.count(),
    prisma.contactMessage.count({ where: unreadMessagesWhere }),
    prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: recentItemSelect,
    }),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: recentItemSelect,
    }),
  ]);

  return Response.json({
    data: {
      projectCount,
      postCount,
      messageCount,
      recentProjects,
      recentPosts,
    },
  });
});
