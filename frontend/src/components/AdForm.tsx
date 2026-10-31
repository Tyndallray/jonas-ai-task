import { useState, type FormEvent } from 'react'
import type { AdInput } from '../lib/ads'
import { IMAGE_ACCEPT, useImageUpload } from '../lib/useImageUpload'

interface Props {
  initial?: AdInput & { imageUrl?: string | null }
  submitLabel: string
  onSubmit: (input: AdInput) => Promise<void>
}

// Shared by "Post an ad" and "Edit and resubmit"
export function AdForm({ initial, submitLabel, onSubmit }: Props) {
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
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
      </label>
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={6}
          required
        />
      </label>
      <label>
        Price (£)
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>
      <label>
        Image (optional, JPEG/PNG/WebP up to 5 MB)
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {imageKey && !file && (
        <div className="current-image">
          {initial?.imageUrl && <img src={initial.imageUrl} alt="" />}
          <button type="button" onClick={() => setImageKey(undefined)}>
            Remove image
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}
