# backend

Marketplace REST API: Serverless Framework v4, TypeScript, DynamoDB, S3, and two Cognito user pools
(users with self-signup, admins without). Serverless v4 bundles the TypeScript handlers itself with its
built-in esbuild, so there is no build step and no plugin to install.

## Setup and deploy

AWS commands use the `afferenza` profile (the npm scripts pass `--aws-profile afferenza`).

```bash
cd backend
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest: ad lifecycle happy path
npm run deploy      # serverless deploy (needs a Serverless login)
npm run info        # prints the endpoint and stack outputs again
```

The stack outputs feed `frontend/.env.local`:

| Output | Frontend env var |
| --- | --- |
| `ServiceEndpoint` | `VITE_API_BASE_URL` |
| `UserPoolAuthority` | `VITE_COGNITO_AUTHORITY` |
| `UserPoolClientId` | `VITE_COGNITO_CLIENT_ID` |
| `UserPoolDomainUrl` | `VITE_COGNITO_DOMAIN` |
| `AdminPoolAuthority` | `VITE_ADMIN_COGNITO_AUTHORITY` |
| `AdminPoolClientId` | `VITE_ADMIN_COGNITO_CLIENT_ID` |
| `AdminPoolDomainUrl` | `VITE_ADMIN_COGNITO_DOMAIN` |

The Cognito callback/sign-out URLs default to `http://localhost:5173`. For another origin, deploy with
`npm run deploy -- --param="frontendUrl=https://your.site"`.

### Frontend hosting (Amplify)

The `dev` and `prod` stages also create an Amplify Hosting app (`jonas-ai-task-frontend-<stage>`) that
builds `frontend/` from the branch of the same name on every push. The branch gets the `VITE_*` values
above from this stack, and both Cognito clients also allow the hosted URL (`FrontendUrl` output, e.g.
`https://dev.<appId>.amplifyapp.com`). Other stages skip hosting.

One-time prerequisites:

- A GitHub token stored as the SSM SecureString `/jonas-ai-task/github-token` (us-east-1). Serverless
  reads it and passes it as a `NoEcho` stack parameter, because CloudFormation can't resolve `ssm-secure`
  for Amplify. Like every resolved `${ssm:...}` value, it also ends up in Serverless's state file in
  the private deployment bucket.
- The Amplify GitHub App must have access to `Tyndallray/jonas-ai-task`.

CloudFormation doesn't start a build when it creates the branch, and Amplify doesn't rebuild when env
vars change, so after the first deploy of a stage (or when its pools/API are recreated) start a build:

```bash
aws amplify start-job --profile afferenza --region us-east-1 \
  --app-id <FrontendAppId> --branch-name <stage> --job-type RELEASE
```

### Create an admin

Admins cannot sign up. Create one with the AdminPoolId output:

```bash
aws cognito-idp admin-create-user --profile afferenza --region us-east-1 \
  --user-pool-id <AdminPoolId> --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true
```

Cognito emails a temporary password; the admin sets a new one on first sign-in at `/admin`.

### Get a token for curl

Both app clients allow `ADMIN_USER_PASSWORD_AUTH`, so an operator with IAM credentials can mint an ID token:

```bash
aws cognito-idp admin-initiate-auth --profile afferenza --region us-east-1 \
  --user-pool-id <PoolId> --client-id <ClientId> --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=<email>,PASSWORD=<password> \
  --query AuthenticationResult.IdToken --output text
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
serverless.yml        # functions, authorizers, Ads table, images bucket, Cognito pools
src/lib/http.ts       # handler wrapper, JSON responses, authorizer claims
src/lib/ads.ts        # Ad model, validation, response shapes
src/lib/adsRepo.ts    # DynamoDB access (conditional status transitions, pagination)
src/lib/images.ts     # S3 presigned POST and image deletion
src/ads/*.ts          # public feed/detail, create, image upload
src/me/*.ts           # owner's ads: list, edit + resubmit, delete
src/admin/*.ts        # review queue, moderation decision
test/                 # vitest
```

## Endpoints

Authenticated endpoints take `Authorization: Bearer <ID token>` from the matching pool.

| Method | Path | Auth | Body |
| --- | --- | --- | --- |
| GET | `/ads?cursor=` | public | Approved ads, newest first, 20 per page, `{ items, nextCursor }` |
| GET | `/ads/{id}` | public | 404 unless approved |
| POST | `/ads` | user | `{ "title", "description", "price": 12.5, "imageKey"? }` |
| POST | `/ads/image-upload` | user | `{ "contentType": "image/png" }` → `{ url, fields, key }` presigned POST |
| GET | `/me/ads` | user | All own ads with `status` and `adminNote` |
| PUT | `/me/ads/{id}` | user | Same as create; only for `NEEDS_INFO` ads, sends them back to `PENDING` |
| DELETE | `/me/ads/{id}` | user | |
| GET | `/admin/ads?cursor=` | admin | Pending ads, oldest first |
| POST | `/admin/ads/{id}/decision` | admin | `{ "action": "approve" \| "reject" \| "request_info", "note"? }` (note required unless approving) |

Ad statuses: `PENDING` → `APPROVED` \| `REJECTED` \| `NEEDS_INFO`; `NEEDS_INFO` → `PENDING` when the owner resubmits.
