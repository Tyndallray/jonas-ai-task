import type { AuthContextProps } from 'react-oidc-context'
import { vi } from 'vitest'

// Builds a fake react-oidc-context value. Tests mock useAuth() to return it
// so components can be exercised without a real Cognito round trip.
export function fakeAuth(overrides: Partial<AuthContextProps> = {}): AuthContextProps {
  return {
    isLoading: false,
    isAuthenticated: false,
    activeNavigator: undefined,
    error: undefined,
    user: null,
    signinRedirect: vi.fn().mockResolvedValue(undefined),
    removeUser: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as AuthContextProps
}

export function fakeUser(profile: Record<string, unknown> = {}, accessToken = jwt({})) {
  return {
    access_token: accessToken,
    expires_at: 1_900_000_000,
    profile: { sub: 'user-123', email: 'jane@example.com', ...profile },
  } as unknown as NonNullable<AuthContextProps['user']>
}

// Unsigned JWT with a base64url payload, enough for decodeJwt()
export function jwt(claims: Record<string, unknown>) {
  const encode = (value: unknown) =>
    btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  return `${encode({ alg: 'none' })}.${encode(claims)}.`
}
