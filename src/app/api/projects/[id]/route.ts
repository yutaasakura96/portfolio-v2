import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { prisma } from "@/lib/prismaClient";
import { projectUpdateSchema } from "@/lib/validations/project";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export const GET = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new ApiError("Project not found", 404, ErrorCodes.NOT_FOUND);
    }

    if (project.status === "DRAFT") {
      await requireAuth();
    }

    return Response.json({ data: project });
  }
);

export const PUT = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Project not found", 404, ErrorCodes.NOT_FOUND);
    }

    const body = await request.json();
    const parsed = projectUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "Validation error",
        400,
        ErrorCodes.VALIDATION_ERROR,
        parsed.error.flatten()
      );
    }

    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugConflict = await prisma.project.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugConflict) {
        throw new ApiError("A project with this slug already exists", 409, ErrorCodes.CONFLICT);
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${project.slug}`);
    if (project.featured || existing.featured) {
      revalidatePath("/");
    }

    return Response.json({ data: project });
  }
);

export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    await requireAuth();
    const { id } = await context!.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Project not found", 404, ErrorCodes.NOT_FOUND);
    }

    await prisma.project.delete({ where: { id } });

    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    if (existing.featured) {
      revalidatePath("/");
    }

    return new Response(null, { status: 204 });
  }
);
