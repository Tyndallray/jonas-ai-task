import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { fakeAuth, fakeUser, jwt } from './test/auth'

vi.mock('react-oidc-context', () => ({
  useAuth: vi.fn(),
  hasAuthParams: () => false,
  // The admin area nests its own provider; the mocked useAuth stands in for both
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}))

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

const fetchMock = vi.fn<typeof fetch>()

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      pathname: '/profile',
    } as Location)
    // The home page loads the public ad feed
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(Response.json({ items: [], nextCursor: null }))
    vi.stubGlobal('fetch', fetchMock)
  })

  it('shows a loading state while auth is resolving', () => {
    renderAt('/', fakeAuth({ isLoading: true }))
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('shows approved ads with the poster email to anonymous visitors', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        items: [
          {
            id: 'ad-1',
            title: 'Road bike',
            description: 'Red',
            price: 120.5,
            imageUrl: null,
            ownerEmail: 'seller@example.com',
            approvedAt: 1_800_000_000_000,
          },
        ],
        nextCursor: null,
      }),
    )
    renderAt('/')

    expect(await screen.findByRole('link', { name: 'Road bike' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'seller@example.com' })).toBeInTheDocument()
    expect(screen.getByText('£120.50')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/ads')
  })

  it('invites anonymous users to sign in or sign up', async () => {
    const auth = renderAt('/')

    expect(screen.queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'My ads' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Sign in / Sign up' }))
    expect(auth.signinRedirect).toHaveBeenCalled()
    expect(await screen.findByText('No ads yet.')).toBeInTheDocument()
  })

  it('gives a signed-in user links to post and manage ads', async () => {
    renderAt('/', signedIn())

    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Post an ad' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My ads' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument()
    expect(await screen.findByText('No ads yet.')).toBeInTheDocument()
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

  it('shows the admin review queue with the shared ad row and an Admin marker', async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        items: [
          {
            id: 'ad-2',
            title: 'Old sofa',
            description: 'Comfy',
            price: 40,
            imageKey: null,
            imageUrl: null,
            ownerEmail: 'seller@example.com',
            status: 'PENDING',
            adminNote: null,
            createdAt: 1_800_000_000_000,
            updatedAt: 1_800_000_000_000,
            statusAt: 1_800_000_000_000,
          },
        ],
        nextCursor: null,
      }),
    )
    renderAt('/admin', signedIn())

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Old sofa' })).toBeInTheDocument()
    expect(screen.getByText('Pending review')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument()
  })

  it('renders a not found page for unknown routes', () => {
    renderAt('/nope')
    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
  })
})
