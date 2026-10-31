# Spec Delta

## Purpose

Lets sellers generate a suggested ad title and description from a photo of the item, so they don't have to write them by hand.

## ADDED Requirements

### Requirement: Describe an item from an image
The API SHALL let a signed-in user submit one image, either as an ad image key they uploaded or as a public `https` URL to a JPEG, PNG or WebP of at most 5 MB. It MUST return a suggested `title` (1-100 characters) and `description` (1-2000 characters) for the item shown. It MUST NOT create or change any ad.

#### Scenario: Suggestion from an uploaded image
- **WHEN** a signed-in user calls the describe endpoint with the key of an image they just uploaded
- **THEN** the API responds 200 with a `title` and `description` within the ad field limits

#### Scenario: Suggestion from an image URL
- **WHEN** a signed-in user calls the describe endpoint with a public `https` URL to a supported image
- **THEN** the API responds 200 with a `title` and `description` within the ad field limits

#### Scenario: Unauthenticated request
- **WHEN** the describe endpoint is called without a valid user token
- **THEN** the API responds 401 and no model call is made

### Requirement: Reject unusable images
The API MUST respond 400 with a message when the request names neither or both image sources, the key or URL is malformed, the URL isn't `https`, or the fetched image isn't a supported type or is larger than 5 MB.

#### Scenario: Invalid input
- **WHEN** a user calls the describe endpoint with an `http` URL or a non-image file
- **THEN** the API responds 400 with a validation message

### Requirement: Report when no suggestion can be made
When the model can't produce a usable title and description (for example, it declines or its output is invalid), the API MUST respond 422 with a message telling the user to fill in the fields themselves. Model or service failures MUST respond 502 without exposing internal details.

#### Scenario: Model declines
- **WHEN** the model declines to describe the image
- **THEN** the API responds 422 with a message and no suggestion

### Requirement: Fill with AI on the post-an-ad form
The "Post an ad" form SHALL offer a **Fill with AI** action that is enabled once an image is selected. Using it MUST replace the title and description fields with the suggestion, leave them editable, and show progress while it runs. Errors MUST appear on the form without clearing the user's input. Submitting afterwards MUST reuse the already-uploaded image.

#### Scenario: User fills the form from a photo
- **WHEN** a user selects an image on "Post an ad" and clicks **Fill with AI**
- **THEN** the title and description fields are populated with the suggestion and can still be edited before submitting

#### Scenario: Suggestion fails
- **WHEN** the describe request fails
- **THEN** an error message is shown and the existing title and description are kept
