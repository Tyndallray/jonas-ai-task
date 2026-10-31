import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ListingImage } from '@/components/ListingImage'
import { ErrorAlert, LoadingState } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatPrice, type PublicAd } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

function BackToAds({ label }: { label: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-3 mb-4">
      <Link to="/">
        <ArrowLeft />
        {label}
      </Link>
    </Button>
  )
}

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
        <BackToAds label="Back to ads" />
        <ErrorAlert>{error}</ErrorAlert>
      </section>
    )
  }
  if (!ad) return <LoadingState />

  return (
    <section>
      <BackToAds label="All ads" />
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <ListingImage src={ad.imageUrl} className="rounded-xl border" />
        <Card>
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight break-words">{ad.title}</h1>
            <p className="text-3xl font-semibold text-primary">{formatPrice(ad.price)}</p>
            <Separator />
            <p className="whitespace-pre-wrap break-words">{ad.description}</p>
            <Separator />
            <p className="text-sm break-words text-muted-foreground">
              Posted by{' '}
              <a href={`mailto:${ad.ownerEmail}`} className="font-medium text-primary hover:underline">
                {ad.ownerEmail}
              </a>{' '}
              on {formatDate(ad.approvedAt)}
            </p>
            <Button asChild className="w-full">
              <a href={`mailto:${ad.ownerEmail}?subject=${encodeURIComponent(ad.title)}`}>Contact seller</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
