import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export type Handler = (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(statusCode: number, body?: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    // `cors: true` only answers preflight; proxy responses must carry the header themselves
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: body === undefined ? '' : JSON.stringify(body),
  };
}

// Wraps a handler so HttpErrors become their status code and anything else is a logged 500
export function handler(fn: Handler): Handler {
  return async (event) => {
    try {
      return await fn(event);
    } catch (error) {
      if (error instanceof HttpError) return json(error.statusCode, { message: error.message });
      console.error(error);
      return json(500, { message: 'Internal server error.' });
    }
  };
}

export function parseBody(event: APIGatewayProxyEvent): Record<string, unknown> {
  try {
    const data = JSON.parse(event.body ?? '{}');
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  } catch {
    // fall through
  }
  throw new HttpError(400, 'Request body must be a JSON object.');
}

// Claims from the API Gateway Cognito authorizer (ID token)
export function claims(event: APIGatewayProxyEvent): { sub: string; email: string } {
  const c = event.requestContext.authorizer?.claims ?? {};
  if (typeof c.sub !== 'string') throw new HttpError(401, 'Unauthorized.');
  return { sub: c.sub, email: typeof c.email === 'string' ? c.email : '' };
}
