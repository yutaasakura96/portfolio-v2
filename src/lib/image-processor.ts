import sharp from "sharp";

export interface ProcessedImage {
  buffer: Buffer;
  key: string;
  contentType: string;
}

export interface ImageVariants {
  thumbnail: ProcessedImage;
  medium: ProcessedImage;
  large: ProcessedImage;
  original: ProcessedImage;
}

interface ProcessOptions {
  folder: string;
  entityId?: string;
  fileId: string;
}

/**
 * Standard image processing pipeline.
 * Generates 4 variants: thumbnail, medium, large, original (metadata-stripped).
 */
export async function processImage(
  inputBuffer: Buffer,
  options: ProcessOptions
): Promise<ImageVariants> {
  const { folder, entityId, fileId } = options;
  const basePath = entityId ? `${folder}/${entityId}` : folder;

  const [thumbnail, medium, large, original] = await Promise.all([
    // Thumbnail: 400×300, quality 80
    sharp(inputBuffer)
      .resize(400, 300, { fit: "cover", position: "center" })
      .webp({ quality: 80 })
      .toBuffer(),

    // Medium: 800×600, quality 80
    sharp(inputBuffer)
      .resize(800, 600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer(),

    // Large: 1600×1200, quality 85
    sharp(inputBuffer)
      .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(),

    // Original: auto-rotate from EXIF, convert to WebP (metadata stripped by default)
    sharp(inputBuffer).rotate().webp({ quality: 90 }).toBuffer(),
  ]);

  return {
    thumbnail: {
      buffer: thumbnail,
      key: `${basePath}/thumb_${fileId}.webp`,
      contentType: "image/webp",
    },
    medium: {
      buffer: medium,
      key: `${basePath}/med_${fileId}.webp`,
      contentType: "image/webp",
    },
    large: {
      buffer: large,
      key: `${basePath}/lg_${fileId}.webp`,
      contentType: "image/webp",
    },
    original: {
      buffer: original,
      key: `${basePath}/orig_${fileId}.webp`,
      contentType: "image/webp",
    },
  };
}

/**
 * Profile image processing — square crop, display size + original.
 */
export async function processProfileImage(
  inputBuffer: Buffer,
  fileId: string
): Promise<{ display: ProcessedImage; original: ProcessedImage }> {
  const [display, original] = await Promise.all([
    sharp(inputBuffer)
      .resize(400, 400, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer(),

    sharp(inputBuffer).rotate().webp({ quality: 90 }).toBuffer(),
  ]);

  return {
    display: {
      buffer: display,
      key: `profile/headshot_${fileId}.webp`,
      contentType: "image/webp",
    },
    original: {
      buffer: original,
      key: `profile/orig_${fileId}.webp`,
      contentType: "image/webp",
    },
  };
}

/**
 * Logo/badge processing — fit to square, display size + original.
 */
export async function processLogoImage(
  inputBuffer: Buffer,
  folder: string,
  entityId: string,
  fileId: string
): Promise<{ display: ProcessedImage; original: ProcessedImage }> {
  const prefix = folder === "certifications" ? "badge" : "company";

  const [display, original] = await Promise.all([
    sharp(inputBuffer)
      .resize(200, 200, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(),

    sharp(inputBuffer).rotate().webp({ quality: 90 }).toBuffer(),
  ]);

  return {
    display: {
      buffer: display,
      key: `${folder}/${prefix}_${entityId}_${fileId}.webp`,
      contentType: "image/webp",
    },
    original: {
      buffer: original,
      key: `${folder}/orig_${entityId}_${fileId}.webp`,
      contentType: "image/webp",
    },
  };
}

/**
 * Blog featured image processing — wide format for cards and headers.
 */
export async function processFeaturedImage(
  inputBuffer: Buffer,
  postId: string,
  fileId: string
): Promise<{ featured: ProcessedImage; original: ProcessedImage }> {
  const [featured, original] = await Promise.all([
    sharp(inputBuffer)
      .resize(1200, 630, { fit: "cover", position: "center" })
      .webp({ quality: 85 })
      .toBuffer(),

    sharp(inputBuffer).rotate().webp({ quality: 90 }).toBuffer(),
  ]);

  return {
    featured: {
      buffer: featured,
      key: `blog/${postId}/featured_${fileId}.webp`,
      contentType: "image/webp",
    },
    original: {
      buffer: original,
      key: `blog/${postId}/orig_${fileId}.webp`,
      contentType: "image/webp",
    },
  };
}
