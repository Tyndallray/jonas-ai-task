import { useAuth } from 'react-oidc-context'

export function Home() {
  const auth = useAuth()

  return (
    <section>
      <h1>Welcome</h1>
      {auth.isAuthenticated ? (
        <p>You are signed in as {auth.user?.profile.email}.</p>
      ) : (
        <p>Sign in with your Cognito account to continue.</p>
      )}
      {auth.error && <p className="error">Auth error: {auth.error.message}</p>}
    </section>
  )
}
