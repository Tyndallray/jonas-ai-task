# frontend

React 19 + TypeScript + Vite SPA for the marketplace: a public ad feed, user pages for posting and managing
ads, and an admin review area.

Auth uses [`react-oidc-context`](https://github.com/authts/react-oidc-context) /
[`oidc-client-ts`](https://github.com/authts/oidc-client-ts) against Cognito managed login with the
**Authorization Code flow with PKCE**. There are two pools:

- **Users** sign in or sign up from the header (the managed login page links to signup).
- **Admins** sign in at `/admin`, which has its own `AuthProvider` against the admin pool and its own
  namespaced token storage, so both sessions can coexist in one browser. Admins cannot sign up.

## Setup

1. Deploy the backend (see `../backend/README.md`). It creates both pools and app clients.
2. Copy the env file and fill it in from the backend stack outputs (`npm run info` in `backend/`):

   ```sh
   cp .env.example .env.local
   ```

3. Run it:

   ```sh
   npm install
   npm run dev
   ```

## Pages

| Path | Access | Purpose |
| --- | --- | --- |
| `/` | public | Approved ads, newest first, "Load more", poster's email |
| `/ads/:id` | public | Ad detail |
| `/ads/new` | user | Post an ad (optional image, uploaded straight to S3) |
| `/my-ads` | user | Own ads with status, admin note, delete |
| `/my-ads/:id/edit` | user | Edit and resubmit an ad an admin asked more info about |
| `/admin` | admin | Review queue: approve, request info, reject |

## Structure

| Path | Purpose |
| --- | --- |
| `src/auth/config.ts` | OIDC settings for both pools, Cognito logout URL |
| `src/auth/ProtectedRoute.tsx` | Redirects unauthenticated visitors to the nearest provider's sign-in |
| `src/lib/useApi.ts` | `fetch` wrapper that sends `Authorization: Bearer <ID token>` |
| `src/lib/useImageUpload.ts` | Presigned POST upload to S3 |
| `src/admin/` | Admin area and review queue |

The API Gateway Cognito authorizers validate the ID token (signature, issuer, expiry, audience), which
also carries the `email` claim shown on ads. Claims decoded in the browser are for display only.

## Scripts

- `npm run dev` — dev server on http://localhost:5173
- `npm run build` — type-check and build to `dist/`
- `npm run lint` — oxlint
- `npm run preview` — serve the production build
