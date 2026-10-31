import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAuth } from 'react-oidc-context'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { fakeAuth, fakeUser, jwt } from './test/auth'

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn(), hasAuthParams: () => false }))

function renderAt(path: string, auth = fakeAuth()) {
  vi.mocked(useAuth).mockReturnValue(auth)
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  return auth
}

const signedIn = () =>
  fakeAuth({
    isAuthenticated: true,
    user: fakeUser({}, jwt({ 'cognito:groups': ['admins', 'editors'] })),
  })

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/profile',
    } as Location)
  })

  it('shows a loading state while auth is resolving', () => {
    renderAt('/', fakeAuth({ isLoading: true }))
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('invites anonymous users to sign in', async () => {
    const auth = renderAt('/')

    expect(screen.getByText('Sign in with your Cognito account to continue.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(auth.signinRedirect).toHaveBeenCalled()
  })

  it('greets a signed-in user and links to their profile', () => {
    renderAt('/', signedIn())

    expect(screen.getByText('You are signed in as jane@example.com.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()
  })

  it('signs out locally and then through Cognito', async () => {
    const href = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      set href(value: string) {
        href(value)
      },
    } as Location)
    const auth = renderAt('/', signedIn())

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(auth.removeUser).toHaveBeenCalled()
    expect(href).toHaveBeenCalledWith(
      expect.stringContaining('https://test.auth.us-east-1.amazoncognito.com/logout?'),
    )
  })

  it('shows profile details and access token groups', () => {
    renderAt('/profile', signedIn())

    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByText('user-123')).toBeInTheDocument()
    expect(screen.getByText('admins, editors')).toBeInTheDocument()
  })

  it('protects the profile page from anonymous users', () => {
    const auth = renderAt('/profile')

    expect(screen.queryByRole('heading', { name: 'Profile' })).not.toBeInTheDocument()
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/profile' } })
  })

  it('renders a not found page for unknown routes', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
  })
})
