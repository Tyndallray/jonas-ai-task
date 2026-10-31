import { useAuth } from 'react-oidc-context'
import { cognitoLogoutUrl, type CognitoConfig } from './config'

export function useLogout(config?: CognitoConfig) {
  const auth = useAuth()

  return async () => {
    await auth.removeUser()
    window.location.href = cognitoLogoutUrl(config)
  }
}
