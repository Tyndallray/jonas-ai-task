# Design

## Context

**Backend** (`backend/`):
- Serverless Framework v4, TypeScript, Node 24 on arm64, region `us-east-1` (moved from the scaffold's `eu-west-2` at the user's request).
- One Lambda per endpoint (`src/todos/*.ts`), sharing a DynamoDB client in `src/lib/dynamodb.ts`.
- Input checks are hand-written.
- No authorizers and no Cognito resources yet.

**Frontend** (`frontend/`):
- React 19, Vite and react-router 7.
- `oidc-client-ts` with `react-oidc-context` against one Cognito pool, configured in `src/auth/config.ts`.
- `src/lib/useApi.ts` sends a Bearer token with each request.

See `proposal.md` for scope and `specs/` for the required behaviour.

## Goals / Non-Goals

**Goals:**
- Build the simplest working version on the existing stack.
- Use one table and one bucket.
- Define all infrastructure in `serverless.yml`.

**Non-Goals:**
- A CDN for images.
- Email notifications to owners when a moderation decision is made.
- Audit history of moderation actions. Only the latest note is kept.

## Decisions

### Two Cognito pools, defined in `serverless.yml` resources
- **UserPool**:
  - email is the username, self-signup is on, email is auto-verified
  - managed login domain
  - public app client using code flow with PKCE
- **AdminPool**:
  - `AllowAdminCreateUserOnly: true`
  - its own domain and app client
- Admins are created with `aws cognito-idp admin-create-user`.
- *Alternative:* one pool with an `admins` group. Rejected because the requirement is explicitly separate pools.

### Two API Gateway Cognito authorizers
- A `userAuthorizer` sits on `/ads` write routes and `/me/*`.
- An `adminAuthorizer` sits on `/admin/*`.
- Public `GET` routes have no authorizer.
- Each authorizer trusts only its own pool, so a token from the other pool is rejected at the gateway.

### API sends the ID token, not the access token
- A Cognito authorizer with no scopes validates ID tokens.
- ID tokens carry `email`, which lets the API record `ownerEmail` at create time with no extra Cognito call.
- `useApi` changes to send `user.id_token`.
- *Alternative:* access token plus an `AdminGetUser` lookup. Rejected because it adds an extra call and more IAM permissions.

### Routes

| Method | Path | Auth | Spec |
|---|---|---|---|
| GET | `/ads?cursor=` | public | Public ad feed |
| GET | `/ads/{id}` | public | Public ad detail (approved only) |
| POST | `/ads` | user | Create |
| POST | `/ads/image-upload` | user | Presigned image upload |
| GET | `/me/ads` | user | View my ads |
| PUT | `/me/ads/{id}` | user | Edit and resubmit (`NEEDS_INFO` only) |
| DELETE | `/me/ads/{id}` | user | Delete |
| GET | `/admin/ads?cursor=` | admin | Review queue |
| POST | `/admin/ads/{id}/decision` | admin | Body `{action: approve\|reject\|request_info, note?}` |

### Data model

There is one `Ads` table with partition key `id` (a UUID).

**Item attributes:**
- `ownerId` (the `sub` claim), `ownerEmail`
- `title`, `description`, `priceCents`, `imageKey?`
- `status`, `adminNote?`
- `createdAt`, `updatedAt`
- `statusAt`: when the ad entered its current status

**Indexes:**
- **`byStatus` GSI** (PK `status`, SK `statusAt`):
  - The public feed reads `APPROVED` newest first. Because `statusAt` is the approval time, it matches "newest first" by approval.
  - The admin queue reads `PENDING` oldest first.
  - One index serves both.
- **`byOwner` GSI** (PK `ownerId`, SK `createdAt`, newest first) serves "My ads".

**Storage and API rules:**
- Price is stored as integer `priceCents` to avoid float errors.
- The API accepts and returns a decimal `price`.
- Status changes use a DynamoDB `ConditionExpression` on the current status. A failed condition returns 409. This enforces "pending only" and "`NEEDS_INFO` only" without races.
- The pagination cursor is base64 of `LastEvaluatedKey`. The page size is fixed at 20.
- The poster's email is denormalized onto the ad, because ads are public and there is no user table.

### Images: S3 presigned POST
- `POST /ads/image-upload` returns a presigned POST for `ads/<uuid>.<ext>`. It is limited by `content-length-range` (≤ 5 MB) and the allowed content types.
- The client uploads the file, then sends `imageKey` with the create or edit request.
- The bucket allows public `GetObject` on `ads/*`. Keys are unguessable UUIDs.
- Deleting an ad also deletes its image, on a best-effort basis.
- *Alternative:* presigned PUT. Rejected because it cannot enforce a size limit.

### Frontend admin area uses a second OIDC client
- `/admin/*` routes use their own `UserManager` pointed at AdminPool.
- Its storage is namespaced, for example a `admin.` prefix in sessionStorage.
- Existing user auth stays on `react-oidc-context`.
- New env vars: `VITE_ADMIN_COGNITO_AUTHORITY`, `VITE_ADMIN_COGNITO_CLIENT_ID`, `VITE_ADMIN_COGNITO_DOMAIN` and admin redirect/logout URIs.
- Pages:
  - `/` feed
  - `/ads/:id`
  - `/ads/new`
  - `/my-ads`
  - `/my-ads/:id/edit`
  - `/admin` queue with approve, reject and request-info actions

## Risks / Trade-offs

- **Poster emails are public**, so they can be scraped for spam. This is accepted because it is an explicit requirement. Rate limiting can be added later.
- **A denormalized email goes stale** if a user changes their email. This is acceptable for v1.
- **An uploaded image can be left without an ad** if the user never submits it. A later fix is an S3 lifecycle rule on unreferenced keys.
- **`byStatus` is a hot partition** because all approved ads share one partition key. This is fine at demo scale. Shard the key if traffic grows.

## Migration Plan

- Remove the Todo functions and table. They hold no real data.
- Deploy with `serverless deploy` and copy the pool ids, client ids and domains from the stack outputs into `frontend/.env`.
- Point the `.env.example` placeholders at `us-east-1`, the deploy region.
- Create the first admin with the CLI.
- Rollback: `serverless remove`, or redeploy the previous commit.
