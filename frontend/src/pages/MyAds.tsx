import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, formatPrice, STATUS_LABELS, type AdDetail } from '../lib/ads'
import { useApi } from '../lib/useApi'

export function MyAds() {
  const api = useApi()
  const [ads, setAds] = useState<AdDetail[]>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    api<{ items: AdDetail[] }>('/me/ads').then(
      (res) => setAds(res.items),
      (err: Error) => setError(err.message),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function remove(ad: AdDetail) {
    if (!window.confirm(`Delete "${ad.title}"?`)) return
    try {
      await api(`/me/ads/${ad.id}`, { method: 'DELETE' })
      setAds((prev) => prev?.filter((a) => a.id !== ad.id))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section>
      <h1>My ads</h1>
      <p>
        <Link to="/ads/new">Post an ad</Link>
      </p>
      {error && <p className="error">{error}</p>}
      {!ads && !error && <p>Loading…</p>}
      {ads?.length === 0 && <p>You haven't posted any ads yet.</p>}
      <ul className="ad-list">
        {ads?.map((ad) => (
          <li key={ad.id} className="ad-row">
            {ad.imageUrl ? <img src={ad.imageUrl} alt="" /> : <div className="no-image" />}
            <div>
              <h2>
                {ad.status === 'APPROVED' ? <Link to={`/ads/${ad.id}`}>{ad.title}</Link> : ad.title}
              </h2>
              <p>
                {formatPrice(ad.price)} · posted {formatDate(ad.createdAt)}
              </p>
              <span className={`status status-${ad.status.toLowerCase()}`}>
                {STATUS_LABELS[ad.status]}
              </span>
              {ad.adminNote && <p className="note">Admin note: {ad.adminNote}</p>}
            </div>
            <div className="actions">
              {ad.status === 'NEEDS_INFO' && <Link to={`/my-ads/${ad.id}/edit`}>Edit & resubmit</Link>}
              <button type="button" onClick={() => remove(ad)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
