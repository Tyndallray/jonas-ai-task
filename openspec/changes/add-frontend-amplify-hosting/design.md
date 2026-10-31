# Design

## Context

- `backend/serverless.yml` is one CloudFormation stack per stage (`jonas-ai-task-backend-<stage>`, us-east-1), deployed by `.github/workflows/backend.yml` on pushes to `dev`/`prod`. Only the `dev` stack exists today.
- Cognito app clients take callback/sign-out URLs from `${param:frontendUrl}` (default `http://localhost:5173`).
- The frontend reads `VITE_*` at build time. `src/auth/config.ts` defaults the redirect/logout URIs to `window.location.origin` (`/` and `/admin`), so the hosted build only needs the authority, client ID, and domain for each pool, plus the API base URL.
- The account has no Amplify app for this repo. `Tyndallray/resume-frontend` is already connected, so the Amplify GitHub App is probably installed for the org.

## Goals / Non-Goals

**Goals:** one `serverless deploy --stage dev|prod` provisions hosting with no manual steps beyond the one-time secret and first build.

**Non-Goals:** managing Amplify outside CloudFormation (console/CLI), SSR/compute hosting, branch auto-detection.

## Decisions

1. **Amplify resources live in the backend stack, gated by a condition.** Add `Conditions: IsHostedStage` (stage is `dev` or `prod`) on `AWS::Amplify::App` (`FrontendApp`) and `AWS::Amplify::Branch` (`FrontendBranch`, `BranchName: ${sls:stage}`). Ad-hoc stages deploy without hosting and without needing the secret. *Alternative:* a separate frontend stack. Rejected: env values would have to cross stacks via exports.

2. **No dependency cycle.** The site URL is `https://${sls:stage}.${FrontendApp.DefaultDomain}`. The Cognito clients depend only on `FrontendApp`. The env vars go on `FrontendBranch`, which depends on the App, both pools/clients/domains, and `ApiGatewayRestApi`, so the graph is App → Clients → Branch. Branch env vars:
   - `VITE_COGNITO_AUTHORITY`, `VITE_COGNITO_CLIENT_ID`, `VITE_COGNITO_DOMAIN`
   - `VITE_ADMIN_COGNITO_AUTHORITY`, `VITE_ADMIN_COGNITO_CLIENT_ID`, `VITE_ADMIN_COGNITO_DOMAIN`
   - `VITE_API_BASE_URL` = `https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${sls:stage}`

   The redirect and logout URIs are left unset so they fall back to the origin.

3. **Callback URLs keep localhost.** `CallbackURLs`/`LogoutURLs` become `!If [IsHostedStage, [<frontendUrl>/, <site>/], [<frontendUrl>/]]`, and the same with `/admin` for the admin client. The `frontendUrl` param stays as the local-dev origin.

4. **Inline build spec on the App** (monorepo, `appRoot: frontend`). Set `AMPLIFY_MONOREPO_APP_ROOT=frontend` on the App. Install Node 22 to match CI (`nvm install 22`), then `npm ci` and `npm run build`. Artifacts come from `dist`, and `node_modules` is cached. Lint and tests stay in GitHub Actions, so they are not duplicated in Amplify. *Alternative:* a repo-root `amplify.yml`. Rejected to keep all hosting config in `backend/`.

5. **SPA rewrite.** Add a `CustomRules` regex rule that rewrites every path without a static-file extension to `/index.html` with status 200.

6. **GitHub token from SSM.** The token lives in the SecureString parameter `/jonas-ai-task/github-token`. CloudFormation's `ssm-secure` dynamic reference only works for a fixed list of resource types, and Amplify is not on it. Instead, Serverless resolves `${ssm:/jonas-ai-task/github-token}` (only in the `dev`/`prod` params) and passes it through `provider.stackParameters` into a `NoEcho` stack parameter that `AccessToken` refs. The token stays out of the compiled template and the repo, and is masked in stack details. Amplify only uses it to authorize the Amplify GitHub App, and does not store it.

7. **Builds.** `EnableAutoBuild: true`. The `prod` branch has `Stage: PRODUCTION` and the `dev` branch has `Stage: DEVELOPMENT`. Add `FrontendUrl` to the stack outputs (conditional).

## Risks / Trade-offs

- [CloudFormation creating a branch does not start a build, and changing env vars does not rebuild] → After the first deploy, run `aws amplify start-job --job-type RELEASE` once per stage. The env values are stable IDs, so later rebuilds are rare.
- [A push that changes both backend and frontend can build the frontend before the stack updates] → Only matters when env values change. Re-run the Amplify job if it happens.
- [The deploy IAM user lacks permissions] → The deploy user needs `amplify:*` and `ssm:GetParameter` on the parameter. The current CI user is in the `Admin` group.
- [Missing parameter or Amplify GitHub App not installed on this repo] → The deploy fails with a clear CloudFormation error. The README covers both prerequisites.

## Migration Plan

1. One-time setup: store the GitHub PAT as the SecureString `/jonas-ai-task/github-token`, and confirm the Amplify GitHub App has access to `jonas-ai-task`.
2. Merge to `dev`. CI deploys the dev stack, which creates the App and Branch and updates the Cognito URLs. Start the first build and check sign-in.
3. Merge `dev` into `prod`. That creates the prod stack and its app. Start its first build.

Rollback: revert the commit and redeploy. The App and Branch are deleted, and the Cognito clients go back to localhost only. No data is involved.

## Open Questions

- Exact PAT type/scopes Amplify accepts via CloudFormation (classic `repo` + `admin:repo_hook` vs fine-grained). Confirm against the Amplify docs during apply. This doesn't affect the design.
