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
          <Link to="/">Home</Link>
          {auth.isAuthenticated && <Link to="/profile">Profile</Link>}
        </nav>
        {auth.isAuthenticated ? (
          <div className="user">
            <span>{auth.user?.profile.email}</span>
            <button type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => auth.signinRedirect()}>
            Sign in
          </button>
        )}
      </header>
      <main className="main">
        <Outlet />
      </main>
    </>
  )
}
