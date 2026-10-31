import { useCallback } from 'react'
import { useApi } from './useApi'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'

interface PresignedPost {
  url: string
  fields: Record<string, string>
  key: string
}

// Uploads straight to S3 with a presigned POST and returns the object key for the ad
export function useImageUpload() {
  const api = useApi()

  return useCallback(
    async (file: File): Promise<string> => {
      if (file.size > MAX_IMAGE_BYTES) throw new Error('Image must be 5 MB or smaller.')

      const { url, fields, key } = await api<PresignedPost>('/ads/image-upload', {
        method: 'POST',
        body: JSON.stringify({ contentType: file.type }),
      })

      const form = new FormData()
      for (const [name, value] of Object.entries(fields)) form.append(name, value)
      form.append('file', file) // must be the last field
      const res = await fetch(url, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Image upload failed.')
      return key
    },
    [api],
  )
}
