import { requireAuth } from "@/app/api/auth";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import { deleteS3Folder } from "@/lib/aws/s3";
import { prisma } from "@/lib/prismaClient";
import { blogPostUpdateSchema } from "@/lib/validations/blog";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

// GET /api/blog/[id] — get single post (includes content)
export const GET = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;

    const post = await prisma.blogPost.findUnique({ where: { id } });

    if (!post) {
      throw new ApiError("Post not found", 404, ErrorCodes.NOT_FOUND);
    }

    // Draft posts require auth
    if (post.status === "DRAFT") {
      await requireAuth();
    }

    return Response.json({ data: post });
  }
);

// PUT /api/blog/[id] — update post
export const PUT = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;
    await requireAuth();

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("Post not found", 404, ErrorCodes.NOT_FOUND);
    }

    const body = await request.json();
    const parsed = blogPostUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(
        "Validation failed",
        400,
        ErrorCodes.VALIDATION_ERROR,
        parsed.error.flatten()
      );
    }

    const data = parsed.data;

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== existing.slug) {
      const slugTaken = await prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });
      if (slugTaken) {
        throw new ApiError("A post with this slug already exists", 409, ErrorCodes.CONFLICT);
      }
    }

    // Recalculate read time if content changed
    let readTime = existing.readTime;
    if (data.content) {
      const wordCount = data.content.split(/\s+/).filter(Boolean).length;
      readTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Handle publish: set publishedAt on first publish; preserve on unpublish
    let publishedAt = existing.publishedAt;
    if (data.status === "PUBLISHED" && !existing.publishedAt) {
      publishedAt = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        readTime,
        publishedAt,
      },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${existing.slug}`);
    if (data.slug && data.slug !== existing.slug) {
      revalidatePath(`/blog/${data.slug}`);
    }
    revalidatePath("/");

    return Response.json({ data: post });
  }
);

// DELETE /api/blog/[id] — delete post
export const DELETE = withErrorHandler(
  async (request: NextRequest, context?: { params: Promise<{ id: string }> }) => {
    const { id } = await context!.params;
    await requireAuth();

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) {
      throw new ApiError("Post not found", 404, ErrorCodes.NOT_FOUND);
    }

    // Delete associated images from S3
    await deleteS3Folder(`blog/${id}/`);

    await prisma.blogPost.delete({ where: { id } });

    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/");

    return new Response(null, { status: 204 });
  }
);
