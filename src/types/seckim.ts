import type {Product} from '../types'

export interface UserSelectionItem {
  id: string
  productId: string
  product?: Product
  createdAt: string
}

export interface UserProject {
  id: string
  userId?: string
  name: string
  description?: string
  shareToken?: string
  isPublic?: boolean
  createdAt: string
  updatedAt: string
  productIds: string[]
}

export interface InquirySelectedProduct {
  id: string
  name: string
  category?: string
  dimensions?: string
  image?: string
}

export interface InquiryPayload {
  name: string
  company?: string
  email: string
  phone?: string
  projectName?: string
  message?: string
  selectedProducts: InquirySelectedProduct[]
}

export interface InquiryRecord extends InquiryPayload {
  id: string
  userId?: string
  status: 'new' | 'contacted' | 'quoting' | 'completed'
  createdAt: string
}

export function getLocalizedText(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const rec = val as Record<string, unknown>
    const tr = rec['tr']
    if (typeof tr === 'string') return tr
    const en = rec['en']
    if (typeof en === 'string') return en
  }
  return ''
}

export function getProductImageProps(product: Product) {
  const isObject = typeof product.mainImage === 'object' && product.mainImage !== null
  const mainImageObj = isObject
    ? (product.mainImage as {
        url?: string
        urlMobile?: string
        urlDesktop?: string
        crop?: any
        cropMobile?: any
        cropDesktop?: any
        hotspot?: any
        hotspotMobile?: any
        hotspotDesktop?: any
        origWidth?: number
        origHeight?: number
        origWidthMobile?: number
        origHeightMobile?: number
        origWidthDesktop?: number
        origHeightDesktop?: number
        isMirrored?: boolean
        isMirroredMobile?: boolean
        isMirroredDesktop?: boolean
      })
    : {}
  const mainImageUrl = (isObject ? mainImageObj.url : (product.mainImage as string)) || ''

  return {
    src: mainImageUrl,
    srcMobile: mainImageObj.urlMobile,
    srcDesktop: mainImageObj.urlDesktop,
    crop: mainImageObj.crop,
    cropMobile: mainImageObj.cropMobile,
    cropDesktop: mainImageObj.cropDesktop,
    hotspot: mainImageObj.hotspot,
    hotspotMobile: mainImageObj.hotspotMobile,
    hotspotDesktop: mainImageObj.hotspotDesktop,
    origWidth: mainImageObj.origWidth,
    origHeight: mainImageObj.origHeight,
    origWidthMobile: mainImageObj.origWidthMobile,
    origHeightMobile: mainImageObj.origHeightMobile,
    origWidthDesktop: mainImageObj.origWidthDesktop,
    origHeightDesktop: mainImageObj.origHeightDesktop,
    isMirrored: mainImageObj.isMirrored,
    isMirroredMobile: mainImageObj.isMirroredMobile,
    isMirroredDesktop: mainImageObj.isMirroredDesktop,
    fitAuto: true,
  }
}
