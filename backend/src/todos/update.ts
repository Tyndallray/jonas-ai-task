import { APIGatewayProxyHandler } from 'aws-lambda';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDb, tableName } from '../lib/dynamodb';

export const update: APIGatewayProxyHandler = async (event) => {
  const timestamp = new Date().getTime();
  const data = JSON.parse(event.body ?? '{}');

  if (typeof data.text !== 'string' || typeof data.checked !== 'boolean') {
    console.error('Validation Failed');
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Couldn't update the todo item." }),
    };
  }

  try {
    const result = await dynamoDb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { id: event.pathParameters?.id },
        ConditionExpression: 'attribute_exists(id)',
        ExpressionAttributeNames: { '#todo_text': 'text' },
        ExpressionAttributeValues: {
          ':text': data.text,
          ':checked': data.checked,
          ':updatedAt': timestamp,
        },
        UpdateExpression: 'SET #todo_text = :text, checked = :checked, updatedAt = :updatedAt',
        ReturnValues: 'ALL_NEW',
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Todo item not found.' }),
      };
    }
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Couldn't update the todo item." }),
    };
  }
};
