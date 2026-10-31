# backend

A Serverless Framework v4 REST API in TypeScript, backed by DynamoDB. It is based on the
[aws-node-typescript-rest-api-with-dynamodb](https://github.com/serverless/examples/tree/v4/aws-node-typescript-rest-api-with-dynamodb) example.

Serverless v4 bundles the TypeScript handlers itself with its built-in esbuild, so there is no build step and no plugin to install.

## Setup

```bash
cd backend
npm install
npm run typecheck   # tsc --noEmit
npm run deploy      # serverless deploy (needs AWS credentials and a Serverless login)
```

## Deployment (GitHub Actions)

`.github/workflows/backend.yml` runs whenever `backend/` changes:

| Trigger             | What happens                              |
| ------------------- | ----------------------------------------- |
| PR into `dev`/`prod` | `npm ci` + typecheck                      |
| push to `dev`       | typecheck, then `serverless deploy --stage dev`  |
| push to `prod`      | typecheck, then `serverless deploy --stage prod` |

The branch name is the stage. Each deploy runs in the GitHub environment of the same name; the `prod` environment only accepts deployments from the `prod` branch.

Repository secrets used by the deploy job:

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: IAM user access keys for the deploy account
- `SERVERLESS_ACCESS_KEY`: Serverless Framework access key

## Layout

```
serverless.yml        # service, IAM, functions, DynamoDB table
src/lib/dynamodb.ts   # shared DynamoDB document client
src/todos/*.ts        # one Lambda handler per endpoint
```

## Endpoints

| Method | Path          | Body                                 |
| ------ | ------------- | ------------------------------------ |
| POST   | `/todos`      | `{ "text": "Learn Serverless" }`     |
| GET    | `/todos`      |                                      |
| GET    | `/todos/{id}` |                                      |
| PUT    | `/todos/{id}` | `{ "text": "...", "checked": true }` |
| DELETE | `/todos/{id}` |                                      |
