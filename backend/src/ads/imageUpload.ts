import { IMAGE_TYPES } from '../lib/ads';
import { claims, handler, HttpError, json, parseBody } from '../lib/http';
import { presignImageUpload } from '../lib/images';

export const imageUpload = handler(async (event) => {
  claims(event);
  const { contentType } = parseBody(event);
  if (typeof contentType !== 'string' || !(contentType in IMAGE_TYPES)) {
    throw new HttpError(400, 'Image must be JPEG, PNG or WebP.');
  }
  return json(200, await presignImageUpload(contentType));
});
