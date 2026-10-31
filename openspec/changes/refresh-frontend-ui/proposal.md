# Proposal

## Why

The frontend looks unfinished and inconsistent. Every page styles raw HTML through one hand-written `index.css` that still uses the Vite starter's purple and favicon, so there are no shared UI elements. Sign-in sends users to Cognito's unstyled classic Hosted UI, which looks nothing like the homepage, so going from the feed to login feels like leaving the site.

## What Changes

- Add Tailwind CSS v4 and shadcn/ui. Shared primitives (Button, Card, Input, Textarea, Label, Badge, Alert, plus app components such as PageHeader, AdCard, EmptyState and Spinner) live in `src/components/ui` and `src/components`.
- Add a new marketplace theme: an emerald accent on neutral slate, with Inter as the font. Light and dark palettes are defined as CSS variable tokens, and dark mode follows the OS setting.
- Rebuild every user page and the admin area (header, feed, ad detail, post/edit form, my ads, profile, not found, review queue) on the shared components. Remove the bespoke CSS classes.
- Add an app logo/wordmark used in the header and on the login page, and replace the Vite favicon.
- Switch both Cognito pool domains to **Managed Login v2** and add `ManagedLoginBranding` (colors, logo, font weight) in `backend/serverless.yml`, so the user and admin sign-in pages match the app theme. The sign-in/sign-up flow and redirect URLs stay the same.

Out of scope:
- No custom in-app sign-in forms. Authentication still redirects to Cognito.
- No changes to API behavior, routes, or page copy beyond small layout text.

## Capabilities

### New Capabilities
- `ui-theme`: a consistent visual identity across the web app, the admin area and the Cognito sign-in pages, covering shared components, theme tokens, dark mode and branding.

### Modified Capabilities
_None. Account access, ads and moderation behavior is unchanged._

## Impact

- `frontend/`: new deps (`tailwindcss`, `@tailwindcss/vite`, shadcn/ui runtime deps such as `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, and the Radix primitives it pulls in), a `components.json` file, a `@/` path alias, a rewritten `index.css`, every page/component in `src/`, and `public/` assets.
- `backend/serverless.yml`: `ManagedLoginVersion: 2` on both `UserPoolDomain` resources, plus two `AWS::Cognito::ManagedLoginBranding` resources. These need a redeploy with the `afferenza` profile.
- Existing tests select by role and text, so they should keep passing as long as labels stay the same.
