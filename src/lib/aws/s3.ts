import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.APP_AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL!;

/**
 * Upload a buffer to S3 and return the CloudFront URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "max-age=31536000, immutable",
    })
  );

  return `${CLOUDFRONT_URL}/${key}`;
}

/**
 * Delete a single object from S3.
 */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

/**
 * Delete all objects under a given prefix (e.g., "projects/abc123/").
 * Note: ListObjectsV2 returns at most 1000 objects per call — sufficient for a portfolio CMS.
 */
export async function deleteS3Folder(prefix: string): Promise<number> {
  const listResult = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  if (!listResult.Contents || listResult.Contents.length === 0) {
    return 0;
  }

  await Promise.all(listResult.Contents.map((obj) => deleteFromS3(obj.Key!)));

  return listResult.Contents.length;
}

/**
 * Delete all size variants of an image given one of its keys.
 * e.g., given "projects/abc/thumb_xyz.webp", also deletes med_, lg_, orig_ variants.
 */
export async function deleteImageVariants(key: string): Promise<void> {
  const lastSlash = key.lastIndexOf("/");
  const folder = key.substring(0, lastSlash + 1);
  const filename = key.substring(lastSlash + 1);

  const match = filename.match(
    /^(?:thumb_|med_|lg_|orig_|featured_|headshot_|company_|badge_)(.+)$/
  );
  if (!match) {
    await deleteFromS3(key);
    return;
  }

  const baseId = match[1];
  const prefixes = ["thumb_", "med_", "lg_", "orig_", "featured_", "headshot_", "company_", "badge_"];

  await Promise.all(
    prefixes.map((prefix) =>
      deleteFromS3(`${folder}${prefix}${baseId}`).catch(() => {
        // Silently ignore missing variants
      })
    )
  );
}

export async function getPresignedUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
