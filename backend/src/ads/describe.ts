import { IMAGE_KEY } from '../lib/ads';
import { suggestListing } from '../lib/describe';
import { claims, handler, HttpError, json, parseBody } from '../lib/http';
import { loadImageByKey, loadImageByUrl } from '../lib/images';

// Suggests a title and description from one image; never touches ads
export const describe = handler(async (event) => {
  claims(event);
  const { imageKey, imageUrl } = parseBody(event);
  if ((imageKey == null) === (imageUrl == null)) {
    throw new HttpError(400, 'Provide exactly one of imageKey or imageUrl.');
  }

  let image;
  if (imageKey != null) {
    if (typeof imageKey !== 'string' || !IMAGE_KEY.test(imageKey)) throw new HttpError(400, 'Invalid image.');
    image = await loadImageByKey(imageKey);
  } else {
    if (typeof imageUrl !== 'string' || !/^https:\/\//i.test(imageUrl) || !URL.canParse(imageUrl)) {
      throw new HttpError(400, 'Image URL must be a valid https URL.');
    }
    image = await loadImageByUrl(imageUrl);
  }

  return json(200, await suggestListing(image));
});
