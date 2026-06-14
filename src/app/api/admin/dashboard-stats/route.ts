import { requireAuthOrApiKey } from "@/app/api/auth";
import { withErrorHandler } from "@/lib/errors";
import { Prisma, prisma } from "@/lib/prismaClient";
import { NextRequest } from "next/server";

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

async function getTranslationStats(): Promise<{
  hero: boolean;
  about: boolean;
  settings: boolean;
  projects: number;
  blogPosts: number;
  experience: number;
  education: number;
  lastUpdated: string | null;
}> {
  const [
    translatedProjects,
    translatedPosts,
    translatedExperience,
    translatedEducation,
    heroJa,
    aboutJa,
    settingsJa,
    latestProject,
    latestPost,
  ] = await Promise.all([
    prisma.project.count({ where: { status: "PUBLISHED", titleJa: { not: null } } }),
    prisma.blogPost.count({ where: { status: "PUBLISHED", titleJa: { not: null } } }),
    prisma.experience.count({ where: { roleJa: { not: null } } }),
    prisma.education.count({ where: { degreeJa: { not: null } } }),
    prisma.hero.findFirst({ where: { headlineJa: { not: null } }, select: { updatedAt: true } }),
    prisma.aboutPage.findFirst({
      where: { headingJa: { not: null } },
      select: { updatedAt: true },
    }),
    prisma.siteSettings.findFirst({
      where: { siteDescriptionJa: { not: null } },
      select: { updatedAt: true },
    }),
    prisma.project.findFirst({
      where: { titleJa: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
    prisma.blogPost.findFirst({
      where: { titleJa: { not: null } },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    }),
  ]);

  const dates = [heroJa, aboutJa, settingsJa, latestProject, latestPost]
    .filter((r): r is { updatedAt: Date } => r !== null)
    .map((r) => r.updatedAt);

  const lastUpdated =
    dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString() : null;

  return {
    hero: heroJa !== null,
    about: aboutJa !== null,
    settings: settingsJa !== null,
    projects: translatedProjects,
    blogPosts: translatedPosts,
    experience: translatedExperience,
    education: translatedEducation,
    lastUpdated,
  };
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  await requireAuthOrApiKey(request);

  const [
    projectsByStatus,
    postsByStatus,
    messageCounts,
    recentProjects,
    recentPosts,
    recentMessages,
    skillCount,
    experienceCount,
    educationCount,
    certificationCount,
    expiringCertifications,
    lastPublishedPost,
    heroCount,
    aboutCount,
    translationStats,
  ] = await Promise.all([
    prisma.project.groupBy({ by: ["status"], _count: true }),
    prisma.blogPost.groupBy({ by: ["status"], _count: true }),
    prisma.contactMessage.groupBy({ by: ["read", "archived"], _count: true }),
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
    getTranslationStats(),
  ]);

  const publishedProjectCount = projectsByStatus.find((g) => g.status === "PUBLISHED")?._count ?? 0;
  const draftProjectCount = projectsByStatus.find((g) => g.status === "DRAFT")?._count ?? 0;
  const projectCount = projectsByStatus.reduce((sum, g) => sum + g._count, 0);

  const publishedPostCount = postsByStatus.find((g) => g.status === "PUBLISHED")?._count ?? 0;
  const draftPostCount = postsByStatus.find((g) => g.status === "DRAFT")?._count ?? 0;
  const postCount = postsByStatus.reduce((sum, g) => sum + g._count, 0);

  const totalMessageCount = messageCounts.reduce((sum, g) => sum + g._count, 0);
  const archivedMessageCount = messageCounts
    .filter((g) => g.archived)
    .reduce((sum, g) => sum + g._count, 0);
  const messageCount = messageCounts.filter((g) => !g.read).reduce((sum, g) => sum + g._count, 0);

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
      translationStats,
    },
  });
});
