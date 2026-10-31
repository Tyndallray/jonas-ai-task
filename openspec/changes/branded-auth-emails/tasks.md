# Tasks

## 1. CustomMessage handler

- [ ] 1.1 Add `backend/src/auth/customMessage.ts`: a shared inline-styled HTML `layout`, verification and password-reset templates using `event.request.codeParameter`, a subject per purpose, and passthrough for other trigger sources. Verify with `npm run typecheck`.
- [ ] 1.2 Add `backend/test/customMessage.test.ts` covering `CustomMessage_SignUp` and `CustomMessage_ForgotPassword` (the subject differs, the body contains `{####}` and stays under 20,000 chars) and an untouched `CustomMessage_AdminCreateUser`. Verify with `npm test`.

## 2. Wire to Cognito

- [ ] 2.1 In `backend/serverless.yml`, add a `customMessage` function (no events), `LambdaConfig.CustomMessage` on `UserPool` and `AdminPool`, and an `AWS::Lambda::Permission` for each pool. Verify with `npx serverless package` succeeding.
- [ ] 2.2 Deploy (`npm run deploy`), then trigger a sign-up and a forgot-password on the user pool and check that both branded emails arrive and their codes work. Note the result in `backend/README.md` next to the Cognito section.
