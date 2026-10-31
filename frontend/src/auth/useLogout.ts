import { useAuth } from 'react-oidc-context'
import { cognitoLogoutUrl } from './config'

export function useLogout() {
  const auth = useAuth()

  return async () => {
    await auth.removeUser()
    window.location.href = cognitoLogoutUrl()
  }
}
