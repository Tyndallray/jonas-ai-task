# Spec Delta

## Purpose

Gives the marketplace one consistent visual identity across the web app, the admin area and the hosted sign-in pages, so users never feel they have left the product.

## ADDED Requirements

### Requirement: Shared UI elements across pages
Every page in the web app and the admin area SHALL render buttons, form fields, cards, status badges, alerts and page headings with the same shared elements. Each element type MUST look identical on every page where it appears.

#### Scenario: Buttons look the same everywhere
- **WHEN** a user compares the "Sign in / Sign up" button in the header, the "Load more" button on the feed and the submit button on the post-an-ad form
- **THEN** all three use the same shape, typography and color treatment for their variant

#### Scenario: Admin area matches the user site
- **WHEN** an admin opens the review queue
- **THEN** ad items, buttons, inputs and status badges look like the ones on the user pages, and a visible "Admin" marker in the header tells the two areas apart

### Requirement: Marketplace theme
The app SHALL use one documented theme: an emerald accent on a neutral slate base, a single sans-serif typeface, and a consistent spacing and radius scale. No leftover starter-template colors or favicon MAY remain.

#### Scenario: Branded header and favicon
- **WHEN** a visitor opens any page
- **THEN** the header shows the app logo/wordmark, the browser tab shows the app favicon, and primary actions use the emerald accent

### Requirement: Dark mode follows the system
The app SHALL show a dark palette when the operating system prefers dark mode and a light palette otherwise. Text and controls MUST stay readable in both.

#### Scenario: System dark mode
- **WHEN** a visitor whose OS prefers dark mode opens the feed
- **THEN** the page renders with dark backgrounds and light text using the same accent and components

### Requirement: Sign-in pages match the app theme
The hosted sign-in, sign-up and password-reset pages for both users and admins SHALL show the app logo, accent color and background styling of the app theme. The authentication flow and redirects MUST be unchanged.

#### Scenario: User goes from homepage to sign-in
- **WHEN** a visitor clicks "Sign in / Sign up" on the homepage
- **THEN** the sign-in page they reach shows the same logo and emerald accent as the homepage, and after signing in they return to the app as before

#### Scenario: Admin sign-in is branded
- **WHEN** an admin opens `/admin` while signed out
- **THEN** the admin sign-in page shows the same branding and still offers no signup option

### Requirement: Responsive layout
All pages SHALL be usable from phone width (360px) up to desktop with no horizontal scrolling. Ad grids and lists MUST collapse to a single column on narrow screens.

#### Scenario: Feed on a phone
- **WHEN** the feed is viewed at 360px width
- **THEN** ad cards stack in one column and the header navigation stays reachable
