# Proposal

## Why

The frontend only runs on `localhost`; its README already assumes "AWS Amplify builds the connected branch", but nothing creates that Amplify app. Each stage needs a hosted SPA wired to that stage's API and Cognito pools without hand-copying stack outputs into env files.

## What Changes

- The backend Serverless stack creates, for the `dev` and `prod` stages only, an Amplify Hosting app connected to `Tyndallray/jonas-ai-task` with one branch matching the stage (`dev` → `dev`, `prod` → `prod`), building `frontend/` and auto-building on push.
- Amplify branch env vars (`VITE_COGNITO_*`, `VITE_ADMIN_COGNITO_*`, `VITE_API_BASE_URL`) are set from the same stack's resources.
- SPA rewrite so deep links (`/ads/:id`, `/admin`, ...) serve `index.html`.
- Cognito user/admin app clients add the Amplify branch URL to callback and sign-out URLs, keeping `http://localhost:5173` for local dev.
- The GitHub token is read from Secrets Manager (`jonas-ai-task/github-token`) at deploy time.
- New stack output `FrontendUrl`; READMEs document the one-time setup.

## Capabilities

### New Capabilities
- `frontend-hosting`: per-stage hosted frontend: which branch deploys where, how it gets its configuration, and that sign-in works from the hosted URL.

### Modified Capabilities
- None.

## Out of scope

- Custom domains, password-protecting branches, PR preview environments.
- Changing how the backend deploys or the frontend CI workflow.

## Impact

- `backend/serverless.yml` (Amplify App/Branch resources with inline monorepo build spec, stage condition, Cognito client URLs, output).
- `backend/README.md`, `frontend/README.md`.
- New AWS prerequisites: the Amplify GitHub App installed on the repo, a GitHub PAT in Secrets Manager, and Amplify + Secrets Manager permissions for the deploy IAM user.
