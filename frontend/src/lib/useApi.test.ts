import { renderHook } from '@testing-library/react'
import { useAuth } from 'react-oidc-context'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAuth, fakeUser } from '../test/auth'
import { useApi } from './useApi'

vi.mock('react-oidc-context', () => ({ useAuth: vi.fn() }))

const fetchMock = vi.fn<typeof fetch>()

function api(
  auth = fakeAuth({ isAuthenticated: true, user: fakeUser({}, 'access-abc', 'id-abc') }),
) {
  vi.mocked(useAuth).mockReturnValue(auth)
  return { auth, call: renderHook(() => useApi()).result.current }
}

describe('useApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })

  // The API Gateway Cognito authorizers validate ID tokens (which carry the email claim)
  it('prefixes the base url and attaches the ID token', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 1 }))
    const { call } = api()

    await expect(call('/items')).resolves.toEqual({ id: 1 })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.test/items')
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer id-abc')
  })

  it('reports a misconfigured base url when the response is not JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response('<!doctype html>', { headers: { 'Content-Type': 'text/html' } }),
    )
    const { call } = api()

    await expect(call('/ads')).rejects.toThrow('check VITE_API_BASE_URL')
  })

  it('omits the Authorization header when signed out', async () => {
    fetchMock.mockResolvedValue(Response.json({}))
    const { call } = api(fakeAuth())

    await call('/public')

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Authorization')).toBe(false)
  })

  it('defaults the Content-Type to JSON when sending a body', async () => {
    fetchMock.mockResolvedValue(Response.json({}))
    const { call } = api()

    await call('/items', { method: 'POST', body: JSON.stringify({ a: 1 }) })

    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Content-Type')).toBe(
      'application/json',
    )
  })

  it('resolves to undefined for 204 No Content', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    const { call } = api()

    await expect(call('/items/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('sends the user back through sign-in on 401', async () => {
    window.history.replaceState({}, '', '/profile')
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
    const { auth, call } = api()

    await expect(call('/items')).rejects.toThrow('Unauthorized')
    expect(auth.signinRedirect).toHaveBeenCalledWith({ state: { returnTo: '/profile' } })
  })

  it('throws with the status for other error responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500, statusText: 'Server Error' }))
    const { call } = api()

    await expect(call('/items')).rejects.toThrow('500 Server Error')
  })
})
