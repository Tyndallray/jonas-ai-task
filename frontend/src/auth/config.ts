import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

const env = import.meta.env

export const cognitoConfig = {
  authority: env.VITE_COGNITO_AUTHORITY,
  clientId: env.VITE_COGNITO_CLIENT_ID,
  domain: env.VITE_COGNITO_DOMAIN,
  redirectUri: env.VITE_COGNITO_REDIRECT_URI ?? `${window.location.origin}/`,
  logoutUri: env.VITE_COGNITO_LOGOUT_URI ?? `${window.location.origin}/`,
  scopes: env.VITE_COGNITO_SCOPES ?? 'openid email profile',
}

// Authorization Code flow with PKCE against Cognito managed login.
// Cognito returns JWTs (id_token, access_token) plus a refresh_token,
// which oidc-client-ts uses for silent renewal.
export const oidcConfig: AuthProviderProps = {
  authority: cognitoConfig.authority,
  client_id: cognitoConfig.clientId,
  redirect_uri: cognitoConfig.redirectUri,
  response_type: 'code',
  scope: cognitoConfig.scopes,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // Strip ?code=&state= from the URL and return to the page that started sign-in
  onSigninCallback: (user) => {
    const state = user?.state as { returnTo?: string } | undefined
    window.history.replaceState({}, document.title, state?.returnTo ?? '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  },
}

// Cognito does not expose end_session_endpoint in its discovery document,
// so signoutRedirect() can't be used; redirect to the /logout endpoint instead.
export function cognitoLogoutUrl() {
  const params = new URLSearchParams({
    client_id: cognitoConfig.clientId,
    logout_uri: cognitoConfig.logoutUri,
  })
  return `${cognitoConfig.domain}/logout?${params}`
}
