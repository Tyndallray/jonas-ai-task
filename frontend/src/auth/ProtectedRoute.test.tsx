import { render, screen } from '@testing-library/react'
import { hasAuthParams, useAuth } from 'react-oidc-context'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAuth, fakeUser } from '../test/auth'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn(), hasAuthParams: vi.fn() }))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(hasAuthParams).mockReturnValue(false)
    window.history.replaceState({}, '', '/profile')
  })

  it('renders children for an authenticated user', () => {
    const auth = fakeAuth({ isAuthenticated: true, user: fakeUser() })
    vi.mocked(useAuth).mockReturnValue(auth)

    render(<ProtectedRoute>secret</ProtectedRoute>)

    expect(screen.getByText('secret')).toBeInTheDocument()
    expect(auth.signinRedirect).not.toHaveBeenCalled()
  })

  it('redirects an anonymous user to sign in and remembers the page', () => {
    const auth = fakeAuth()
    vi.mocked(useAuth).mockReturnValue(auth)

    render(<ProtectedRoute>secret</ProtectedRoute>)

    expect(screen.queryByText('secret')).not.toBeInTheDocument()
    expect(screen.getByText('Redirecting to sign in…')).toBeInTheDocument()
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/profile' } })
  })

  it('does not redirect while the sign-in callback is being processed', () => {
    vi.mocked(hasAuthParams).mockReturnValue(true)
    const auth = fakeAuth()
    vi.mocked(useAuth).mockReturnValue(auth)

    render(<ProtectedRoute>secret</ProtectedRoute>)

    expect(auth.signinRedirect).not.toHaveBeenCalled()
  })

  it('shows the auth error instead of redirecting', () => {
    const auth = fakeAuth({ error: new Error('boom') as never })
    vi.mocked(useAuth).mockReturnValue(auth)

    render(<ProtectedRoute>secret</ProtectedRoute>)

    expect(screen.getByText('Auth error: boom')).toBeInTheDocument()
    expect(auth.signinRedirect).not.toHaveBeenCalled()
  })
})
