import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';
import type { Ad } from '../src/lib/ads';
import type { UpdateResult } from '../src/lib/adsRepo';

// In-memory stand-in for the DynamoDB repository, mirroring its conditional semantics
const table = new Map<string, Ad>();
vi.mock('../src/lib/adsRepo', () => ({
  createAd: async (ad: Ad) => void table.set(ad.id, { ...ad }),
  getAd: async (id: string) => table.get(id),
  listByStatus: async (status: string, newestFirst: boolean) => ({
    items: [...table.values()]
      .filter((ad) => ad.status === status)
      .sort((a, b) => (newestFirst ? b.statusAt - a.statusAt : a.statusAt - b.statusAt)),
    nextCursor: null,
  }),
  listByOwner: async (ownerId: string) => [...table.values()].filter((ad) => ad.ownerId === ownerId),
  updateIf: async (
    id: string,
    expected: { status: string; ownerId?: string },
    set: Partial<Ad>,
    remove: (keyof Ad)[] = [],
  ): Promise<UpdateResult> => {
    const ad = table.get(id);
    if (!ad || (expected.ownerId && ad.ownerId !== expected.ownerId)) {
      return { ok: false, reason: 'not_found' };
    }
    if (ad.status !== expected.status) return { ok: false, reason: 'conflict' };
    const next = { ...ad, ...set };
    for (const key of remove) delete next[key];
    table.set(id, next);
    return { ok: true, ad: next };
  },
  deleteIfOwner: async () => undefined,
}));
vi.mock('../src/lib/images', () => ({ deleteImage: async () => {} }));

const { create } = await import('../src/ads/create');
const { list: feed } = await import('../src/ads/list');
const { get: publicGet } = await import('../src/ads/get');
const { list: myAds } = await import('../src/me/list');
const { update } = await import('../src/me/update');
const { queue } = await import('../src/admin/queue');
const { decide } = await import('../src/admin/decide');

function event(opts: { body?: unknown; id?: string; user?: boolean } = {}) {
  return {
    body: opts.body === undefined ? null : JSON.stringify(opts.body),
    pathParameters: opts.id ? { id: opts.id } : null,
    queryStringParameters: null,
    requestContext: {
      authorizer: opts.user ? { claims: { sub: 'user-1', email: 'seller@example.com' } } : undefined,
    },
  } as unknown as APIGatewayProxyEvent;
}

const body = (res: { body: string }) => JSON.parse(res.body);

describe('ad lifecycle', () => {
  it('create → request info → resubmit → approve → public feed', async () => {
    const created = await create(
      event({ user: true, body: { title: 'Bike', description: 'Red road bike', price: 120.5 } }),
    );
    expect(created.statusCode).toBe(201);
    const ad = body(created);
    expect(ad.status).toBe('PENDING');

    // Not public while pending
    expect((await publicGet(event({ id: ad.id }))).statusCode).toBe(404);
    expect(body(await queue(event())).items.map((a: Ad) => a.id)).toEqual([ad.id]);

    const asked = await decide(event({ id: ad.id, body: { action: 'request_info', note: 'Add size' } }));
    expect(body(asked)).toMatchObject({ status: 'NEEDS_INFO', adminNote: 'Add size' });
    expect(body(await myAds(event({ user: true }))).items[0].adminNote).toBe('Add size');

    const resubmitted = await update(
      event({
        user: true,
        id: ad.id,
        body: { title: 'Bike (56cm)', description: 'Red road bike', price: 120.5 },
      }),
    );
    expect(body(resubmitted).status).toBe('PENDING');

    // A second edit is refused now that it is pending again
    const again = await update(
      event({ user: true, id: ad.id, body: { title: 'x', description: 'y', price: 1 } }),
    );
    expect(again.statusCode).toBe(409);

    expect(body(await decide(event({ id: ad.id, body: { action: 'approve' } }))).status).toBe(
      'APPROVED',
    );

    const page = body(await feed(event()));
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: ad.id,
      title: 'Bike (56cm)',
      price: 120.5,
      ownerEmail: 'seller@example.com',
    });
    expect(page.items[0].status).toBeUndefined();
  });
});
