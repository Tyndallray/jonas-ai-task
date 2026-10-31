import { useEffect, type ReactNode } from 'react'
import { hasAuthParams, useAuth } from 'react-oidc-context'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const auth = useAuth()

  useEffect(() => {
    if (
      !hasAuthParams() &&
      !auth.isAuthenticated &&
      !auth.activeNavigator &&
      !auth.isLoading &&
      !auth.error
    ) {
      void auth.signinRedirect({
        state: { returnTo: window.location.pathname },
      })
    }
  }, [auth])

  if (auth.error) return <p className="error">Auth error: {auth.error.message}</p>
  if (!auth.isAuthenticated) return <p>Redirecting to sign in…</p>

  return children
}
