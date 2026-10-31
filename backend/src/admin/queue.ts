import { toAdDetail } from '../lib/ads';
import { listByStatus } from '../lib/adsRepo';
import { handler, json } from '../lib/http';

// Review queue: pending ads, oldest first
export const queue = handler(async (event) => {
  const page = await listByStatus('PENDING', false, event.queryStringParameters?.cursor);
  return json(200, { items: page.items.map(toAdDetail), nextCursor: page.nextCursor });
});
