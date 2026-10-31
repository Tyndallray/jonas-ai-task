import { toPublicAd } from '../lib/ads';
import { getAd } from '../lib/adsRepo';
import { handler, HttpError, json } from '../lib/http';

// Public detail: ads that are not approved are indistinguishable from missing ones
export const get = handler(async (event) => {
  const ad = await getAd(event.pathParameters?.id ?? '');
  if (ad?.status !== 'APPROVED') throw new HttpError(404, 'Ad not found.');
  return json(200, toPublicAd(ad));
});
