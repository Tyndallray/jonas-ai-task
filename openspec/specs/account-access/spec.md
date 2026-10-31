# account-access Specification

## Purpose

Defines how marketplace users and admins prove who they are, and how the API separates public, user-only and admin-only operations.

## Requirements

### Requirement: User self-signup
The system SHALL let anyone create a user account in the user pool with an email address and password. The email MUST be verified before the account can sign in.

#### Scenario: New user signs up
- **WHEN** a visitor completes signup with a new email and a valid password and enters the emailed verification code
- **THEN** the account is confirmed and the visitor is signed in as a user

#### Scenario: Duplicate email
- **WHEN** a visitor signs up with an email that already has an account
- **THEN** signup is refused with an error saying the account exists

### Requirement: Admin accounts are operator-provisioned
The admin pool SHALL NOT allow self-signup. Admin accounts MUST be created by an operator outside the app. Admins sign in through a separate admin sign-in entry point.

#### Scenario: No admin signup offered
- **WHEN** a visitor opens the admin sign-in page
- **THEN** only sign-in is offered and no signup option is available

#### Scenario: Provisioned admin signs in
- **WHEN** an operator-created admin signs in with valid credentials
- **THEN** the admin reaches the admin area

### Requirement: API role separation
The API SHALL accept only user-pool tokens on user endpoints and only admin-pool tokens on admin endpoints. Public endpoints MUST work without a token.

#### Scenario: User token on admin endpoint
- **WHEN** a request with a user-pool token calls an admin endpoint
- **THEN** the API responds 401 or 403 and performs no action

#### Scenario: Anonymous call to a user endpoint
- **WHEN** a request without a token calls a user endpoint such as create ad
- **THEN** the API responds 401

#### Scenario: Anonymous call to public feed
- **WHEN** a request without a token calls the public ad feed
- **THEN** the API responds 200

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
