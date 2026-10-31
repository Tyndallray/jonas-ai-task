# Proposal

## Why

Writing a good title and description is the slowest part of posting an ad. Most sellers already have a photo of the item, and a vision model can draft both fields from it. That gets ads posted faster and makes listings more consistent.

## What Changes

- New authenticated endpoint `POST /ads/describe`. It takes an image as either an already-uploaded ad image key or a public `https` image URL. It returns a suggested `title` and `description` that fit the existing ad field limits.
- The backend calls Claude on Amazon Bedrock (us-east-1, `afferenza` profile) with the image and a fixed prompt, and asks for structured JSON output.
- The "Post an ad" form gets a **Fill with AI** button, enabled once an image is selected. It uploads the image the usual way, calls the endpoint, and fills the title and description, which the user can still edit. The uploaded image is reused when the ad is submitted, so it isn't uploaded twice.
- New Lambda IAM permissions (Bedrock invoke, S3 read of `ads/*`), a longer timeout for this function, and a new SDK dependency.

**Out of scope**
- Suggesting a price or category, and accepting raw base64 uploads in the request body.
- The "Edit and resubmit" form, rate limiting and usage quotas beyond the existing sign-in requirement.

## Capabilities

### New Capabilities
- `ad-autofill`: AI-generated title and description suggestions from an item image, via the API and the ad form.

### Modified Capabilities
None. Ad creation rules and validation are unchanged, and suggestions are only pre-filled form values.

## Impact

- **Backend**: new `src/ads/describe.ts` handler and a Bedrock helper in `src/lib/`. `serverless.yml` gets a new function, IAM statements and a model-ID env var. Adds the `@anthropic-ai/bedrock-sdk` dependency.
- **Frontend**: `AdForm.tsx` (button, upload reuse), `NewAd.tsx` (turn the option on), and a small `describe` API call.
- **AWS**: Claude model access must be enabled in Bedrock for the account in us-east-1. Each request costs per-token model usage.
