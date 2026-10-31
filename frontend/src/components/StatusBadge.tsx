import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type AdStatus } from '@/lib/ads'

const STATUS_CLASSES: Record<AdStatus, string> = {
  PENDING: 'bg-secondary text-secondary-foreground',
  APPROVED: 'bg-success/15 text-success',
  REJECTED: 'bg-destructive/15 text-destructive',
  NEEDS_INFO: 'bg-warning/15 text-warning',
}

export function StatusBadge({ status }: { status: AdStatus }) {
  return <Badge className={STATUS_CLASSES[status]}>{STATUS_LABELS[status]}</Badge>
}
