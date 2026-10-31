import { AuthProvider, useAuth } from 'react-oidc-context'
import { adminCognitoConfig, adminOidcConfig } from '@/auth/config'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { useLogout } from '@/auth/useLogout'
import { AppHeader } from '@/components/AppHeader'
import { LoadingState } from '@/components/states'
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

  if (auth.isLoading) return <LoadingState fullPage />

  return (
    <>
      <AppHeader
        admin
        homeTo="/admin"
        links={[
          { to: '/admin', label: 'Review queue' },
          { to: '/', label: 'Public site' },
        ]}
        email={auth.isAuthenticated ? auth.user?.profile.email : undefined}
        onSignOut={logout}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <ProtectedRoute>
          <AdminQueue />
        </ProtectedRoute>
      </main>
    </>
  )
}
