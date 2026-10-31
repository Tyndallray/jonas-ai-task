# frontend

React 19 + TypeScript + Vite SPA with Amazon Cognito authentication.

Auth uses [`react-oidc-context`](https://github.com/authts/react-oidc-context) /
[`oidc-client-ts`](https://github.com/authts/oidc-client-ts) — the same setup AWS
generates in the Cognito console's React quick-start. Sign-in goes through Cognito
managed login (Hosted UI) using the **Authorization Code flow with PKCE**. Cognito
returns JWTs (`id_token`, `access_token`) and a `refresh_token`; tokens are renewed
silently before they expire.

## Setup

1. In the Cognito console, create (or open) a User Pool and an **app client**:
   - Type: public client / SPA, **no client secret**
   - OAuth grant: Authorization code grant
   - Scopes: `openid`, `email`, `profile`
   - Allowed callback URL: `http://localhost:5173/`
   - Allowed sign-out URL: `http://localhost:5173/`
   - A domain configured for managed login
2. Copy the env file and fill in the values:

   ```sh
   cp .env.example .env.local
   ```

3. Run it:

   ```sh
   npm install
   npm run dev
   ```

## Structure

| Path | Purpose |
| --- | --- |
| `src/auth/config.ts` | OIDC settings from env, Cognito logout URL |
| `src/auth/ProtectedRoute.tsx` | Redirects unauthenticated users to Cognito |
| `src/auth/useLogout.ts` | Clears the local session and calls Cognito `/logout` |
| `src/lib/useApi.ts` | `fetch` wrapper that sends `Authorization: Bearer <access token>` |
| `src/lib/jwt.ts` | Decodes JWT claims for display |
| `src/pages/Profile.tsx` | Protected page showing ID/access token claims and groups |

## Calling the backend

```tsx
const api = useApi()
const items = await api<Item[]>('/items')
```

The access token is a Cognito JWT. The backend must verify it — signature against
`https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json`,
`iss`, `exp`, `token_use === 'access'` and `client_id` — e.g. with
[`aws-jwt-verify`](https://github.com/awslabs/aws-jwt-verify). Claims decoded in the
browser are for display only.

## Scripts

- `npm run dev` — dev server on http://localhost:5173
- `npm run build` — type-check and build to `dist/`
- `npm run lint` — oxlint
- `npm run preview` — serve the production build
- `npm test` — run unit tests once (Vitest + Testing Library, jsdom)
- `npm run test:watch` — run tests in watch mode
- `npm run test:coverage` — run tests with a v8 coverage report in `coverage/`

## Tests

Tests sit next to the code they cover (`*.test.ts(x)`). `react-oidc-context` is
mocked with the helpers in `src/test/auth.ts`, so no Cognito pool is needed; the
Vitest config in `vite.config.ts` pins fake `VITE_COGNITO_*` values so a local
`.env` never affects results.

## CI/CD

`.github/workflows/frontend-ci.yml` runs lint, unit tests with coverage, and the
production build on pushes and pull requests to `dev`/`prod` that touch
`frontend/`. Deployment is done by AWS Amplify, which builds the connected branch.
