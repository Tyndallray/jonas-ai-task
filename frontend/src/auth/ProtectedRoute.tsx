import { useEffect, type ReactNode } from 'react'
import { hasAuthParams, useAuth } from 'react-oidc-context'
import { ErrorAlert, LoadingState } from '@/components/states'

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

  if (auth.error) return <ErrorAlert>Auth error: {auth.error.message}</ErrorAlert>
  if (!auth.isAuthenticated) return <LoadingState label="Redirecting to sign in…" />

  return children
}
