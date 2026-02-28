import { requireAuth } from "@/app/api/auth";
import { deleteImageVariants, uploadToS3 } from "@/lib/aws/s3";
import { ApiError, ErrorCodes, withErrorHandler } from "@/lib/errors";
import {
  processFeaturedImage,
  processImage,
  processLogoImage,
  processProfileImage,
} from "@/lib/image-processor";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_PDF_MIME = "application/pdf";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FOLDERS = [
  "projects",
  "blog",
  "profile",
  "logos",
  "certifications",
  "resume",
] as const;

type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const deleteUploadSchema = z.object({
  key: z.string().min(1).max(500),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  // Rate limit: 20 requests per minute per IP
  const ip = getClientIp(req);
  const rateLimitResult = rateLimit(`upload:${ip}`, 20, 60 * 1000);
  if (!rateLimitResult.success) {
    throw new ApiError(
      "Rate limit exceeded. Try again later.",
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  }

  await requireAuth();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;
  const entityId = formData.get("entityId") as string | null;

  if (!file) {
    throw new ApiError("File is required", 400, "MISSING_FILE");
  }
  if (!folder || !ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
    throw new ApiError(
      `Invalid folder. Must be one of: ${ALLOWED_FOLDERS.join(", ")}`,
      400,
      "INVALID_FOLDER"
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError("File size exceeds 10MB limit", 400, "FILE_TOO_LARGE");
  }

  // Handle resume (PDF) upload separately
  if (folder === "resume") {
    if (file.type !== ALLOWED_PDF_MIME) {
      throw new ApiError("Resume must be a PDF file", 400, "INVALID_FILE_TYPE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToS3(buffer, "resume/resume_latest.pdf", "application/pdf");

    return NextResponse.json({
      data: {
        urls: { original: url },
        key: "resume/resume_latest.pdf",
      },
    });
  }

  // Validate image MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new ApiError(
      `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      400,
      "INVALID_FILE_TYPE"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = nanoid(12);

  let urls: Record<string, string>;
  let primaryKey: string;

  switch (folder as AllowedFolder) {
    case "profile": {
      const result = await processProfileImage(buffer, fileId);
      const [displayUrl, origUrl] = await Promise.all([
        uploadToS3(result.display.buffer, result.display.key, result.display.contentType),
        uploadToS3(result.original.buffer, result.original.key, result.original.contentType),
      ]);
      urls = { display: displayUrl, original: origUrl };
      primaryKey = result.display.key;
      break;
    }

    case "logos":
    case "certifications": {
      if (!entityId) {
        throw new ApiError(
          "entityId is required for logo/certification uploads",
          400,
          "MISSING_ENTITY_ID"
        );
      }
      const result = await processLogoImage(buffer, folder, entityId, fileId);
      const [displayUrl, origUrl] = await Promise.all([
        uploadToS3(result.display.buffer, result.display.key, result.display.contentType),
        uploadToS3(result.original.buffer, result.original.key, result.original.contentType),
      ]);
      urls = { display: displayUrl, original: origUrl };
      primaryKey = result.display.key;
      break;
    }

    case "blog": {
      if (!entityId) {
        throw new ApiError(
          "entityId (post ID) is required for blog uploads",
          400,
          "MISSING_ENTITY_ID"
        );
      }
      const result = await processFeaturedImage(buffer, entityId, fileId);
      const [featuredUrl, origUrl] = await Promise.all([
        uploadToS3(result.featured.buffer, result.featured.key, result.featured.contentType),
        uploadToS3(result.original.buffer, result.original.key, result.original.contentType),
      ]);
      urls = { featured: featuredUrl, original: origUrl };
      primaryKey = result.featured.key;
      break;
    }

    case "projects":
    default: {
      const result = await processImage(buffer, {
        folder,
        entityId: entityId || undefined,
        fileId,
      });
      const [thumbUrl, medUrl, lgUrl, origUrl] = await Promise.all([
        uploadToS3(result.thumbnail.buffer, result.thumbnail.key, result.thumbnail.contentType),
        uploadToS3(result.medium.buffer, result.medium.key, result.medium.contentType),
        uploadToS3(result.large.buffer, result.large.key, result.large.contentType),
        uploadToS3(result.original.buffer, result.original.key, result.original.contentType),
      ]);
      urls = {
        thumbnail: thumbUrl,
        medium: medUrl,
        large: lgUrl,
        original: origUrl,
      };
      primaryKey = result.original.key;
      break;
    }
  }

  return NextResponse.json({
    data: { urls, key: primaryKey },
  });
});

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await requireAuth();

  const body = await req.json();
  const parsed = deleteUploadSchema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError("Invalid request body", 400, ErrorCodes.VALIDATION_ERROR);
  }

  const { key } = parsed.data;

  const validPrefixes = ["projects/", "blog/", "profile/", "logos/", "certifications/", "resume/"];
  if (!validPrefixes.some((prefix) => key.startsWith(prefix))) {
    throw new ApiError("Invalid key prefix", 400, "INVALID_KEY");
  }

  await deleteImageVariants(key);

  return NextResponse.json({
    data: { success: true },
  });
});
