# Design

## Context

The backend is Serverless v4 (Lambda nodejs24.x, arm64, us-east-1) behind API Gateway REST with Cognito authorizers. Handlers are wrapped by `handler()` in `src/lib/http.ts`, which maps `HttpError` to status codes. Images already go straight to S3 via presigned POST (`POST /ads/image-upload` → key `ads/<uuid>.<ext>`). The bucket is public-read on `ads/*`, but the Lambda role can only Put/Delete today. The frontend `AdForm` is shared by "Post an ad" and "Edit". It uploads the selected file only on submit.

API Gateway caps integration time at 29 s, and Serverless defaults Lambda to 6 s.

## Goals / Non-Goals

**Goals:** a single-call endpoint that returns a schema-valid suggestion in a few seconds, and that reuses the existing upload flow so the browser sends the image only once.

**Non-Goals:** streaming the suggestion, caching results per image, using the AI on the edit form.

## Decisions

1. **Input is `{ imageKey }` or `{ imageUrl }` (exactly one), not a base64 body.** The UI already uploads to S3 for the ad, so describing by key avoids a second upload and the 10 MB API Gateway body limit. `imageUrl` covers API clients with images hosted elsewhere. Keys are validated with the existing `IMAGE_KEY` regex from `lib/ads.ts`.

2. **The Lambda loads the image bytes itself and sends them to the model as base64.** For a key it uses S3 `GetObject` (add `s3:GetObject` on `ads/*`). For a URL it uses `fetch` with a ~5 s timeout, `https` only, a check that the `content-type` is in `IMAGE_TYPES`, and a byte cap of `MAX_IMAGE_BYTES` while reading. This is better than passing the URL to the model: the same size and type rules apply to both sources, and no external fetch behavior depends on the model platform.

3. **The model is Amazon Nova 2 Lite, called through the Bedrock Converse API** (`@aws-sdk/client-bedrock-runtime`, credentials from the Lambda role). Claude was the first choice, but Anthropic model access couldn't be enabled on the account. Amazon's own models need no access request. The model comes from env `BEDROCK_MODEL_ID`, default `us.amazon.nova-2-lite-v1:0` (US cross-region inference profile, a low-cost multimodal model). Switching to `us.amazon.nova-pro-v1:0` is a config change. Settings: `temperature: 0.3`, `maxTokens: 1024`. A live smoke test returned in about 1.2 s.

4. **Structured output comes from a forced tool call.** A `submit_listing` tool takes a JSON schema `{ title, description }`, and `toolChoice: { tool }` makes the model call it. The handler still trims the values, cuts them to 100/2000 characters, and returns 422 when the tool call is missing or a value is empty (for example, content filtered or token limit hit). A fixed system prompt tells the model to describe only the item, in plain marketplace style, with no price, contact details or claims it can't see. `BedrockRuntimeServiceException` errors are logged and return 502.

5. **Frontend:** `AdForm` gets an optional `aiFill` prop, which only `NewAd` sets. The **Fill with AI** button is enabled when a file is selected. It calls the existing `upload(file)`, then `POST /ads/describe { imageKey }`, then sets title and description. The form remembers `{ file, key }` from that upload, so `handleSubmit` reuses the key when the file hasn't changed.

6. **Function config:** `describeAd` at `POST /ads/describe` with `userAuthorizer`, `timeout: 29`, and `memorySize: 1024`. IAM allows `bedrock:InvokeModel` on `inference-profile/us.amazon.nova-*` in the stack's region and on `foundation-model/amazon.nova-*` in every region (the US profile routes to any US region).

## Risks / Trade-offs

- [Text in the image (prompt injection) steers the output] → Output is schema-constrained, length-capped, only pre-fills an editable form, and still goes through admin moderation.
- [Latency of several seconds per call] → Low effort, a short `max_tokens` (~1024), and a spinner in the UI. The 29 s timeout gives plenty of headroom.
- [A lite model invents details it can't see (in the smoke test it named a material and dimensions)] → The prompt forbids unseen claims, the user edits before submitting, and admins moderate. If quality is poor, switch `BEDROCK_MODEL_ID` to Nova Pro.
- [Cost per click] → Nova 2 Lite is low-cost per token, and the endpoint requires sign-in.
- [Content filter blocks a benign photo] → It returns 422 and the user types the fields themselves.
- [Orphaned S3 images when a user describes but never posts] → Accepted. Same as today's abandoned uploads, which are harmless.

## Migration Plan

1. Run `npm run deploy` in `backend/`, then deploy the frontend.
2. Rollback: remove the function from `serverless.yml` and redeploy. The UI button only calls the new endpoint, so nothing else depends on it.
