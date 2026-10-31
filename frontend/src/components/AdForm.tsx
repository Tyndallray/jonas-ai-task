import { useId, useState, type FormEvent } from 'react'
import { ErrorAlert } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { AdInput } from '@/lib/ads'
import { IMAGE_ACCEPT, useImageUpload } from '@/lib/useImageUpload'

interface Props {
  initial?: AdInput & { imageUrl?: string | null }
  submitLabel: string
  onSubmit: (input: AdInput) => Promise<void>
}

// Shared by "Post an ad" and "Edit and resubmit"
export function AdForm({ initial, submitLabel, onSubmit }: Props) {
  const id = useId()
  const upload = useImageUpload()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial ? String(initial.price) : '')
  const [imageKey, setImageKey] = useState(initial?.imageKey)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      const key = file ? await upload(file) : imageKey
      await onSubmit({ title, description, price: Number(price), imageKey: key })
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-title`}>Title</Label>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-description`}>Description</Label>
            <Textarea
              id={`${id}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={6}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-price`}>Price (£)</Label>
            <Input
              id={`${id}-price`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="max-w-48"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-image`}>Image</Label>
            <Input
              id={`${id}-image`}
              type="file"
              accept={IMAGE_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-sm text-muted-foreground">Optional. JPEG, PNG or WebP up to 5 MB.</p>
          </div>
          {imageKey && !file && (
            <div className="flex items-center gap-4">
              {initial?.imageUrl && (
                <img src={initial.imageUrl} alt="" className="h-18 w-24 rounded-md border object-cover" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => setImageKey(undefined)}>
                Remove image
              </Button>
            </div>
          )}
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
