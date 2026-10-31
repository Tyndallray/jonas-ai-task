# Tasks

## 1. Infrastructure

- [ ] 1.1 In `backend/serverless.yml`, remove the Todo functions, table and handlers. Add UserPool (self-signup, email verification) and AdminPool (admin-create-only), each with a domain and a PKCE app client. Add the `userAuthorizer` and `adminAuthorizer` and stack outputs for ids and domains. Verify: `npm run typecheck` passes and `serverless deploy` prints the outputs.
- [ ] 1.2 Add the `Ads` table with `byStatus` (status/statusAt) and `byOwner` (ownerId/createdAt) GSIs. Add the S3 image bucket with public read on `ads/*` and CORS for POST uploads. Update IAM. Verify: the deploy succeeds and the resources appear in the console.

## 2. Backend: ads (user + public)

- [ ] 2.1 Add shared helpers: claims extraction (`sub`, `email`), ad validation, price ↔ `priceCents` conversion, cursor encode/decode, and JSON responses. Verify: typecheck passes.
- [ ] 2.2 Implement:
  - `POST /ads/image-upload` (presigned POST)
  - `POST /ads`
  - `GET /me/ads`
  - `PUT /me/ads/{id}` (conditional on `NEEDS_INFO` → `PENDING`)
  - `DELETE /me/ads/{id}` (owner-only, plus image delete)

  Verify with curl, using a user ID token: create returns `PENDING` and the ad shows in `/me/ads`.
- [ ] 2.3 Implement `GET /ads` (APPROVED, newest first, 20 per page plus cursor) and `GET /ads/{id}` (404 unless APPROVED). Verify: an anonymous curl returns 200, and a pending ad returns 404.

## 3. Backend: moderation

- [ ] 3.1 Implement `GET /admin/ads` (PENDING, oldest first, paginated) and `POST /admin/ads/{id}/decision`. The decision endpoint takes approve, reject or request_info. A note is required for reject and request_info. Each decision is conditional on `PENDING` and returns 409 otherwise. Verify with curl using an admin ID token. Also verify that a user token gets 401 or 403.
- [ ] 3.2 Add one happy-path test for the full lifecycle: create → request_info → edit/resubmit → approve → appears in public feed. Verify: the test passes locally.

## 4. Frontend

- [ ] 4.1 Switch `useApi` to send `id_token`. Add the admin OIDC client (a separate `UserManager` with namespaced storage) and the admin env vars to `.env.example`. Fix the placeholder region to `eu-west-2`. Verify: user and admin can each sign in, and the sessions do not clash.
- [ ] 4.2 Build the user pages:
  - feed with "load more" and the poster's email, at `/`
  - ad detail at `/ads/:id`
  - create with image upload at `/ads/new`
  - My ads with status, note and delete at `/my-ads`
  - edit and resubmit at `/my-ads/:id/edit`, for `NEEDS_INFO` ads only

  Verify manually that a user can create, see, edit and delete an ad.
- [ ] 4.3 Build the `/admin` queue with ad detail and approve, reject and request-info actions (note required where needed). Verify manually that an approved ad appears at the top of the public feed.

## 5. Docs

- [ ] 5.1 Update the README with deploy steps, copying stack outputs into `frontend/.env`, and the `admin-create-user` command for the first admin. Verify: a fresh setup works by following the README.
