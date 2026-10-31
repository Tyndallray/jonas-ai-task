import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdListItem } from '@/components/AdListItem'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorAlert, LoadingState, NoteCallout } from '@/components/states'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate, formatPrice, type AdDetail } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

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
    <section className="space-y-6">
      <PageHeader
        title="My ads"
        actions={
          <Button asChild>
            <Link to="/ads/new">
              <Plus />
              Post an ad
            </Link>
          </Button>
        }
      />
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {!ads && !error && <LoadingState />}
      {ads?.length === 0 && <EmptyState title="You haven't posted any ads yet." />}
      <ul className="grid gap-4">
        {ads?.map((ad) => (
          <AdListItem
            key={ad.id}
            imageUrl={ad.imageUrl}
            title={
              ad.status === 'APPROVED' ? (
                <Link to={`/ads/${ad.id}`} className="hover:text-primary hover:underline">
                  {ad.title}
                </Link>
              ) : (
                ad.title
              )
            }
            badge={<StatusBadge status={ad.status} />}
            meta={`${formatPrice(ad.price)} · posted ${formatDate(ad.createdAt)}`}
            actions={
              <>
                {ad.status === 'NEEDS_INFO' && (
                  <Button size="sm" asChild>
                    <Link to={`/my-ads/${ad.id}/edit`}>Edit & resubmit</Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(ad)}
                >
                  Delete
                </Button>
              </>
            }
          >
            {ad.adminNote && <NoteCallout label="Admin note">{ad.adminNote}</NoteCallout>}
          </AdListItem>
        ))}
      </ul>
    </section>
  )
}
