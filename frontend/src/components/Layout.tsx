import { Link, Outlet } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { useLogout } from '../auth/useLogout'

export function Layout() {
  const auth = useAuth()
  const logout = useLogout()

  return (
    <>
      <header className="header">
        <nav>
          <Link to="/">Ads</Link>
          {auth.isAuthenticated && (
            <>
              <Link to="/ads/new">Post an ad</Link>
              <Link to="/my-ads">My ads</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}
        </nav>
        {auth.isAuthenticated ? (
          <div className="user">
            <span>{auth.user?.profile.email}</span>
            <button type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          // Cognito's managed login page links to signup (self-signup is enabled on the user pool)
          <button type="button" onClick={() => auth.signinRedirect()}>
            Sign in / Sign up
          </button>
        )}
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  )
}
