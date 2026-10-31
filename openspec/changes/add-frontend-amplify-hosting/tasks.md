# Tasks

## 1. Prerequisites (operator, one-time)

- [ ] 1.1 Create a GitHub PAT that Amplify accepts (confirm the scopes in the Amplify docs) and store it with `aws secretsmanager create-secret --name jonas-ai-task/github-token --secret-string <pat> --profile afferenza --region us-east-1`. Verify with `aws secretsmanager describe-secret --secret-id jonas-ai-task/github-token --profile afferenza`
- [ ] 1.2 Confirm the Amplify GitHub App has access to `Tyndallray/jonas-ai-task`, and grant the CI deploy IAM user `amplify:*` plus `secretsmanager:GetSecretValue` on that secret. Verify by inspecting the user's attached policy

## 2. Amplify hosting in the backend stack

- [ ] 2.1 In `backend/serverless.yml`, add the `IsHostedStage` condition, `FrontendApp` (inline monorepo build spec on Node 22, `AMPLIFY_MONOREPO_APP_ROOT`, SPA rewrite rule, token from Secrets Manager), and `FrontendBranch` (`BranchName: ${sls:stage}`, auto-build, the 7 `VITE_*` env vars). Add a conditional `FrontendUrl` output. Verify `serverless package --stage dev` succeeds and the template contains both resources, and that `--stage scratch` omits them
- [ ] 2.2 Add the hosted site URL (root and `/admin`) to the user and admin Cognito client callback and sign-out URLs on hosted stages, keeping `${param:frontendUrl}`. Verify in the packaged template
- [ ] 2.3 Update `backend/README.md` (prerequisites, `FrontendUrl` output, first-build `aws amplify start-job` command) and the CI/CD section of `frontend/README.md`. Verify the documented commands match the resources

## 3. Rollout and verification

- [ ] 3.1 Deploy dev (`npm run deploy -- --stage dev`, or merge to `dev`), run `aws amplify start-job --app-id <id> --branch-name dev --job-type RELEASE --profile afferenza`, then open `FrontendUrl`. Verify the feed loads, reloading `/ads/<id>` works, and user sign-in at `/` and admin sign-in at `/admin` both return to the hosted site
- [ ] 3.2 After `dev` is merged into `prod` and CI deploys the prod stack, start the first prod build and run the same smoke check against the prod `FrontendUrl`

## Workflow follow-up

- Archive the change once both stages are verified.
