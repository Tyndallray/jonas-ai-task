import { describe, expect, it, vi } from 'vitest'
import { cognitoLogoutUrl, oidcConfig } from './config'

describe('oidcConfig', () => {
  it('uses the authorization code flow against the configured user pool', () => {
    expect(oidcConfig).toMatchObject({
      authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test',
      client_id: 'test-client-id',
      response_type: 'code',
      scope: 'openid email profile',
    })
  })

  it('returns to the page that started sign-in after the callback', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    oidcConfig.onSigninCallback?.({ state: { returnTo: '/profile' } } as never)
    expect(replaceState).toHaveBeenCalledWith({}, document.title, '/profile')
  })

  it('falls back to the root when no return path was stored', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    oidcConfig.onSigninCallback?.(undefined)
    expect(replaceState).toHaveBeenCalledWith({}, document.title, '/')
  })
})

describe('cognitoLogoutUrl', () => {
  it('points at the Cognito /logout endpoint with client id and logout uri', () => {
    const url = new URL(cognitoLogoutUrl())
    expect(url.origin + url.pathname).toBe('https://test.auth.us-east-1.amazoncognito.com/logout')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('logout_uri')).toBe('http://localhost:3000/')
  })
})
