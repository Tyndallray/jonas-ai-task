# Tasks

## 1. Tailwind, shadcn/ui and theme

- [x] 1.1 Add `tailwindcss` + `@tailwindcss/vite`, the `@/*` alias (tsconfig + vite) and `components.json`; init shadcn/ui and add button, card, input, textarea, label, badge, alert, separator, dropdown-menu — verify `npm run build` succeeds
- [x] 1.2 Replace `src/index.css` with Tailwind imports, emerald/slate light + dark tokens (media-query dark mode, `@custom-variant dark`), Inter via `@fontsource-variable/inter`; delete the old bespoke classes — verify a page renders themed in both OS color modes

## 2. Shared app components and branding

- [x] 2.1 Create the `Logo` SVG mark + wordmark, swap `public/favicon.svg`, set the `<title>` — verify the favicon and header logo show in the browser
- [x] 2.2 Build `AppHeader` (with `admin` badge variant), `PageHeader`, `AdCard`, `AdListItem`, `StatusBadge`, `EmptyState`, `LoadingState` in `src/components` — verify `npm run build` and `npm run lint` pass

## 3. Rebuild pages on shared components

- [x] 3.1 Rework `Layout`, `Home`, `AdView`, `AdForm`, `NewAd`, `EditAd`, `MyAds`, `Profile`, `NotFound`, `ProtectedRoute` messages and the `App` loading state on the shared components (keep all button/link labels) — verify `npm test` still passes
- [x] 3.2 Rework `AdminApp`/`AdminQueue` on `AppHeader admin` + `AdListItem` — verify the review queue matches the user pages and shows the Admin marker
- [x] 3.3 Check the feed, my ads and review queue at 360px and desktop, light and dark — verify no horizontal scroll and single-column stacking on mobile

## 4. Branded Cognito sign-in

- [ ] 4.1 In `backend/serverless.yml` set `UserPoolTier: ESSENTIALS` on both pools and `ManagedLoginVersion: 2` on both domains; add a `ManagedLoginBranding` per pool/client using `backend/branding/managed-login.json` (exported from the console editor, theme colors) and the logo SVG asset — verify `serverless package` succeeds
- [ ] 4.2 Deploy with `AWS_PROFILE=afferenza` and open both sign-in pages from the app — verify user sign-in/sign-up and admin sign-in show the logo and emerald accent, admin has no signup, and both redirect back to the app after sign-in

## Workflow follow-up

- Commit with Conventional Commits (e.g. `feat(frontend): ...`, `feat(backend): ...`) on a branch merged into `dev`.
- Archive the change after review.
