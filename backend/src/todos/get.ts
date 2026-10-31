import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, tableName } from '../lib/dynamodb';

export const get: APIGatewayProxyHandler = async (event) => {
  try {
    const result = await dynamoDb.send(
      new GetCommand({ TableName: tableName, Key: { id: event.pathParameters?.id } }),
    );

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Todo item not found.' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Couldn't fetch the todo item." }),
    };
  }
};
