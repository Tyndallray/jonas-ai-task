import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { ListingImage } from './ListingImage'

interface Props {
  imageUrl: string | null
  // Opens the full-size image (used by the review queue)
  imageHref?: string
  title: ReactNode
  meta: ReactNode
  badge?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}

// Row layout shared by "My ads" and the admin review queue
export function AdListItem({ imageUrl, imageHref, title, meta, badge, children, actions }: Props) {
  const image = <ListingImage src={imageUrl} />

  return (
    <li>
      <Card className="flex-col gap-4 p-4 sm:flex-row">
        <div className="w-full shrink-0 sm:w-40">
          {imageHref ? (
            <a href={imageHref} target="_blank" rel="noreferrer">
              {image}
            </a>
          ) : (
            image
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold break-words">{title}</h2>
              {badge}
            </div>
            <p className="text-sm text-muted-foreground break-words">{meta}</p>
          </div>
          {children}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </Card>
    </li>
  )
}
