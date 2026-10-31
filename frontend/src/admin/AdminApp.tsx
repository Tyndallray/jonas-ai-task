import { AuthProvider, useAuth } from 'react-oidc-context'
import { Link } from 'react-router-dom'
import { adminCognitoConfig, adminOidcConfig } from '../auth/config'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { useLogout } from '../auth/useLogout'
import { AdminQueue } from './AdminQueue'

// Admin area: a nested AuthProvider against the admin pool, so useAuth/useApi
// inside this subtree use admin tokens and never touch the user session.
export function AdminApp() {
  return (
    <AuthProvider {...adminOidcConfig}>
      <AdminShell />
    </AuthProvider>
  )
}

function AdminShell() {
  const auth = useAuth()
  const logout = useLogout(adminCognitoConfig)

  if (auth.isLoading) return <p className="centered">Loading…</p>

  return (
    <>
      <header className="header admin-header">
        <nav>
          <Link to="/admin">Review queue</Link>
          <Link to="/">Public site</Link>
        </nav>
        {auth.isAuthenticated && (
          <div className="user">
            <span>Admin: {auth.user?.profile.email}</span>
            <button type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="main">
        <ProtectedRoute>
          <AdminQueue />
        </ProtectedRoute>
      </main>
    </>
  )
}
