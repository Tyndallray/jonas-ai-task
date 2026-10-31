import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

// 4:3 ad photo, or a muted placeholder when the ad has none
export function ListingImage({ src, className }: { src: string | null; className?: string }) {
  const base = cn('aspect-[4/3] w-full rounded-md bg-muted object-cover', className)
  if (src) return <img src={src} alt="" className={base} />
  return (
    <div className={cn(base, 'flex items-center justify-center text-muted-foreground/60')}>
      <ImageOff className="size-8" aria-hidden="true" />
    </div>
  )
}
