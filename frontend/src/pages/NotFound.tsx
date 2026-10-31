import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <section className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </section>
  )
}
