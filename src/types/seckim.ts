import type {Product, R2ImageMetadata} from '../types'
import {rewriteR2Url} from '../services/sanity/client'

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
  if (!product) {
    return {
      src: '',
      fitAuto: true,
    }
  }

  const isObject = typeof product.mainImage === 'object' && product.mainImage !== null
  const mainImageObj = isObject
    ? (product.mainImage as {
        url?: string
        urlMobile?: string
        urlDesktop?: string
        crop?: R2ImageMetadata['crop']
        cropMobile?: R2ImageMetadata['crop']
        cropDesktop?: R2ImageMetadata['crop']
        hotspot?: R2ImageMetadata['hotspot']
        hotspotMobile?: R2ImageMetadata['hotspot']
        hotspotDesktop?: R2ImageMetadata['hotspot']
        origWidth?: number
        origHeight?: number
        origWidthMobile?: number
        origHeightMobile?: number
        origWidthDesktop?: number
        origHeightDesktop?: number
        isMirrored?: boolean
        isMirroredMobile?: boolean
        isMirroredDesktop?: boolean
        asset?: {url?: string}
        imageR2?: {url?: string}
      })
    : {}

  let rawSrc = ''
  if (isObject) {
    rawSrc =
      mainImageObj.url ||
      mainImageObj.urlDesktop ||
      mainImageObj.urlMobile ||
      mainImageObj.asset?.url ||
      mainImageObj.imageR2?.url ||
      ''
  } else if (typeof product.mainImage === 'string') {
    rawSrc = product.mainImage
  }

  // Fallback to media array or alternativeMedia if mainImage has no URL
  if (!rawSrc && Array.isArray(product.media) && product.media.length > 0) {
    const firstImg = product.media.find(
      m => m && (m.type === 'image' || !m.type) && (m.url || m.urlDesktop || m.urlMobile)
    )
    if (firstImg) {
      rawSrc = firstImg.url || firstImg.urlDesktop || firstImg.urlMobile || ''
    }
  }

  if (!rawSrc && Array.isArray(product.alternativeMedia) && product.alternativeMedia.length > 0) {
    const firstAlt = product.alternativeMedia.find(
      m => m && (m.type === 'image' || !m.type) && (m.url || m.urlDesktop || m.urlMobile)
    )
    if (firstAlt) {
      rawSrc = firstAlt.url || firstAlt.urlDesktop || firstAlt.urlMobile || ''
    }
  }

  if (!rawSrc && Array.isArray(product.dimensionImages) && product.dimensionImages.length > 0) {
    const firstDim = product.dimensionImages.find(
      d => d && (d.image || d.imageDesktop || d.imageMobile)
    )
    if (firstDim) {
      rawSrc = firstDim.image || firstDim.imageDesktop || firstDim.imageMobile || ''
    }
  }

  const finalSrc = rawSrc ? rewriteR2Url(rawSrc) : ''
  const finalSrcMobile = mainImageObj.urlMobile ? rewriteR2Url(mainImageObj.urlMobile) : undefined
  const finalSrcDesktop = mainImageObj.urlDesktop ? rewriteR2Url(mainImageObj.urlDesktop) : undefined

  return {
    src: finalSrc,
    srcMobile: finalSrcMobile,
    srcDesktop: finalSrcDesktop,
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
