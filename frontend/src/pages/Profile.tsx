import { useAuth } from 'react-oidc-context'
import { decodeJwt } from '../lib/jwt'

export function Profile() {
  const { user } = useAuth()
  if (!user) return null

  const accessClaims = decodeJwt(user.access_token)
  const groups = (accessClaims['cognito:groups'] as string[] | undefined) ?? []

  return (
    <section>
      <h1>Profile</h1>
      <dl className="details">
        <dt>Email</dt>
        <dd>{user.profile.email}</dd>
        <dt>Subject</dt>
        <dd>{user.profile.sub}</dd>
        <dt>Groups</dt>
        <dd>{groups.length ? groups.join(', ') : '—'}</dd>
        <dt>Token expires</dt>
        <dd>{user.expires_at ? new Date(user.expires_at * 1000).toLocaleString() : '—'}</dd>
      </dl>

      <h2>ID token claims</h2>
      <pre>{JSON.stringify(user.profile, null, 2)}</pre>

      <h2>Access token claims</h2>
      <pre>{JSON.stringify(accessClaims, null, 2)}</pre>
    </section>
  )
}
