import { requireAuth } from "@/app/api/auth";
import { withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";

const recentItemSelect = {
  id: true,
  title: true,
  status: true,
  updatedAt: true,
} as const;

const recentMessageSelect = {
  id: true,
  name: true,
  subject: true,
  createdAt: true,
} as const;

const expiringCertSelect = {
  id: true,
  name: true,
  issuer: true,
  expirationDate: true,
} as const;

const unreadMessagesWhere: Prisma.ContactMessageWhereInput = { read: false };

const ninetyDaysFromNow = (): Date => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

export const GET = withErrorHandler(async () => {
  await requireAuth();

  const [
    projectCount,
    postCount,
    messageCount,
    recentProjects,
    recentPosts,
    publishedProjectCount,
    draftProjectCount,
    publishedPostCount,
    draftPostCount,
    totalMessageCount,
    archivedMessageCount,
    recentMessages,
    skillCount,
    experienceCount,
    educationCount,
    certificationCount,
    expiringCertifications,
    lastPublishedPost,
    heroCount,
    aboutCount,
  ] = await Promise.all([
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
    prisma.project.count({ where: { status: "PUBLISHED" } }),
    prisma.project.count({ where: { status: "DRAFT" } }),
    prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "DRAFT" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { archived: true } }),
    prisma.contactMessage.findMany({
      where: unreadMessagesWhere,
      orderBy: { createdAt: "desc" },
      take: 3,
      select: recentMessageSelect,
    }),
    prisma.skill.count(),
    prisma.experience.count(),
    prisma.education.count(),
    prisma.certification.count(),
    prisma.certification.findMany({
      where: {
        expirationDate: { not: null, lte: ninetyDaysFromNow() },
      },
      select: expiringCertSelect,
    }),
    prisma.blogPost.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, title: true },
    }),
    prisma.hero.count(),
    prisma.aboutPage.count(),
  ]);

  return Response.json({
    data: {
      projectCount,
      postCount,
      messageCount,
      recentProjects,
      recentPosts,
      publishedProjectCount,
      draftProjectCount,
      publishedPostCount,
      draftPostCount,
      totalMessageCount,
      archivedMessageCount,
      recentMessages,
      skillCount,
      experienceCount,
      educationCount,
      certificationCount,
      expiringCertifications,
      lastPublishedPost,
      hasHero: heroCount > 0,
      hasAbout: aboutCount > 0,
    },
  });
});
