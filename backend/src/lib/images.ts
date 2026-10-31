import { randomUUID } from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { IMAGE_TYPES, MAX_IMAGE_BYTES } from './ads';
import { HttpError } from './http';

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ImageData {
  mediaType: ImageType;
  bytes: Uint8Array;
}

const TYPE_BY_EXT: Record<string, ImageType> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

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

// Key must already be validated against IMAGE_KEY
export async function loadImageByKey(key: string): Promise<ImageData> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return { mediaType: TYPE_BY_EXT[key.split('.').pop()!], bytes };
  } catch (error) {
    if ((error as Error).name === 'NoSuchKey') throw new HttpError(400, 'Image not found.');
    throw error;
  }
}

// Reads at most MAX_IMAGE_BYTES so a large or endless response can't exhaust memory
export async function loadImageByUrl(url: string): Promise<ImageData> {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch {
    throw new HttpError(400, 'Could not fetch the image URL.');
  }
  if (!res.ok || !res.body) throw new HttpError(400, 'Could not fetch the image URL.');

  const mediaType = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
  if (!(mediaType in IMAGE_TYPES)) throw new HttpError(400, 'Image must be JPEG, PNG or WebP.');

  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of res.body) {
    size += chunk.byteLength;
    if (size > MAX_IMAGE_BYTES) throw new HttpError(400, 'Image must be 5 MB or smaller.');
    chunks.push(chunk);
  }
  return { mediaType: mediaType as ImageType, bytes: Buffer.concat(chunks) };
}
