import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdForm } from '@/components/AdForm'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, ErrorAlert, LoadingState, NoteCallout } from '@/components/states'
import { Button } from '@/components/ui/button'
import type { AdDetail, AdInput } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

// Edit and resubmit an ad an admin asked more info about
export function EditAd() {
  const { id } = useParams()
  const api = useApi()
  const navigate = useNavigate()
  const [ad, setAd] = useState<AdDetail | null>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    api<{ items: AdDetail[] }>('/me/ads').then(
      (res) => setAd(res.items.find((a) => a.id === id) ?? null),
      (err: Error) => setError(err.message),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function submit(input: AdInput) {
    await api(`/me/ads/${id}`, { method: 'PUT', body: JSON.stringify(input) })
    navigate('/my-ads')
  }

  if (error) return <ErrorAlert>{error}</ErrorAlert>
  if (ad === undefined) return <LoadingState />
  if (ad === null || ad.status !== 'NEEDS_INFO') {
    return (
      <EmptyState
        title="Only ads that need more info can be edited."
        action={
          <Button variant="outline" asChild>
            <Link to="/my-ads">Back to my ads</Link>
          </Button>
        }
      />
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader title="Edit and resubmit" />
      {ad.adminNote && (
        <div className="max-w-2xl">
          <NoteCallout label="Admin note">{ad.adminNote}</NoteCallout>
        </div>
      )}
      <AdForm
        initial={{
          title: ad.title,
          description: ad.description,
          price: ad.price,
          imageKey: ad.imageKey ?? undefined,
          imageUrl: ad.imageUrl,
        }}
        submitLabel="Resubmit for review"
        onSubmit={submit}
      />
    </section>
  )
}
