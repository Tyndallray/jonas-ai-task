# Proposal

## Why

Both Cognito pools send Cognito's stock plain-text emails ("Your verification code is 123456") with a generic subject. They look like spam, give no context, and don't say which app sent them. Sign-up verification and password-reset emails are the first thing a new or locked-out user sees, so they should look like they come from Jonas AI.

## What Changes

- Add a Cognito **CustomMessage** Lambda trigger in `backend/` that returns a branded HTML email (with a plain, readable layout) and a clear subject for:
  - sign-up verification and resend-code (`CustomMessage_SignUp`, `CustomMessage_ResendCode`)
  - forgot-password / reset code (`CustomMessage_ForgotPassword`)
  - email change verification (`CustomMessage_VerifyUserAttribute`, which uses the same template as sign-up)
- Wire the trigger to both the user pool and the admin pool. Admins can reset their password too.
- Each email states why it was sent, shows the code prominently, says that it expires, and says what to do if the recipient didn't request it.
- Any other trigger source is passed through unchanged, so Cognito's default message still applies.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `account-access`: adds a requirement that verification and password-reset emails are branded and specific to their purpose.

## Impact

- `backend/serverless.yml`: new `customMessage` function, `LambdaConfig.CustomMessage` on `UserPool` and `AdminPool`, plus Lambda invoke permissions for Cognito.
- `backend/src/auth/customMessage.ts` (new) with the email templates, and one focused test.
- No API, frontend or data changes. Emails keep using Cognito's default sender (no SES).

**Out of scope**
- Admin invitation emails (`CustomMessage_AdminCreateUser`), MFA/SMS messages, and setting up SES or a custom from-address.
