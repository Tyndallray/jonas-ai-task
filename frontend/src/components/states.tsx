import { AlertCircle, Loader2, MessageSquareText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

export function LoadingState({ label = 'Loading…', fullPage }: { label?: string; fullPage?: boolean }) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-center justify-center gap-2 py-10 text-muted-foreground',
        fullPage && 'min-h-svh',
      )}
    >
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// Moderator feedback on an ad ("Admin note", "Previous note")
export function NoteCallout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Alert className="border-warning/30 bg-warning/10">
      <MessageSquareText className="text-warning" />
      <AlertTitle>{label}</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap text-foreground/80">{children}</AlertDescription>
    </Alert>
  )
}

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
