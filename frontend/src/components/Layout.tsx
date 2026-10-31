import { Outlet } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { useLogout } from '@/auth/useLogout'
import { AppHeader, type NavItem } from './AppHeader'

export function Layout() {
  const auth = useAuth()
  const logout = useLogout()

  const links: NavItem[] = [{ to: '/', label: 'Ads' }]
  if (auth.isAuthenticated) {
    links.push(
      { to: '/ads/new', label: 'Post an ad' },
      { to: '/my-ads', label: 'My ads' },
      { to: '/profile', label: 'Profile' },
    )
  }

  return (
    <>
      <AppHeader
        homeTo="/"
        links={links}
        email={auth.isAuthenticated ? auth.user?.profile.email : undefined}
        // Cognito's managed login page links to signup (self-signup is enabled on the user pool)
        onSignIn={() => auth.signinRedirect()}
        onSignOut={logout}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </>
  )
}
