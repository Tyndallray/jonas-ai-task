import { APIGatewayProxyHandler } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, tableName } from '../lib/dynamodb';

// `delete` is a reserved word, so the handler is exported as `remove`.
export const remove: APIGatewayProxyHandler = async (event) => {
  try {
    await dynamoDb.send(
      new DeleteCommand({ TableName: tableName, Key: { id: event.pathParameters?.id } }),
    );
    return {
      statusCode: 204,
      body: '',
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Couldn't remove the todo item." }),
    };
  }
};
