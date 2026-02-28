import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { blogPostCreateSchema } from "@/lib/validations/blog";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

// GET /api/blog — list posts
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "PUBLISHED";
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10"), 50);

  // Require auth to view all statuses (including drafts)
  if (status === "all") {
    await requireAuth();
  }

  const where: Record<string, unknown> = {};
  if (status !== "all") {
    where.status = status;
  }
  if (tag) {
    where.tags = { has: tag };
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  let orderBy: Record<string, string>;
  switch (sort) {
    case "oldest":
      orderBy = { publishedAt: "asc" };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "newest":
    default:
      orderBy = { publishedAt: "desc" };
      break;
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        tags: true,
        readTime: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        // content excluded from list to keep payloads small
      },
    }),
    prisma.blogPost.count({ where }),
  ]);

  return Response.json({
    data: posts,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

// POST /api/blog — create post
export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = blogPostCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation failed",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({
    where: { slug: data.slug },
  });
  if (existing) {
    throw new ApiError("A post with this slug already exists", 409, ErrorCodes.CONFLICT);
  }

  const wordCount = data.content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const publishedAt =
    data.status === "PUBLISHED" && !data.publishedAt ? new Date() : data.publishedAt || null;

  const post = await prisma.blogPost.create({
    data: {
      ...data,
      readTime,
      publishedAt,
    },
  });

  revalidatePath("/blog");
  if (post.status === "PUBLISHED") {
    revalidatePath("/");
  }

  return Response.json({ data: post }, { status: 201 });
});
