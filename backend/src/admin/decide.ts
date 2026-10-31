import { toAdDetail, type AdStatus } from '../lib/ads';
import { updateIf } from '../lib/adsRepo';
import { handler, HttpError, json, parseBody } from '../lib/http';

const NEXT_STATUS: Record<string, AdStatus> = {
  approve: 'APPROVED',
  reject: 'REJECTED',
  request_info: 'NEEDS_INFO',
};

export const decide = handler(async (event) => {
  const { action, note } = parseBody(event);
  const status = typeof action === 'string' ? NEXT_STATUS[action] : undefined;
  if (!status) throw new HttpError(400, 'Action must be approve, reject or request_info.');

  const adminNote = typeof note === 'string' ? note.trim() : '';
  if (status !== 'APPROVED' && !adminNote) {
    throw new HttpError(400, 'A note is required to reject or request more info.');
  }
  if (adminNote.length > 1000) throw new HttpError(400, 'Note must be at most 1000 characters.');

  const now = Date.now();
  const result = await updateIf(
    event.pathParameters?.id ?? '',
    { status: 'PENDING' },
    { status, statusAt: now, updatedAt: now, adminNote: adminNote || undefined },
    // An approval clears any earlier info request
    status === 'APPROVED' ? ['adminNote'] : [],
  );
  if (!result.ok) {
    throw result.reason === 'conflict'
      ? new HttpError(409, 'Only pending ads can be moderated.')
      : new HttpError(404, 'Ad not found.');
  }
  return json(200, toAdDetail(result.ad));
});
