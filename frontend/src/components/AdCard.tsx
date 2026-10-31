import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { formatDate, formatPrice, type PublicAd } from '@/lib/ads'
import { ListingImage } from './ListingImage'

// Feed tile for an approved ad
export function AdCard({ ad }: { ad: PublicAd }) {
  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <Link to={`/ads/${ad.id}`} className="block">
        <ListingImage src={ad.imageUrl} className="rounded-none transition-transform group-hover:scale-[1.02]" />
        <h2 className="truncate px-4 pt-4 font-semibold">{ad.title}</h2>
      </Link>
      <div className="space-y-1 px-4 pt-1 pb-4">
        <p className="text-lg font-semibold text-primary">{formatPrice(ad.price)}</p>
        <p className="truncate text-sm text-muted-foreground">
          <a href={`mailto:${ad.ownerEmail}`} className="hover:text-foreground hover:underline">
            {ad.ownerEmail}
          </a>{' '}
          · {formatDate(ad.approvedAt)}
        </p>
      </div>
    </Card>
  )
}
