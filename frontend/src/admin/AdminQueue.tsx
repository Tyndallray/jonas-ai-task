import { useCallback, useEffect, useState } from 'react'
import { formatDate, formatPrice, type AdDetail, type Page } from '../lib/ads'
import { useApi } from '../lib/useApi'

type Action = 'approve' | 'reject' | 'request_info'

// Pending ads, oldest first, each with approve / reject / request-info
export function AdminQueue() {
  const api = useApi()
  const [ads, setAds] = useState<AdDetail[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(
    async (from: string | null) => {
      setLoading(true)
      try {
        const query = from ? `?cursor=${encodeURIComponent(from)}` : ''
        const page = await api<Page<AdDetail>>(`/admin/ads${query}`)
        setAds((prev) => (from ? [...prev, ...page.items] : page.items))
        setCursor(page.nextCursor)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [api],
  )

  useEffect(() => {
    void load(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section>
      <h1>Review queue</h1>
      {error && <p className="error">{error}</p>}
      {!loading && ads.length === 0 && <p>Nothing to review.</p>}
      <ul className="ad-list">
        {ads.map((ad) => (
          <ReviewItem
            key={ad.id}
            ad={ad}
            onDecided={() => setAds((prev) => prev.filter((a) => a.id !== ad.id))}
          />
        ))}
      </ul>
      {loading && <p>Loading…</p>}
      {cursor && !loading && (
        <button type="button" onClick={() => load(cursor)}>
          Load more
        </button>
      )}
    </section>
  )
}

function ReviewItem({ ad, onDecided }: { ad: AdDetail; onDecided: () => void }) {
  const api = useApi()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function decide(action: Action) {
    if (action !== 'approve' && !note.trim()) {
      setError('Add a note explaining the decision.')
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      await api(`/admin/ads/${ad.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      })
      onDecided()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <li className="ad-row review">
      {ad.imageUrl ? (
        <a href={ad.imageUrl} target="_blank" rel="noreferrer">
          <img src={ad.imageUrl} alt="" />
        </a>
      ) : (
        <div className="no-image" />
      )}
      <div>
        <h2>{ad.title}</h2>
        <p>
          {formatPrice(ad.price)} · {ad.ownerEmail} · submitted {formatDate(ad.statusAt)}
        </p>
        <p className="description">{ad.description}</p>
        {ad.adminNote && <p className="note">Previous note: {ad.adminNote}</p>}
        <textarea
          placeholder="Note for the poster (required to reject or request info)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={2}
        />
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button type="button" disabled={busy} onClick={() => decide('approve')}>
            Approve
          </button>
          <button type="button" disabled={busy} onClick={() => decide('request_info')}>
            Request info
          </button>
          <button type="button" disabled={busy} onClick={() => decide('reject')}>
            Reject
          </button>
        </div>
      </div>
    </li>
  )
}
