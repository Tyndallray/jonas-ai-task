import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const tableName = process.env.DYNAMODB_TABLE;
