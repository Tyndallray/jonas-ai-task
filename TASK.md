# Jonas Software – AI Team Take-Home Assignment

**Role:** Senior Software Engineer (AI Integration & Modernization)
**Time box:** ~2 hours of build time, followed by a ~1 hour interview to present and discuss it
**Submission:** link to a Git repository (public, or private with reviewer access) at least **24 hours before your scheduled interview**

---

## 1. What we're looking for

We want to see how you **execute an AI-driven software development lifecycle**: how you plan with AI agents, steer and verify their output, and land working software. We also want to see your awareness of **enterprise development practices**.

Two hours is short on purpose. **Pick a small slice and do it well.** Everything below is a menu of ideas, not a checklist. Choose what best shows your strengths, and feel free to go beyond the lists. What you chose to leave out, and why, is just as interesting to us.

---

## 2. The problem space

Many business processes follow the same pattern: one party sends **requests** for documents or information, the other party **responds**, and someone **reviews** each response until everything is complete. Pick a scenario you find relatable, for example:

- **Customer Onboarding Tracker:** a customer signs up, and your team needs to collect documents, track requests, assign owners, identify blockers, and monitor progress until onboarding is complete.
- Any similar scenario of your own

Build a small application around this or similar idea that includes **at least one AI feature**.

---

## 3. Ideas to pick from
Below is meant only as example, please feel free to swap in similar idea. 

### Application features (pick a minimal set)

- Create requests and attach responses (text or an uploaded document)
- Request status workflow (e.g., `Open → Responded → Accepted`) with a business rule, such as "cannot accept without a response"
- Group requests under vendors, customers, or categories
- Assign owners and flag blockers
- Simple UI, API with OpenAPI docs

### AI feature ideas (pick at least one)

- **Response triage:** assess a response against its request and return completeness, a summary, and risk flags
- **Auto-categorization** of requests or documents
- **Q&A over submitted documents**, with citations
- **Draft follow-up questions** when a response is incomplete

Aspects of AI engineering you might demonstrate:

- Structured output validated against a schema
- Tool calling
- Prompt engineering with guardrails (e.g., says "insufficient information" instead of guessing, resists instructions hidden in uploaded documents)
- Context management
- A small eval set, run automatically
- Latency, token, and cost logging
- A reusable, self-contained AI module

### Enterprise aspect ideas (pick a few)

- Containerization (e.g., `docker compose up`)
- Database migrations
- Feature branches, pull requests, and meaningful commit history
- CI pipeline running lint and tests
- Unit or end-to-end tests
- Environment-based configuration and no secrets in the repo
- Cloud deployment
- Security, access control, audit logging, error handling

If something matters to you but doesn't fit the time box, put it under "next steps" in your README.

---

## 4. Technology

Our primary solution is built on **Next.js (TypeScript)**. Feel free to use **Python** if you prefer. Alternatively, building with a **less familiar framework through AI-assisted development** is a welcome challenge in its own right. Any AI coding tools and any LLM provider are fine. Please don't commit API keys.

---

## 5. What to submit

- **Source code** in a Git repository
- **README:** how to run it, what you built, what you chose to cut, and your next steps
- **Evidence of your AI-driven process**, in whatever form fits how you work. For example: the spec or plan you started from and how it evolved, agent context files (`CLAUDE.md`, `AGENTS.md`, rules files), session transcript excerpts, and a few notes on where AI helped or got things wrong

---

## 6. The interview (~1 hour)

Most of the session is a discussion of your solution. Plan to spend about 10–15 minutes walking us through it, ideally with a short demo. A local demo is fine. We'll spend the rest of the time on your design choices, your AI-assisted workflow, and how you would take the solution further.

---

Questions are welcome at any point.
