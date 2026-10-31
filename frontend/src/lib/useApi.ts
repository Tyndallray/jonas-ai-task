import { useCallback } from 'react'
import { useAuth } from 'react-oidc-context'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

// fetch wrapper that attaches the Cognito access token as a Bearer JWT
export function useApi() {
  const auth = useAuth()
  const token = auth.user?.access_token

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
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      return res.status === 204 ? (undefined as T) : res.json()
    },
    [auth, token],
  )
}
