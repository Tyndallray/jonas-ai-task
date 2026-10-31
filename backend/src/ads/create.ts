import { randomUUID } from 'crypto';
import { toAdDetail, validateAdInput, type Ad } from '../lib/ads';
import { createAd } from '../lib/adsRepo';
import { claims, handler, json, parseBody } from '../lib/http';

export const create = handler(async (event) => {
  const { sub, email } = claims(event);
  const input = validateAdInput(parseBody(event));
  const now = Date.now();

  const ad: Ad = {
    id: randomUUID(),
    ownerId: sub,
    ownerEmail: email,
    ...input,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
    statusAt: now,
  };
  await createAd(ad);
  return json(201, toAdDetail(ad));
});
