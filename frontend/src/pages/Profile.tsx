import { useAuth } from 'react-oidc-context'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { decodeJwt } from '@/lib/jwt'

function Claims({ title, claims }: { title: string; claims: unknown }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(claims, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}

export function Profile() {
  const { user } = useAuth()
  if (!user) return null

  const accessClaims = decodeJwt(user.access_token)
  const groups = (accessClaims['cognito:groups'] as string[] | undefined) ?? []

  return (
    <section className="space-y-6">
      <PageHeader title="Profile" />
      <Card>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
            <dt className="text-sm font-medium text-muted-foreground">Email</dt>
            <dd className="break-all">{user.profile.email}</dd>
            <dt className="text-sm font-medium text-muted-foreground">Subject</dt>
            <dd className="break-all">{user.profile.sub}</dd>
            <dt className="text-sm font-medium text-muted-foreground">Groups</dt>
            <dd>{groups.length ? groups.join(', ') : '—'}</dd>
            <dt className="text-sm font-medium text-muted-foreground">Token expires</dt>
            <dd>{user.expires_at ? new Date(user.expires_at * 1000).toLocaleString() : '—'}</dd>
          </dl>
        </CardContent>
      </Card>
      <Claims title="ID token claims" claims={user.profile} />
      <Claims title="Access token claims" claims={accessClaims} />
    </section>
  )
}
