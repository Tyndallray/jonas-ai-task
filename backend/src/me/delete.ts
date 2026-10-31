import { deleteIfOwner } from '../lib/adsRepo';
import { claims, handler, HttpError, json } from '../lib/http';
import { deleteImage } from '../lib/images';

export const remove = handler(async (event) => {
  const { sub } = claims(event);
  const deleted = await deleteIfOwner(event.pathParameters?.id ?? '', sub);
  if (!deleted) throw new HttpError(404, 'Ad not found.');

  await deleteImage(deleted.imageKey);
  return json(204);
});
