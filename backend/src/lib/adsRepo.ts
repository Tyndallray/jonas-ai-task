import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Ad, AdStatus } from './ads';
import { dynamoDb } from './dynamodb';
import { HttpError } from './http';

const TableName = process.env.ADS_TABLE;
const PAGE_SIZE = 20;

export interface Page {
  items: Ad[];
  nextCursor: string | null;
}

export type UpdateResult = { ok: true; ad: Ad } | { ok: false; reason: 'not_found' | 'conflict' };

export async function createAd(ad: Ad): Promise<void> {
  await dynamoDb.send(new PutCommand({ TableName, Item: ad }));
}

export async function getAd(id: string): Promise<Ad | undefined> {
  const result = await dynamoDb.send(new GetCommand({ TableName, Key: { id } }));
  return result.Item as Ad | undefined;
}

// One page of ads in a status, ordered by statusAt
export async function listByStatus(
  status: AdStatus,
  newestFirst: boolean,
  cursor?: string,
): Promise<Page> {
  const result = await dynamoDb.send(
    new QueryCommand({
      TableName,
      IndexName: 'byStatus',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      ScanIndexForward: !newestFirst,
      Limit: PAGE_SIZE,
      ExclusiveStartKey: cursor ? decodeCursor(cursor) : undefined,
    }),
  );
  return {
    items: (result.Items ?? []) as Ad[],
    nextCursor: result.LastEvaluatedKey ? encodeCursor(result.LastEvaluatedKey) : null,
  };
}

// All of an owner's ads, newest first
export async function listByOwner(ownerId: string): Promise<Ad[]> {
  const items: Ad[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName,
        IndexName: 'byOwner',
        KeyConditionExpression: 'ownerId = :ownerId',
        ExpressionAttributeValues: { ':ownerId': ownerId },
        ScanIndexForward: false,
        ExclusiveStartKey,
      }),
    );
    items.push(...((result.Items ?? []) as Ad[]));
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

// Applies `set`/`remove` only if the ad is in `expected.status` (and owned by `expected.ownerId`).
// The condition makes status transitions race-free.
export async function updateIf(
  id: string,
  expected: { status: AdStatus; ownerId?: string },
  set: Partial<Omit<Ad, 'id'>>,
  remove: (keyof Ad)[] = [],
): Promise<UpdateResult> {
  const names: Record<string, string> = { '#status': 'status' };
  const values: Record<string, unknown> = { ':expected': expected.status };
  let condition = 'attribute_exists(id) AND #status = :expected';
  if (expected.ownerId) {
    values[':owner'] = expected.ownerId;
    condition += ' AND ownerId = :owner';
  }

  const sets = Object.entries(set)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      names[`#${key}`] = key;
      values[`:${key}`] = value;
      return `#${key} = :${key}`;
    });
  const removes = remove.map((key) => {
    names[`#${key}`] = key;
    return `#${key}`;
  });

  try {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName,
        Key: { id },
        ConditionExpression: condition,
        UpdateExpression: [
          sets.length ? `SET ${sets.join(', ')}` : '',
          removes.length ? `REMOVE ${removes.join(', ')}` : '',
        ].join(' '),
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
        ReturnValuesOnConditionCheckFailure: 'ALL_OLD',
      }),
    );
    return { ok: true, ad: result.Attributes as Ad };
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      // Item is the raw (marshalled) old item, present only if the ad exists
      const old = error.Item;
      const ownerMatches = !expected.ownerId || old?.ownerId?.S === expected.ownerId;
      return { ok: false, reason: old && ownerMatches ? 'conflict' : 'not_found' };
    }
    throw error;
  }
}

// Deletes the ad if it belongs to ownerId; returns the deleted ad
export async function deleteIfOwner(id: string, ownerId: string): Promise<Ad | undefined> {
  try {
    const result = await dynamoDb.send(
      new DeleteCommand({
        TableName,
        Key: { id },
        ConditionExpression: 'ownerId = :owner',
        ExpressionAttributeValues: { ':owner': ownerId },
        ReturnValues: 'ALL_OLD',
      }),
    );
    return result.Attributes as Ad | undefined;
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) return undefined;
    throw error;
  }
}

function encodeCursor(key: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(key)).toString('base64url');
}

function decodeCursor(cursor: string) {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString());
  } catch {
    throw new HttpError(400, 'Invalid cursor.');
  }
}
