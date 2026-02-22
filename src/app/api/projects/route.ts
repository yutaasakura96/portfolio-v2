import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { Prisma, ProjectStatus, prisma } from "@/lib/prismaClient";
import { projectCreateSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "PUBLISHED";
  const featured = searchParams.get("featured");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  if (status === "all" || status === "DRAFT") {
    await requireAuth();
  }

  const where: Prisma.ProjectWhereInput = {};

  if (status !== "all") {
    where.status = status as ProjectStatus;
  }

  if (featured === "true") {
    where.featured = true;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
      { techTags: { hasSome: [search] } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { displayOrder: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return Response.json({
    data: projects,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth();

  const body = await request.json();
  const parsed = projectCreateSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(
      "Validation error",
      400,
      ErrorCodes.VALIDATION_ERROR,
      parsed.error.flatten()
    );
  }

  const existing = await prisma.project.findUnique({
    where: { slug: parsed.data.slug },
  });

  if (existing) {
    throw new ApiError("A project with this slug already exists", 409, ErrorCodes.CONFLICT);
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      thumbnailImage: parsed.data.thumbnailImage || "",
    },
  });

  revalidatePath("/projects");
  if (project.featured) {
    revalidatePath("/");
  }

  return Response.json({ data: project }, { status: 201 });
});
