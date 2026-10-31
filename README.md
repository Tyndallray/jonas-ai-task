# Marketplace Portal

A serverless classified-ads marketplace. Users sign up and post ads; admins moderate them; anyone can browse approved listings. An AI assist drafts the ad title and description from the uploaded photo.

It follows the brief's **request → respond → review** pattern. A seller submits an ad and an admin reviews it. The admin approves it, rejects it, or asks for more information, and the seller responds by editing and resubmitting (`PENDING → APPROVED | REJECTED | NEEDS_INFO → PENDING`). Business rules are enforced on the server: only a `NEEDS_INFO` ad can be edited, and a note is required for any decision other than approval.

## What I built

- **Public feed and ad detail.** Only approved ads are visible, newest first, with cursor pagination.
- **Seller flow.** Cognito sign-up and sign-in, post an ad with an image (presigned S3 upload straight from the browser), view your own ads with their status and admin notes, edit and resubmit, delete.
- **Moderation.** A separate admin pool with no self-signup and its own login at `/admin`. Admins approve, reject, or request more info. Status transitions use DynamoDB conditional writes, so two admins can't overwrite each other's decision.
- **AI autofill.** `POST /ads/describe` sends the uploaded image to Amazon Nova through the Bedrock Converse API and returns a suggested title and description that the seller can edit. It lives in one self-contained module, `backend/src/lib/describe.ts`:
  - **Structured output through a forced tool call.** The model must answer by calling a `submit_listing` tool against a JSON schema, never with free text.
  - **Guardrails in the prompt.** It describes only what is visible, never invents price or contact details, and ignores any instructions that appear inside the image (prompt-injection resistance).
  - **Fails safe.** If the model returns no usable listing, the endpoint returns a 422 and the seller fills the form in by hand. A Bedrock outage returns a 502. Lengths are capped on the server.
  - **Model is a single config value.** `BEDROCK_MODEL_ID` sets it, and any Converse vision model with tool use can be swapped in.
- **Polish.** Tailwind + shadcn/ui component kit, branded Cognito managed login, and branded verification and password-reset emails (CustomMessage Lambda).
- **Delivery.** All infrastructure is code in `serverless.yml`. `dev` and `prod` stages map one-to-one to branches. GitHub Actions typechecks, tests, and deploys the API. Amplify Hosting builds the frontend per branch and gets its env vars from the same stack, so a stage has no hand-copied config.

**Stack:** React 19, TypeScript, Vite, Tailwind, `react-oidc-context` (Auth Code + PKCE) · Serverless Framework v4, Lambda (Node 24, arm64), API Gateway with Cognito authorizers, DynamoDB, S3, Bedrock · GitHub Actions, Amplify.

## How to run it

Requires Node 22+, AWS credentials, and a Serverless Framework login.

```bash
# 1. Backend: deploys the API, table, bucket, and both Cognito pools
cd backend && npm install
npm run deploy          # serverless deploy
npm run info            # prints the stack outputs needed below

# 2. Frontend
cd ../frontend && npm install
cp .env.example .env.local   # fill in from the stack outputs
npm run dev                  # http://localhost:5173

# 3. Create an admin (admins can't self-register)
aws cognito-idp admin-create-user --user-pool-id <AdminPoolId> \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true
```

Tests: `npm test` in either package. More detail (endpoints, env var mapping, Amplify setup, CI) is in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).

## What I cut, and why

With a two-hour time box, I chose one vertical slice and shipped it all the way to a deployed cloud environment. I didn't spread the time thinly across the whole menu.

- **AI eval set and token, latency, and cost logging.** These are the most important gaps on the AI side. Right now the prompt is checked only by unit tests that mock Bedrock, and through manual runs. I prioritized getting the feature correct and safe (schema, guardrails, failure modes) before measuring it.
- **Schema validation of the model's output.** The JSON schema constrains the model, but on the server the result is only coerced and truncated. It isn't validated with a library such as Zod.
- **OpenAPI docs.** The endpoint table in [`backend/README.md`](backend/README.md) covers the API for now, and the Postman collection serves as the executable contract.
- **Audit logging.** Only the latest moderation decision and note are stored. There's no history of who did what.
- **Owners and blockers.** Any admin can review any pending ad. There's no assignment or escalation, which this domain didn't need at this size.
- **Docker Compose and database migrations.** I deployed to real AWS instead of a local container stack. DynamoDB is schemaless and the table is defined in CloudFormation, so the migrations item doesn't apply.
- **Breadth of tests.** I covered the critical paths: the ad lifecycle, the AI handler (both the success path and the no-suggestion path), the email templates, auth routing, and the API client. I verified the rest end to end by hand. There are no E2E tests.
- **Product scope:** search and categories, multiple images, notifications on moderation decisions, an admin user-management UI, and rate limiting on the AI endpoint.

## Next steps

1. **Evals in CI.** Build a small labelled image set: clear items, ambiguous photos, images with embedded instructions such as "ignore previous instructions", and non-product images. Score whether the output is schema-valid, whether it invents details (hallucination), and whether the guardrails hold. Fail the build when results regress.
2. **AI observability.** Log `usage` (input and output tokens) and `metrics.latencyMs` from each Converse response along with the model ID, and derive the cost of each request. Add a CloudWatch dashboard and alarms on latency and errors.
3. **Validate model output** with Zod, and treat a schema violation as a 422 instead of coercing the value.
4. **Rate-limit `/ads/describe`** with a per-user quota or an API Gateway usage plan. It's the only endpoint with real per-call cost.
5. **AI in the review loop.** For admins, triage each submission: flag missing details, policy risks, and mismatches between the image and the text. When an admin chooses "request info", draft the follow-up questions for them. This puts AI on the review side of the request → respond → review cycle, not just the submission side.
6. **Audit trail.** Store every moderation event (actor, action, note, timestamp) as an append-only history in DynamoDB.
7. **OpenAPI spec** generated from the handlers, plus Playwright E2E tests for the full submit → review → resubmit → approve loop against the `dev` stage.

---

# Evidence of my AI-driven process

**Artifacts in this repo**

- [`CLAUDE.md`](CLAUDE.md): the agent's standing rules (Conventional Commits, `dev` → `prod` branching).
- [`openspec/config.yaml`](openspec/config.yaml): constraints I added to keep the agent lean (short proposals, coarse tasks, happy-path tests only, "simplest working solution", no unrelated refactors).
- [`openspec/`](openspec): a proposal, design, spec, and task list for every change. Archived changes are in `openspec/changes/archive/`, and the specs they merged into are in `openspec/specs/`.
- **Git history:** each change was built on its own worktree branch and merged into `dev` through a PR. The commits map one-to-one to spec'd changes.

**How the approach evolved**

My first attempt didn't work, and I restarted. I had picked up OpenSpec, a spec-driven workflow that was new to me, and pointed it at an empty repo. It didn't go well for three reasons:

- **No patterns to anchor on.** In a greenfield repo the agent invents structure instead of following it, so the output was large and over-engineered.
- **Too much code to review.** It produced more code than I could read carefully, and I don't ship what I haven't reviewed.
- **Slow feedback.** Large, feature-sized prompts meant long thinking time, even with parallel sessions.

When I restarted, I made three changes:

1. **Seeded the patterns first.** I started with minimal boilerplate scaffolds (Serverless + TypeScript + DynamoDB, React + Cognito) so the agent had a concrete reference to copy, not a blank slate.
2. **Constrained the workflow** through `openspec/config.yaml`. I deliberately traded test exhaustiveness for speed and kept manual end-to-end verification as the safety net.
3. **Shrank the units of work.** I used small, targeted changes, each with its own spec, worktree, and PR. Each one needed less reasoning, was easier to review, and could run in parallel. The cost was more orchestration on my side, which was a good trade.

The result: the agent one-shot the core marketplace change. That freed my time for the parts that need judgment: UX polish, cloud deployment, CI/CD, auth hardening, and testing.

**Where AI helped, and where I had to correct it**

- **Helped:** infrastructure as code and the wiring between pieces. For example, it handled the Amplify ↔ Cognito ↔ API dependency ordering in one CloudFormation stack, the conditional status transitions, and the presigned upload flow.
- **Model choice:** the plan assumed Claude on Bedrock, but the AWS account couldn't enable Anthropic models. I switched to Amazon Nova through the provider-agnostic Converse API, so the model is a single config value (`BEDROCK_MODEL_ID`).
- **Leaked identifiers:** generated docs included the IAM user name and the Serverless org name. I caught both in review and removed them (`docs(backend): drop …` commits).
- **Error handling:** the frontend failed with an opaque error when the API returned non-JSON. I fixed it to show a clear error (`fix(frontend): …`).
- **Scope creep:** left alone, the agent over-builds. The config rules, the reference code, and small change sizes were the main levers that kept it in check.
