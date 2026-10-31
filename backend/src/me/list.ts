import { toAdDetail } from '../lib/ads';
import { listByOwner } from '../lib/adsRepo';
import { claims, handler, json } from '../lib/http';

export const list = handler(async (event) => {
  const { sub } = claims(event);
  const ads = await listByOwner(sub);
  return json(200, { items: ads.map(toAdDetail) });
});
