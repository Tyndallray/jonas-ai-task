import { toAdDetail, validateAdInput } from '../lib/ads';
import { getAd, updateIf } from '../lib/adsRepo';
import { claims, handler, HttpError, json, parseBody } from '../lib/http';
import { deleteImage } from '../lib/images';

// Edit + resubmit: only NEEDS_INFO ads, and saving sends the ad back to PENDING.
// The body replaces all editable fields; omitting imageKey removes the image.
export const update = handler(async (event) => {
  const { sub } = claims(event);
  const id = event.pathParameters?.id ?? '';
  const input = validateAdInput(parseBody(event));
  const previous = await getAd(id);
  const now = Date.now();

  const result = await updateIf(
    id,
    { status: 'NEEDS_INFO', ownerId: sub },
    { ...input, status: 'PENDING', statusAt: now, updatedAt: now },
    input.imageKey ? [] : ['imageKey'],
  );
  if (!result.ok) {
    throw result.reason === 'conflict'
      ? new HttpError(409, 'Only ads that need more info can be edited.')
      : new HttpError(404, 'Ad not found.');
  }

  if (previous?.imageKey && previous.imageKey !== input.imageKey) {
    await deleteImage(previous.imageKey);
  }
  return json(200, toAdDetail(result.ad));
});
