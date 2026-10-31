import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, tableName } from '../lib/dynamodb';

export const list: APIGatewayProxyHandler = async () => {
  try {
    // For production workloads, design tables and indexes so you can use Query instead of Scan.
    const result = await dynamoDb.send(new ScanCommand({ TableName: tableName }));
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items ?? []),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Couldn't fetch the todo items." }),
    };
  }
};
