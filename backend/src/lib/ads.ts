import { HttpError } from './http';

export type AdStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO';

export interface Ad {
  id: string;
  ownerId: string;
  ownerEmail: string;
  title: string;
  description: string;
  priceCents: number;
  imageKey?: string;
  status: AdStatus;
  adminNote?: string;
  createdAt: number;
  updatedAt: number;
  // When the ad entered its current status; for APPROVED ads this is the approval time
  statusAt: number;
}

export interface AdInput {
  title: string;
  description: string;
  priceCents: number;
  imageKey?: string;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const IMAGE_KEY = /^ads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export function validateAdInput(data: Record<string, unknown>): AdInput {
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const { price, imageKey } = data;

  if (title.length < 1 || title.length > 100) {
    throw new HttpError(400, 'Title must be 1-100 characters.');
  }
  if (description.length < 1 || description.length > 2000) {
    throw new HttpError(400, 'Description must be 1-2000 characters.');
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    throw new HttpError(400, 'Price must be a non-negative number.');
  }
  const priceCents = Math.round(price * 100);
  if (Math.abs(price * 100 - priceCents) > 1e-6) {
    throw new HttpError(400, 'Price can have at most 2 decimals.');
  }
  if (imageKey != null && (typeof imageKey !== 'string' || !IMAGE_KEY.test(imageKey))) {
    throw new HttpError(400, 'Invalid image.');
  }

  return { title, description, priceCents, imageKey: imageKey ?? undefined };
}

function imageUrl(ad: Ad) {
  return ad.imageKey ? `${process.env.IMAGES_BASE_URL}/${ad.imageKey}` : null;
}

// Shape shown to anyone on the public feed and detail page
export function toPublicAd(ad: Ad) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.priceCents / 100,
    imageUrl: imageUrl(ad),
    ownerEmail: ad.ownerEmail,
    approvedAt: ad.statusAt,
  };
}

// Shape shown to the owner and to admins: includes moderation state
export function toAdDetail(ad: Ad) {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description,
    price: ad.priceCents / 100,
    imageKey: ad.imageKey ?? null,
    imageUrl: imageUrl(ad),
    ownerEmail: ad.ownerEmail,
    status: ad.status,
    adminNote: ad.adminNote ?? null,
    createdAt: ad.createdAt,
    updatedAt: ad.updatedAt,
    statusAt: ad.statusAt,
  };
}
