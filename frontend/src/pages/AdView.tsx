import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatDate, formatPrice, type PublicAd } from '../lib/ads'
import { useApi } from '../lib/useApi'

export function AdView() {
  const { id } = useParams()
  const api = useApi()
  const [ad, setAd] = useState<PublicAd>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    api<PublicAd>(`/ads/${id}`).then(setAd, (err: Error) => setError(err.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (error) {
    return (
      <section>
        <p className="error">{error}</p>
        <Link to="/">Back to ads</Link>
      </section>
    )
  }
  if (!ad) return <p>Loading…</p>

  return (
    <section className="ad-view">
      <Link to="/">← All ads</Link>
      <h1>{ad.title}</h1>
      {ad.imageUrl && <img src={ad.imageUrl} alt="" />}
      <p className="price">{formatPrice(ad.price)}</p>
      <p className="description">{ad.description}</p>
      <p className="meta">
        Posted by <a href={`mailto:${ad.ownerEmail}`}>{ad.ownerEmail}</a> on {formatDate(ad.approvedAt)}
      </p>
    </section>
  )
}
