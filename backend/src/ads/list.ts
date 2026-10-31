import { toPublicAd } from '../lib/ads';
import { listByStatus } from '../lib/adsRepo';
import { handler, json } from '../lib/http';

// Public feed: approved ads, newest approval first
export const list = handler(async (event) => {
  const page = await listByStatus('APPROVED', true, event.queryStringParameters?.cursor);
  return json(200, { items: page.items.map(toPublicAd), nextCursor: page.nextCursor });
});
