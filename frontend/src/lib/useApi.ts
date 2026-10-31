import { useCallback } from 'react'
import { useAuth } from 'react-oidc-context'

export const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

// fetch wrapper that attaches the Cognito ID token as a Bearer JWT.
// The API Gateway Cognito authorizer validates ID tokens, which carry the email claim.
// Uses the nearest AuthProvider, so inside /admin it sends the admin pool's token.
export function useApi() {
  const auth = useAuth()
  const token = auth.user?.id_token

  return useCallback(
    async <T>(path: string, init: RequestInit = {}): Promise<T> => {
      const headers = new Headers(init.headers)
      if (token) headers.set('Authorization', `Bearer ${token}`)
      if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json')
      }

      const res = await fetch(`${baseUrl}${path}`, { ...init, headers })
      if (res.status === 401) {
        await auth.signinRedirect({
          state: { returnTo: window.location.pathname },
        })
        throw new Error('Unauthorized')
      }
      if (!res.ok) {
        const body = await res.json().catch(() => undefined)
        throw new Error(body?.message ?? `${res.status} ${res.statusText}`)
      }
      if (res.status === 204) return undefined as T
      // Without VITE_API_BASE_URL, requests hit the Vite dev server, which answers with index.html
      if (!res.headers.get('Content-Type')?.includes('application/json')) {
        throw new Error(`API returned non-JSON from ${res.url}; check VITE_API_BASE_URL`)
      }
      return res.json()
    },
    [auth, token],
  )
}
