import type { APIGatewayProxyEvent } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';

const send = vi.fn();
vi.mock('@aws-sdk/client-bedrock-runtime', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  BedrockRuntimeClient: class {
    send = send;
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
    send.mockResolvedValueOnce({
      stopReason: 'tool_use',
      output: {
        message: {
          content: [
            { toolUse: { name: 'submit_listing', input: { title: 'Red road bike', description: 'A 56cm road bike.' } } },
          ],
        },
      },
    });

    const res = await describeAd(event({ imageKey }));

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ title: 'Red road bike', description: 'A 56cm road bike.' });
    expect(send.mock.calls[0][0].input.messages[0].content[0].image).toMatchObject({ format: 'jpeg' });
  });

  it('responds 422 when the model returns no listing', async () => {
    send.mockResolvedValueOnce({
      stopReason: 'content_filtered',
      output: { message: { content: [{ text: 'I cannot help with that.' }] } },
    });

    const res = await describeAd(event({ imageKey }));

    expect(res.statusCode).toBe(422);
  });
});
