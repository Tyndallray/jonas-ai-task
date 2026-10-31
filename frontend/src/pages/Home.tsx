import { useCallback, useEffect, useState } from 'react'
import { AdCard } from '@/components/AdCard'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorAlert, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import type { Page, PublicAd } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

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
      <PageHeader title="Latest ads" description="Fresh listings from the community, newest first." />
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {!loading && !error && ads.length === 0 && (
        <EmptyState title="No ads yet." description="Approved ads will show up here." />
      )}
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ads.map((ad) => (
          <li key={ad.id}>
            <AdCard ad={ad} />
          </li>
        ))}
      </ul>
      {loading && <LoadingState />}
      {cursor && !loading && (
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => load(cursor)}>
            Load more
          </Button>
        </div>
      )}
    </section>
  )
}
