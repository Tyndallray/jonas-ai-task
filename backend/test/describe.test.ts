import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';

const create = vi.fn();
vi.mock('@anthropic-ai/bedrock-sdk', () => ({
  AnthropicBedrockMantle: class {
    messages = { create };
  },
}));
vi.mock('../src/lib/images', () => ({
  loadImageByKey: async () => ({ mediaType: 'image/jpeg', bytes: new Uint8Array([1, 2, 3]) }),
  loadImageByUrl: async () => ({ mediaType: 'image/png', bytes: new Uint8Array([1, 2, 3]) }),
}));

const { describe: describeAd } = await import('../src/ads/describe');

const imageKey = 'ads/0b9f0a3e-8c3f-4c39-9a52-3f4f1a2b6c7d.jpg';

function event(body: unknown) {
  return {
    body: JSON.stringify(body),
    requestContext: { authorizer: { claims: { sub: 'user-1', email: 'seller@example.com' } } },
  } as unknown as APIGatewayProxyEvent;
}

describe('describe ad image', () => {
  it('returns a suggested title and description for an uploaded image', async () => {
    create.mockResolvedValueOnce({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: JSON.stringify({ title: 'Red road bike', description: 'A 56cm road bike.' }) }],
    });

    const res = await describeAd(event({ imageKey }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ title: 'Red road bike', description: 'A 56cm road bike.' });
    expect(create.mock.calls[0][0].messages[0].content[0].source).toMatchObject({
      type: 'base64',
      media_type: 'image/jpeg',
    });
  });

  it('responds 422 when the model declines', async () => {
    create.mockResolvedValueOnce({ stop_reason: 'refusal', content: [] });

    const res = await describeAd(event({ imageKey }));

    expect(res.statusCode).toBe(422);
  });
});
