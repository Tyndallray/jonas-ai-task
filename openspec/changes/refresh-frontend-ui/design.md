# Design

## Context

- Frontend: Vite 8, React 19, TypeScript ~7, react-router 7, Vitest with Testing Library. All styling lives in one `src/index.css` with ad-hoc classes (`.ad-card`, `.ad-row`, `.status-*`, `.form`, …). There is no component layer.
- Auth: `react-oidc-context` redirects to the Cognito domain of each pool (user, admin). The domains have no `ManagedLoginVersion`, so they serve the unstyled classic Hosted UI. The pools have no `UserPoolTier`.
- Tests select elements by role and visible text, not by class.

## Goals / Non-Goals

**Goals:** one component kit and one token set used everywhere, and Cognito pages branded from the same tokens.

**Non-Goals:** a theme toggle UI (dark mode follows the OS only), custom auth screens, Storybook or visual-regression tooling.

## Decisions

1. **Tailwind v4 through `@tailwindcss/vite`, configured in CSS.** Use no `tailwind.config.js`. Tokens live in `index.css` (`@import "tailwindcss"`, `@theme inline`). This matches the current shadcn/ui setup for Vite. *Alt:* Tailwind v3 with a JS config, which is legacy and not what shadcn now generates.

2. **shadcn/ui components copied into `src/components/ui`.** Add the `@/*` path alias in `tsconfig.app.json` (`paths` only; TS 7 drops `baseUrl`) and in `vite.config.ts` `resolve.alias`. Install only what the pages use: button, card, input, textarea, label, badge, alert, separator, dropdown-menu (header user menu on mobile). If the shadcn CLI fails under TS 7, copy the component sources by hand; they are plain TSX. *Alt:* daisyUI, which is less flexible, or hand-rolled primitives, which means more work and less accessibility.

3. **App-level components built on the primitives.** These are `AppHeader` (shared by `Layout` and `AdminShell`, with an `admin` prop that shows an "Admin" badge), `Logo`, `PageHeader` (title, description, actions), `AdCard` (feed), `AdListItem` (my ads and review queue, with an actions slot), `StatusBadge` (maps `AdStatus` to badge variants), `EmptyState`, and `LoadingState`. Pages compose these and no longer use raw class strings for shared patterns.

4. **Theme tokens.** Use shadcn's CSS variable names (`--background`, `--foreground`, `--primary`, `--muted`, `--border`, `--ring`, `--destructive`, plus `--success` and `--warning` for status badges) in OKLCH. Primary is emerald-600 (light) and emerald-500 (dark). The base is slate. Radius is `0.625rem`. The font is Inter, loaded with `@fontsource-variable/inter` so the app needs no external CDN.

5. **Dark mode by media query.** Define the dark tokens under `@media (prefers-color-scheme: dark)` and add `@custom-variant dark (@media (prefers-color-scheme: dark));` so shadcn's `dark:` utilities still work. *Alt:* the class-based `.dark` toggle, which needs JS and a toggle UI that nobody asked for.

6. **Logo.** A small inline SVG mark (a tag/price-label glyph in emerald) next to the "Jonas Market" wordmark. The same SVG file is `public/favicon.svg` and the Cognito logo asset.

7. **Cognito branding in `serverless.yml`.**
   - Set `UserPoolTier: ESSENTIALS` on both pools. Managed Login branding needs Essentials or higher, and Essentials is already the default for new pools, so this only makes it explicit.
   - Set `ManagedLoginVersion: 2` on both `UserPoolDomain` resources.
   - Add one `AWS::Cognito::ManagedLoginBranding` per pool/client with `UseCognitoProvidedValues: false`, `Settings` (the primary button color, link color, page background and focus ring taken from the theme tokens as hex, plus light/dark color modes) and `Assets` (the logo as `PAGE_HEADER_LOGO` and `FORM_LOGO`, base64 SVG).
   - Create the settings JSON by styling one pool in the console branding editor and exporting it with `aws cognito-idp describe-managed-login-branding --profile afferenza`, then trim it to the overrides. Keep it in `backend/branding/managed-login.json`, loaded with `${file(...)}`, and use it for both pools. *Alt:* classic Hosted UI CSS (`UICustomizationAttachment`), which only allows a limited set of CSS classes and is being superseded.

## Risks / Trade-offs

- [With Managed Login v2, a domain whose app client has no branding style shows an error page] → Deploy the domain version change and the branding resources together in one stack update. Verify both sign-in URLs after deploying.
- [The Essentials tier is billed above its free MAU allowance] → Acceptable for this app's scale. Note it in the PR.
- [The `ManagedLoginBranding` settings schema is large and poorly documented] → Generate it with the console export as described above. Don't hand-write it.
- [shadcn/Radix adds bundle weight] → Install only the components that are used.

## Migration Plan

Deploy the backend (`AWS_PROFILE=afferenza`), then the frontend. To roll back, revert the commit. Removing `ManagedLoginVersion` returns the domains to the classic Hosted UI.
