# Tasks

## 1. Backend: describe endpoint

- [x] 1.1 Add `@aws-sdk/client-bedrock-runtime` to `backend/package.json`, plus a `src/lib/describe.ts` helper that loads image bytes (S3 `GetObject` for a key; capped, `https`-only `fetch` for a URL) and calls Amazon Nova via Converse with a forced tool call for structured output (design §2–4). Verify with `npm run typecheck`.
- [x] 1.2 Add the `src/ads/describe.ts` handler: validate exactly one of `imageKey`/`imageUrl`, return `{ title, description }`, and map errors to 400/422/502 per the spec. Verify with a vitest in `backend/test/describe.test.ts` (Bedrock client and image loader mocked) covering the key happy path and the no-listing → 422 case.
- [x] 1.3 Update `serverless.yml`: `describeAd` function (`POST /ads/describe`, `userAuthorizer`, `timeout: 29`, `memorySize: 1024`), the `BEDROCK_MODEL_ID` env var, and IAM for `s3:GetObject` on `ads/*` and `bedrock:InvokeModel` on the Nova inference profiles and foundation models. Verify that `npx serverless package --aws-profile afferenza` succeeds.

## 2. Frontend: Fill with AI

- [x] 2.1 Add an `aiFill` option to `AdForm`: a **Fill with AI** button that is enabled once a file is selected, uploads it, calls `/ads/describe`, fills title/description, shows a busy state and errors, and reuses the uploaded key on submit. Enable it only in `NewAd`. Verify with `npm run build` and by checking the form manually in `npm run dev`.

## 3. Deploy and verify

- [x] 3.1 Deploy the backend and post an ad end-to-end with **Fill with AI**. Verify that the fields are populated, the ad submits with the image, and only one S3 object is created. Note the endpoint in `backend/README.md`.
