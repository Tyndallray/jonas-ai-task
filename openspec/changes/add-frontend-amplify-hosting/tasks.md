# Tasks

## 1. Prerequisites (operator, one-time)

- [x] 1.1 Store a GitHub PAT as the SSM SecureString `/jonas-ai-task/github-token` (us-east-1). Verify with `aws ssm describe-parameters --parameter-filters Key=Name,Values=/jonas-ai-task/github-token --profile afferenza`
- [x] 1.2 Confirm the CI deploy IAM user can manage Amplify and read the parameter (it is in the `Admin` group). Amplify GitHub App access to `Tyndallray/jonas-ai-task` is confirmed by the first dev deploy (3.1)

## 2. Amplify hosting in the backend stack

- [x] 2.1 In `backend/serverless.yml`, add the `IsHostedStage` condition, `FrontendApp` (inline monorepo build spec on Node 22, `AMPLIFY_MONOREPO_APP_ROOT`, SPA rewrite rule, token from SSM via a `NoEcho` stack parameter), and `FrontendBranch` (`BranchName: ${sls:stage}`, auto-build, the 7 `VITE_*` env vars). Add a conditional `FrontendUrl` output. Verify `serverless package --stage dev` succeeds and the template contains both resources, and that `--stage scratch` omits them
- [x] 2.2 Add the hosted site URL (root and `/admin`) to the user and admin Cognito client callback and sign-out URLs on hosted stages, keeping `${param:frontendUrl}`. Verify in the packaged template
- [x] 2.3 Update `backend/README.md` (prerequisites, `FrontendUrl` output, first-build `aws amplify start-job` command) and the CI/CD section of `frontend/README.md`. Verify the documented commands match the resources

## 3. Rollout and verification

- [ ] 3.1 Deploy dev (`npm run deploy -- --stage dev`, or merge to `dev`), run `aws amplify start-job --app-id <id> --branch-name dev --job-type RELEASE --profile afferenza`, then open `FrontendUrl`. Verify the feed loads, reloading `/ads/<id>` works, and user sign-in at `/` and admin sign-in at `/admin` both return to the hosted site
- [ ] 3.2 After `dev` is merged into `prod` and CI deploys the prod stack, start the first prod build and run the same smoke check against the prod `FrontendUrl`

## Workflow follow-up

- Archive the change once both stages are verified.
