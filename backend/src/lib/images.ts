import { randomUUID } from 'crypto';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './ads';

const s3 = new S3Client({});
const Bucket = process.env.IMAGES_BUCKET;

// Presigned POST (not PUT) so S3 enforces the size limit and content type
export async function presignImageUpload(contentType: string) {
  const key = `ads/${randomUUID()}.${IMAGE_TYPES[contentType]}`;
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: Bucket!,
    Key: key,
    Conditions: [
      ['content-length-range', 1, MAX_IMAGE_BYTES],
      ['eq', '$Content-Type', contentType],
    ],
    Fields: { 'Content-Type': contentType },
    Expires: 300,
  });
  return { url, fields, key };
}

// Best-effort: a leftover image is harmless, so failures are only logged
export async function deleteImage(key: string | undefined) {
  if (!key) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));
  } catch (error) {
    console.error('Failed to delete image', key, error);
  }
}
