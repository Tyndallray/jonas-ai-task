import { Menu } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

export interface NavItem {
  to: string
  label: string
}

interface Props {
  homeTo: string
  links: NavItem[]
  // Marks the admin area so it is never confused with the public site
  admin?: boolean
  email?: string
  onSignIn?: () => void
  onSignOut?: () => void
}

// Shared by the user Layout and the admin shell
export function AppHeader({ homeTo, links, admin, email, onSignIn, onSignOut }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:gap-6">
        <Link to={homeTo} className="flex shrink-0 items-center gap-2">
          <Logo />
          {admin && <Badge variant="secondary">Admin</Badge>}
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                  isActive && 'bg-accent text-accent-foreground hover:text-accent-foreground',
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {email && (
            <>
              <span className="hidden max-w-56 truncate text-sm text-muted-foreground md:inline">
                {email}
              </span>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={onSignOut}>
                Sign out
              </Button>
            </>
          )}
          {!email && onSignIn && (
            <Button size="sm" onClick={onSignIn}>
              Sign in / Sign up
            </Button>
          )}
          {(links.length > 0 || email) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
                  <Menu />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {email && <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>}
                {links.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
                {email && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={onSignOut}>Sign out</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
