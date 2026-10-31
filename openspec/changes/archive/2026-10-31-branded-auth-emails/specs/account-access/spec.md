# Spec Delta

## ADDED Requirements

### Requirement: Branded verification and password-reset emails
Verification-code and password-reset emails from the user pool and the admin pool SHALL be formatted HTML emails branded as Jonas AI. Each SHALL have a subject that names its purpose and SHALL show the one-time code prominently. The body SHALL say why the email was sent, that the code expires, and that the recipient can ignore it if they did not request it. Other Cognito messages keep their default content.

#### Scenario: Sign-up verification email
- **WHEN** a visitor signs up or asks for the verification code to be resent
- **THEN** they receive a Jonas AI–branded email whose subject identifies it as an email verification, with the verification code shown prominently

#### Scenario: Password reset email
- **WHEN** a user or an admin requests a password reset
- **THEN** they receive a Jonas AI–branded email whose subject identifies it as a password reset, with the reset code shown prominently and a note to ignore it if they did not request it

#### Scenario: Code still works
- **WHEN** the recipient enters the code from a branded email in the normal sign-up confirmation or password-reset flow
- **THEN** the code is accepted exactly as it was with the default email
