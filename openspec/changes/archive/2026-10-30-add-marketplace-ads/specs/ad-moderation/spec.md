# Spec Delta

## Purpose

Gives admins a review queue and the decisions that control which ads go public: approve, reject, or request more information.

## ADDED Requirements

### Requirement: Review queue
An admin SHALL be able to list `PENDING` ads, oldest first, paginated. Each ad MUST show its full content and the poster's email.

#### Scenario: Admin opens the queue
- **WHEN** an admin opens the review queue
- **THEN** all `PENDING` ads are listed oldest first, and no ads in other statuses appear

### Requirement: Approve an ad
An admin SHALL be able to approve a `PENDING` ad. Approval sets the status to `APPROVED`, records the approval time, and makes the ad visible in the public feed.

#### Scenario: Ad approved
- **WHEN** an admin approves a `PENDING` ad
- **THEN** its status becomes `APPROVED` and it appears at the top of the public feed

### Requirement: Reject an ad
An admin SHALL be able to reject a `PENDING` ad with a required note. A rejected ad MUST NOT be public and cannot be resubmitted. The owner can see it and delete it.

#### Scenario: Ad rejected with note
- **WHEN** an admin rejects a `PENDING` ad with a note
- **THEN** the status becomes `REJECTED` and the owner sees the note in "My ads"

#### Scenario: Reject without note
- **WHEN** an admin rejects an ad with an empty note
- **THEN** the API responds 400 and the ad is unchanged

### Requirement: Request more information
An admin SHALL be able to mark a `PENDING` ad as `NEEDS_INFO` with a required note explaining what is missing. This lets the owner edit and resubmit the ad.

#### Scenario: Info requested
- **WHEN** an admin requests more info on a `PENDING` ad with a note
- **THEN** the status becomes `NEEDS_INFO`, the owner sees the note, and the ad becomes editable by the owner

### Requirement: Decisions only on pending ads
Moderation actions MUST apply only to ads in status `PENDING`.

#### Scenario: Acting on a non-pending ad
- **WHEN** an admin tries to approve, reject or request info on an ad that is not `PENDING`
- **THEN** the API responds 409 and the ad is unchanged
