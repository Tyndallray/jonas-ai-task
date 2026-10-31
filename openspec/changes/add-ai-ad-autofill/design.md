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

3. **The Claude call goes through the Bedrock Mantle client.** It uses `AnthropicBedrockMantle` from `@anthropic-ai/bedrock-sdk` with `awsRegion: 'us-east-1'`, and credentials come from the Lambda role. The model comes from env `BEDROCK_MODEL_ID`, default `anthropic.claude-opus-5-5`, so a cheaper model (e.g. `anthropic.claude-haiku-5-5`) is a config change. Effort is `output_config.effort: 'low'`, since this is a simple, latency-sensitive task. Thinking stays at its default (it can't be disabled on Opus 5.5). The alternative, raw `bedrock-runtime` Converse, is the legacy path.

4. **Output uses structured JSON** (`output_config.format` with a JSON schema `{ title, description }`, `additionalProperties: false`). The handler still trims the values, cuts them to 100/2000 characters, and rejects empty values with a 422. A fixed system prompt tells the model to describe only the item, in plain marketplace style, with no price, contact details or claims it can't see. A `stop_reason` of `refusal` or `max_tokens`, or unparseable output, returns 422. Typed SDK API errors are logged and return 502.

5. **Frontend:** `AdForm` gets an optional `aiFill` prop, which only `NewAd` sets. The **Fill with AI** button is enabled when a file is selected. It calls the existing `upload(file)`, then `POST /ads/describe { imageKey }`, then sets title and description. The form remembers `{ file, key }` from that upload, so `handleSubmit` reuses the key when the file hasn't changed.

6. **Function config:** `describeAd` at `POST /ads/describe` with `userAuthorizer`, `timeout: 29`, and `memorySize: 1024`. The IAM statement allows the Bedrock invoke actions that the Mantle endpoint requires, on the chosen model/inference profile. Confirm the exact action and resource ARNs against AWS docs while implementing.

## Risks / Trade-offs

- [Text in the image (prompt injection) steers the output] → Output is schema-constrained, length-capped, only pre-fills an editable form, and still goes through admin moderation.
- [Latency of several seconds per call] → Low effort, a short `max_tokens` (~1024), and a spinner in the UI. The 29 s timeout gives plenty of headroom.
- [Cost per click on Opus-tier pricing] → The model ID is an env var, so switching to Haiku 5.5 needs no code change. The endpoint requires sign-in.
- [Benign photos occasionally refused] → They return 422 and the user types the fields themselves. The server-side `fallbacks` parameter isn't available on Bedrock. If refusals show up in practice, the SDK's client-side refusal-fallback middleware can be added later.
- [Orphaned S3 images when a user describes but never posts] → Accepted. Same as today's abandoned uploads, which are harmless.

## Migration Plan

1. Enable Claude model access in the Bedrock console (us-east-1, `afferenza` account).
2. Run `npm run deploy` in `backend/`, then deploy the frontend.
3. Rollback: remove the function from `serverless.yml` and redeploy. The UI button only calls the new endpoint, so nothing else depends on it.
