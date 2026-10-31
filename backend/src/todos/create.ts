import { randomUUID } from 'crypto';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, tableName } from '../lib/dynamodb';

export const create: APIGatewayProxyHandler = async (event) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body ?? '{}');

  if (typeof data.text !== 'string') {
    console.error('Validation Failed');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Couldn't create the todo item." }),
    };
  }

  const item = {
    id: randomUUID(),
    text: data.text,
    checked: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  try {
    await dynamoDb.send(new PutCommand({ TableName: tableName, Item: item }));
    return {
      statusCode: 201,
      body: JSON.stringify(item),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Couldn't create the todo item." }),
    };
  }
};
