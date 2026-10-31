export type AdStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFO'

// Shape of the public feed and detail
export interface PublicAd {
  id: string
  title: string
  description: string
  price: number
  imageUrl: string | null
  ownerEmail: string
  approvedAt: number
}

// Shape shown to owners ("My ads") and admins
export interface AdDetail {
  id: string
  title: string
  description: string
  price: number
  imageKey: string | null
  imageUrl: string | null
  ownerEmail: string
  status: AdStatus
  adminNote: string | null
  createdAt: number
  updatedAt: number
  statusAt: number
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface AdInput {
  title: string
  description: string
  price: number
  imageKey?: string
}

export const STATUS_LABELS: Record<AdStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_INFO: 'Needs more info',
}

const priceFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })

export const formatPrice = (price: number) => priceFormat.format(price)

export const formatDate = (ms: number) => new Date(ms).toLocaleDateString()
