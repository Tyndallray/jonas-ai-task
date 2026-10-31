# Spec Delta

## Purpose

Defines how the marketplace frontend is hosted for each stage: which branch deploys where, how the hosted site gets its configuration, and that sign-in works from the hosted URL.

## ADDED Requirements

### Requirement: Branch deploys to its stage
The `dev` and `prod` stages SHALL each have a hosted frontend at a public HTTPS URL. A push to a branch MUST rebuild and publish the frontend only for the stage with that name. No other stage gets hosting.

#### Scenario: Push to dev
- **WHEN** a commit is pushed to `dev`
- **THEN** the dev site rebuilds from that commit and the prod site is unchanged

#### Scenario: Push to prod
- **WHEN** `dev` is merged into `prod`
- **THEN** the prod site rebuilds from the `prod` branch

### Requirement: Hosted site uses its stage's backend
A hosted frontend SHALL call the API and Cognito pools of its own stage, set automatically from that stage's backend deployment with no manual env file.

#### Scenario: Dev site talks to dev API
- **WHEN** a visitor loads the public feed on the dev site
- **THEN** the feed comes from the dev stage API, not prod

### Requirement: Deep links load the app
Any app route opened directly on the hosted URL SHALL load the SPA, which renders that route. Static assets MUST still be served as files.

#### Scenario: Refresh on an ad page
- **WHEN** a visitor opens `<site>/ads/<id>` directly or reloads it
- **THEN** the ad detail page renders instead of a 404

### Requirement: Sign-in works on the hosted site
User sign-in/sign-out from the hosted root and admin sign-in/sign-out from `/admin` SHALL complete and return to the hosted site. Local development at `http://localhost:5173` MUST keep working against the same stage.

#### Scenario: User signs in on the hosted site
- **WHEN** a user signs in from the hosted dev site
- **THEN** Cognito redirects back to the hosted dev site and the user is signed in

#### Scenario: Admin signs in on the hosted site
- **WHEN** an admin signs in at `<site>/admin`
- **THEN** Cognito redirects back to `<site>/admin` and the review queue loads
