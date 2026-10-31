import { useNavigate } from 'react-router-dom'
import { AdForm } from '@/components/AdForm'
import { PageHeader } from '@/components/PageHeader'
import type { AdInput } from '@/lib/ads'
import { useApi } from '@/lib/useApi'

export function NewAd() {
  const api = useApi()
  const navigate = useNavigate()

  async function submit(input: AdInput) {
    await api('/ads', { method: 'POST', body: JSON.stringify(input) })
    navigate('/my-ads')
  }

  return (
    <section>
      <PageHeader
        title="Post an ad"
        description="Your ad will be visible to everyone once an admin approves it."
      />
      <AdForm submitLabel="Submit for review" onSubmit={submit} />
    </section>
  )
}
