import { useCallback, useEffect, useState } from 'react'
import { AdListItem } from '@/components/AdListItem'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorAlert, LoadingState, NoteCallout } from '@/components/states'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatDate, formatPrice, type AdDetail, type Page } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

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
    <section className="space-y-6">
      <PageHeader title="Review queue" description="Pending ads, oldest first." />
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {!loading && ads.length === 0 && <EmptyState title="Nothing to review." />}
      <ul className="grid gap-4">
        {ads.map((ad) => (
          <ReviewItem
            key={ad.id}
            ad={ad}
            onDecided={() => setAds((prev) => prev.filter((a) => a.id !== ad.id))}
          />
        ))}
      </ul>
      {loading && <LoadingState />}
      {cursor && !loading && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => load(cursor)}>
            Load more
          </Button>
        </div>
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
    <AdListItem
      imageUrl={ad.imageUrl}
      imageHref={ad.imageUrl ?? undefined}
      title={ad.title}
      badge={<StatusBadge status={ad.status} />}
      meta={`${formatPrice(ad.price)} · ${ad.ownerEmail} · submitted ${formatDate(ad.statusAt)}`}
      actions={
        <>
          <Button size="sm" disabled={busy} onClick={() => decide('approve')}>
            Approve
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => decide('request_info')}>
            Request info
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={() => decide('reject')}>
            Reject
          </Button>
        </>
      }
    >
      <p className="text-sm whitespace-pre-wrap break-words">{ad.description}</p>
      {ad.adminNote && <NoteCallout label="Previous note">{ad.adminNote}</NoteCallout>}
      <Textarea
        aria-label="Note for the poster"
        placeholder="Note for the poster (required to reject or request info)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={1000}
        rows={2}
      />
      {error && <ErrorAlert>{error}</ErrorAlert>}
    </AdListItem>
  )
}
