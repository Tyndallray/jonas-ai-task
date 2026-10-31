import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

const env = import.meta.env

export interface CognitoConfig {
  authority: string
  clientId: string
  domain: string
  redirectUri: string
  logoutUri: string
  scopes: string
}

export const cognitoConfig: CognitoConfig = {
  authority: env.VITE_COGNITO_AUTHORITY,
  clientId: env.VITE_COGNITO_CLIENT_ID,
  domain: env.VITE_COGNITO_DOMAIN,
  redirectUri: env.VITE_COGNITO_REDIRECT_URI ?? `${window.location.origin}/`,
  logoutUri: env.VITE_COGNITO_LOGOUT_URI ?? `${window.location.origin}/`,
  scopes: env.VITE_COGNITO_SCOPES ?? 'openid email profile',
}

// Admins live in a separate user pool with its own app client
export const adminCognitoConfig: CognitoConfig = {
  authority: env.VITE_ADMIN_COGNITO_AUTHORITY,
  clientId: env.VITE_ADMIN_COGNITO_CLIENT_ID,
  domain: env.VITE_ADMIN_COGNITO_DOMAIN,
  redirectUri: env.VITE_ADMIN_COGNITO_REDIRECT_URI ?? `${window.location.origin}/admin`,
  logoutUri: env.VITE_ADMIN_COGNITO_LOGOUT_URI ?? `${window.location.origin}/admin`,
  scopes: env.VITE_COGNITO_SCOPES ?? 'openid email profile',
}

export const isAdminPath = () => window.location.pathname.startsWith('/admin')

// Authorization Code flow with PKCE against Cognito managed login.
// Cognito returns JWTs (id_token, access_token) plus a refresh_token,
// which oidc-client-ts uses for silent renewal.
function buildOidcConfig(
  config: CognitoConfig,
  prefix: string,
  defaultReturnTo: string,
): AuthProviderProps {
  return {
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes,
    automaticSilentRenew: true,
    // Namespaced so the user and admin sessions never overwrite each other
    userStore: new WebStorageStateStore({ store: window.sessionStorage, prefix }),
    stateStore: new WebStorageStateStore({ store: window.localStorage, prefix }),
    // Strip ?code=&state= from the URL and return to the page that started sign-in
    onSigninCallback: (user) => {
      const state = user?.state as { returnTo?: string } | undefined
      window.history.replaceState({}, document.title, state?.returnTo ?? defaultReturnTo)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
  }
}

export const oidcConfig: AuthProviderProps = {
  ...buildOidcConfig(cognitoConfig, 'oidc.', '/'),
  // The admin provider handles sign-in callbacks on /admin
  skipSigninCallback: isAdminPath(),
}

export const adminOidcConfig = buildOidcConfig(adminCognitoConfig, 'admin.oidc.', '/admin')

// Cognito does not expose end_session_endpoint in its discovery document,
// so signoutRedirect() can't be used; redirect to the /logout endpoint instead.
export function cognitoLogoutUrl(config: CognitoConfig = cognitoConfig) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.logoutUri,
  })
  return `${config.domain}/logout?${params}`
}
