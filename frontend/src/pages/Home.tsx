import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatPrice, type Page, type PublicAd } from '../lib/ads'
import { useApi } from '../lib/useApi'

// Public feed: approved ads, newest first, with "load more"
export function Home() {
  const api = useApi()
  const [ads, setAds] = useState<PublicAd[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()

  const load = useCallback(
    async (from: string | null) => {
      setLoading(true)
      try {
        const query = from ? `?cursor=${encodeURIComponent(from)}` : ''
        const page = await api<Page<PublicAd>>(`/ads${query}`)
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
    // Load the first page once; the token refreshing should not reset the feed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section>
      <h1>Latest ads</h1>
      {error && <p className="error">{error}</p>}
      {!loading && !error && ads.length === 0 && <p>No ads yet.</p>}
      <ul className="ad-grid">
        {ads.map((ad) => (
          <li key={ad.id} className="ad-card">
            <Link to={`/ads/${ad.id}`}>
              {ad.imageUrl ? <img src={ad.imageUrl} alt="" /> : <div className="no-image" />}
              <h2>{ad.title}</h2>
            </Link>
            <p className="price">{formatPrice(ad.price)}</p>
            <p className="meta">
              <a href={`mailto:${ad.ownerEmail}`}>{ad.ownerEmail}</a> · {formatDate(ad.approvedAt)}
            </p>
          </li>
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
