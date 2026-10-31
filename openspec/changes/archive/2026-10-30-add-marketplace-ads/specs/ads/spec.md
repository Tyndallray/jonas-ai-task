# Spec Delta

## Purpose

Covers the life of a classified ad from its owner's point of view: posting, editing, resubmitting and deleting. Also covers how visitors browse and view approved ads.

## ADDED Requirements

### Requirement: Create an ad
A signed-in user SHALL be able to create an ad with these fields:
- title: 1-100 characters
- description: 1-2000 characters
- price: a non-negative amount with at most 2 decimals, in a single currency
- image: at most one, optional (JPEG, PNG or WebP, up to 5 MB)

A new ad MUST have status `PENDING`. It records the owner and the owner's email.

#### Scenario: Valid ad created
- **WHEN** a signed-in user submits a valid title, description, price and image
- **THEN** the ad is stored with status `PENDING` and returned to the user

#### Scenario: Invalid input
- **WHEN** a user submits an ad with an empty title or a negative price
- **THEN** the API responds 400 with a validation message and stores nothing

### Requirement: View my ads
A signed-in user SHALL be able to list all of their own ads in every status, newest first. Each ad MUST show its status and the latest admin note, if there is one.

#### Scenario: Owner sees own ads only
- **WHEN** a user opens "My ads"
- **THEN** only ads they created are listed, each with its status and any admin note

### Requirement: Edit and resubmit an ad that needs info
The owner SHALL be able to edit the fields and image of an ad in status `NEEDS_INFO`. Saving the edit MUST set the status back to `PENDING`. Ads in other statuses MUST NOT be editable.

#### Scenario: Resubmit after info request
- **WHEN** the owner edits a `NEEDS_INFO` ad and saves
- **THEN** the ad is updated and its status becomes `PENDING`

#### Scenario: Editing a non-NEEDS_INFO ad
- **WHEN** the owner tries to edit an ad that is `PENDING`, `APPROVED` or `REJECTED`
- **THEN** the API responds 409 and the ad is unchanged

### Requirement: Delete an ad
The owner SHALL be able to delete their ad in any status. Deleting removes the ad from every listing. Users MUST NOT be able to delete other users' ads.

#### Scenario: Owner deletes ad
- **WHEN** the owner deletes one of their ads
- **THEN** the ad no longer appears in "My ads" or the public feed

#### Scenario: Deleting someone else's ad
- **WHEN** a user tries to delete an ad they do not own
- **THEN** the API responds 403 or 404 and the ad remains

### Requirement: Public ad feed
Anyone, signed in or not, SHALL be able to browse `APPROVED` ads sorted by approval time, newest first. The feed returns 20 ads per page with a cursor for the next page. Each ad MUST include its title, price, image, approval date and the poster's email.

#### Scenario: Only approved ads shown
- **WHEN** a visitor opens the feed while `PENDING`, `REJECTED` and `APPROVED` ads all exist
- **THEN** only the `APPROVED` ads appear, newest first, each with the poster's email

#### Scenario: Load more
- **WHEN** more than 20 approved ads exist and the visitor requests the next page with the returned cursor
- **THEN** the next 20 older ads are returned, with no duplicates

### Requirement: Public ad detail
Anyone SHALL be able to view the full details of an `APPROVED` ad, including the poster's email. Requests for ads that are not approved MUST return 404 on the public endpoint.

#### Scenario: Viewing a pending ad publicly
- **WHEN** a visitor requests the public detail of a `PENDING` ad
- **THEN** the API responds 404
