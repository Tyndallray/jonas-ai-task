# Design

## Context

`backend/serverless.yml` defines `UserPool` (self-signup) and `AdminPool` (admin-created only) as raw CloudFormation resources. Neither sets a `VerificationMessageTemplate` or `LambdaConfig`, so Cognito's default sender (`COGNITO_DEFAULT`) sends its stock text. Cognito uses one verification template for both sign-up and forgot-password codes, so a static template can't give them different wording.

## Goals / Non-Goals

**Goals:** different, readable HTML for verification and reset codes in both pools, with no new infrastructure beyond one Lambda.

**Non-Goals:** a template engine, localization, per-pool branding, SES.

## Decisions

- **CustomMessage Lambda rather than `VerificationMessageTemplate`.** The trigger receives `triggerSource`, so it can tell `CustomMessage_SignUp` / `_ResendCode` / `_VerifyUserAttribute` (verify email) apart from `_ForgotPassword` (reset). A static template can't make that distinction.
- **One handler, `src/auth/customMessage.ts`, attached to both pools.** It sets `event.response.emailSubject` and `emailMessage` for the four sources above and returns the event unchanged for every other source (including `_AdminCreateUser`, so admin invites keep their default text).
- **Templates are plain TypeScript functions** that return an HTML string: a single-column table layout, inline styles only (email clients strip `<style>`), system font stack, and a large monospace code block. The code is inserted as `event.request.codeParameter` (the literal `{####}` placeholder Cognito replaces), so the Lambda never sees the real code. A short shared `layout(title, bodyHtml)` helper holds the header/footer so each email only writes its own copy. There are no dependencies.
- **Wiring through raw CloudFormation**, matching the existing resource style: add `LambdaConfig: { CustomMessage: !GetAtt CustomMessageLambdaFunction.Arn }` to both pools, plus two `AWS::Lambda::Permission` resources (`cognito-idp.amazonaws.com`, `SourceArn` set to each pool's ARN). The function has no `events:` entry, because the Serverless `cognitoUserPool` event would try to create or own a pool.
- **Expiry wording uses Cognito's fixed lifetimes:** the verification email says "within 24 hours" and the reset email says "within 1 hour". These lifetimes aren't configurable, so hardcoding them is safe.

## Risks / Trade-offs

- [Message over Cognito's 20,000-character limit, or `{####}` missing → Cognito falls back to the default message or errors] → keep the markup small; the test asserts that `{####}` is present.
- [Lambda error blocks sign-up/reset] → the handler is pure string building with no I/O; a cold start adds about 100ms.
- [`COGNITO_DEFAULT` sender limits (≈50 emails/day) and its `no-reply@verificationemail.com` from-address] → unchanged by this change; SES is a separate change.

## Migration Plan

Deploy with `npm run deploy` (profile `afferenza`). Updating `LambdaConfig` in place doesn't replace the pool. To roll back, remove `LambdaConfig` and redeploy, which brings the default emails back.
