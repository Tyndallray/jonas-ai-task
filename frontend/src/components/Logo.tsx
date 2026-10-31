import { cn } from '@/lib/utils'

export const APP_NAME = 'Jonas Market'

// Same mark as public/favicon.svg and the Cognito sign-in logo
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('size-8 shrink-0', className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <g
        transform="translate(4 4)"
        fill="none"
        className="stroke-primary-foreground"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle cx="7.5" cy="7.5" r="1.5" className="fill-primary-foreground" />
      </g>
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <LogoMark />
      <span className="text-base whitespace-nowrap sm:text-lg">{APP_NAME}</span>
    </span>
  )
}
