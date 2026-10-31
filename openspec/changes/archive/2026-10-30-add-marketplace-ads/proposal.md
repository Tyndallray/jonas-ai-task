# Proposal

## Why

The project is a marketplace where people post classified ads and admins moderate them. The current scaffold is a Todo API and a single-pool login shell, so the product behaviour needs to be agreed before building it.

## What Changes

- Users sign up and sign in through a Cognito **user pool** using email and password, with email verification.
- Admins sign in through a **separate admin pool**. Admins cannot sign up; their accounts are created by an operator.
- Signed-in users can **create** an ad with a title, description, price and one optional image. A new ad starts as `PENDING`.
- Users can **view their own ads** in every status, including any admin note.
- Users can **delete** their own ads.
- Users can **edit and resubmit** an ad that an admin flagged `NEEDS_INFO`. The ad then goes back to `PENDING`.
- Admins see a queue of pending ads. They can **approve** an ad, **reject** it, or **request more info**. Rejecting and requesting info both require a note.
- Anyone, signed in or not, can browse **approved ads newest first**, 20 per page with "load more". Each ad shows the poster's email.
- **BREAKING**: the scaffold's Todo endpoints and table are removed.

## Capabilities

### New Capabilities
- `account-access`: user self-signup and sign-in, admin sign-in through a separate pool with no signup, and role separation on the API.
- `ads`: the ad lifecycle from the owner's side (create, list own, edit and resubmit, delete, image upload), plus the public feed and ad detail.
- `ad-moderation`: the admin review queue and the approve, reject and request-info decisions.

### Modified Capabilities
- None. No specs exist yet.

## Impact

- `backend/serverless.yml`:
  - two Cognito pools and their app clients
  - two API Gateway authorizers
  - an Ads DynamoDB table with GSIs
  - an S3 image bucket
- `backend/src/`: new `ads/` and `admin/` handlers; `todos/` is removed.
- `frontend/`: feed, ad detail, "My ads", create and edit pages, an admin area, and a second OIDC client for admins.

## Out of scope

- Payments, messaging between users, search and filters, categories, and multiple images per ad.
- Admin user management UI. Admins are created with the AWS CLI or console.
