import { createClient } from '@sanity/client'
import type { SanityImagePalette, R2ImageMetadata, LocalizedString } from '../../types'

// Not: Çevresel değişkenler Vite config ile yüklenmektedir.
// Ancak import.meta bazen hata fırlattığından any olarak tip çevrimi yapıyor olabilir.

export const SANITY_PROJECT_ID = import.meta.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
export const SANITY_DATASET = import.meta.env['VITE_SANITY_DATASET'] || 'production'
export const SANITY_API_VERSION = import.meta.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
export const useSanity = Boolean(SANITY_PROJECT_ID && SANITY_DATASET)

export const R2_DOMAIN =
  import.meta.env['VITE_R2_DOMAIN'] || 'https://birim-assets.web-birim.workers.dev'
export const R2_ORIGIN_DOMAIN =
  import.meta.env['VITE_R2_ORIGIN_DOMAIN'] || 'https://pub-5e705b2a702d4bb1a3631c558917599d.r2.dev'

const defaultEnableFallback = import.meta.env.PROD ? 'false' : 'true'
export const ENABLE_LOCAL_FALLBACK =
  String(
    (import.meta as ImportMeta).env?.['VITE_ENABLE_LOCAL_FALLBACK'] ?? defaultEnableFallback
  ).toLowerCase() !== 'false'

export const sanity = useSanity
  ? createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: SANITY_API_VERSION,
    useCdn: true,
  })
  : null

// SANITY_TOKEN artık sadece server-side (Vercel API) tarafında kullanılmaktadır.
export const SANITY_TOKEN = ''
export const sanityMutations = null

export interface SanityFileAsset {
  url?: string
  _id?: string
  _ref?: string
}

export type SanityImageLike = string | { url?: string } | null | undefined

export interface SanityProductMediaItem {
  type?: 'image' | 'video' | 'youtube' | string
  url?: string
  imageR2?: { url?: string; hasResponsiveSizes?: boolean }
  imageMobileR2?: { url?: string; hasResponsiveSizes?: boolean }
  imageDesktopR2?: { url?: string; hasResponsiveSizes?: boolean }
  title?: LocalizedString
  description?: LocalizedString
  link?: string
  linkText?: LocalizedString
  videoFileR2?: { url?: string }
  videoFileMobileR2?: { url?: string }
  videoFileDesktopR2?: { url?: string }
}

export const rewriteR2Url = (url: string | undefined, hasResponsiveSizes?: boolean): string => {
  if (!url || typeof url !== 'string') return url || ''
  
  // URL'deki segmentleri ayır, trim et ve gizli boşlukları temizle
  const trimSegments = (u: string) => {
    try {
      const parts = u.split('/')
      return parts.map((p, i) => {
        if (i < 3 && p.includes(':')) return p
        return p.trim()
      }).join('/')
    } catch {
      return u.trim()
    }
  }

  let result = trimSegments(url)

  // 1. Domain Rewrite (Hepsini tek bir domain'e topla)
  const legacyDomains = [
    /https?:\/\/assets\.birim\.com/g,
    /https?:\/\/birim-assets\.web-birim\.workers\.dev/g,
    /https?:\/\/pub-5e705b2a702d4bb1a3631c558917599d\.r2\.dev/g
  ]

  if (R2_DOMAIN) {
    for (const pattern of legacyDomains) {
      if (pattern.test(result)) {
        result = result.replace(pattern, R2_DOMAIN)
      }
    }

    // 2. Generic R2.dev rewrite (subdomain'den bağımsız)
    if (!R2_DOMAIN.includes('.r2.dev') && result.includes('.r2.dev') && !result.includes(R2_DOMAIN)) {
      try {
        const parsedUrl = new URL(result)
        const pathPart = parsedUrl.pathname.startsWith('/')
          ? parsedUrl.pathname.substring(1)
          : parsedUrl.pathname
        result = `${R2_DOMAIN}/${pathPart}`
      } catch { /* ignore */ }
    }

    // 3. Relatif yolları mutlak yap
    if (!result.startsWith('http') && result.length > 0) {
      const cleanPath = result.startsWith('/') ? result.substring(1) : result
      result = `${R2_DOMAIN}/${cleanPath}`
    }
  }

  // 4. Final step: Space encoding
  try {
    result = encodeURI(decodeURI(result)).replace(/ /g, '%20')
  } catch {
    result = result.replace(/ /g, '%20')
  }

  if (hasResponsiveSizes && !result.includes('rs=1')) {
    result += result.includes('?') ? '&rs=1' : '?rs=1'
  }
  return result
}

export const mapImage = (
  img: SanityImageLike | undefined
): string => {
  if (!img) return ''
  if (typeof img === 'string') {
    return rewriteR2Url(img)
  }

  const rawUrl = (img as Record<string, Record<string, string>>)?.['r2Asset']?.['url'] || (img as Record<string, string>)?.['url']
  const hasResponsiveSizes = Boolean(
    (img as Record<string, Record<string, boolean>>)?.['r2Asset']?.['hasResponsiveSizes'] || (img as Record<string, boolean>)?.['hasResponsiveSizes']
  )

  if (rawUrl) {
    if (
      typeof rawUrl === 'string' &&
      (rawUrl.includes('r2.dev') || rawUrl.startsWith('http') || rawUrl.startsWith('/') || rawUrl.startsWith('uploads/'))
    ) {
      return rewriteR2Url(rawUrl, hasResponsiveSizes)
    }
  }

  return rewriteR2Url((img as Record<string, string>)?.['url'], hasResponsiveSizes) || ''
}

export const mapR2Metadata = (img: unknown): R2ImageMetadata => {
  if (!img || typeof img !== 'object') return {}
  const i = img as Record<string, unknown>

  let crop =
    i['cropX'] !== undefined && i['cropWidth'] !== undefined
      ? { x: i['cropX'] as number, y: (i['cropY'] as number) || 0, width: i['cropWidth'] as number, height: (i['cropHeight'] as number) || 1 }
      : undefined

  if (!crop && i['crop'] && typeof i['crop'] === 'object' && !('asset' in i)) {
    const c = i['crop'] as Record<string, number>
    const { left = 0, top = 0, right = 0, bottom = 0 } = c
    crop = {
      x: left,
      y: top,
      width: 1 - left - right,
      height: 1 - top - bottom
    }
  }

  let hotspot =
    i['hotspotX'] !== undefined && i['hotspotY'] !== undefined
      ? { x: i['hotspotX'] as number, y: i['hotspotY'] as number }
      : undefined

    const h = i['hotspot'] as Record<string, unknown>
    hotspot = { x: (h['x'] as number) ?? 0, y: (h['y'] as number) ?? 0 }

  const origWidth = i['width'] as number
  const origHeight = i['height'] as number

  return { crop, hotspot, origWidth, origHeight }
}

export const mapImages = (imgs: SanityImageLike[] | undefined): string[] =>
  Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []

export const extractPalette = (
  img: unknown
): SanityImagePalette | undefined => {
  // R2 assets no longer carry Sanity palette metadata directly unless manually synced
  return (img as Record<string, SanityImagePalette>)?.['palette'] || undefined
}

export const mapMediaUrl = (
  m: SanityProductMediaItem,
  isMobile?: boolean,
  isDesktop?: boolean
): string => {
  const type = m?.type

  if (type === 'image') {
    const r2Url = isMobile
      ? m?.imageMobileR2?.url
      : isDesktop
        ? m?.imageDesktopR2?.url
        : m?.imageR2?.url
    const hasResponsiveSizes = Boolean(
      isMobile
        ? (m?.imageMobileR2 as Record<string, unknown>)?.['hasResponsiveSizes']
        : isDesktop
          ? (m?.imageDesktopR2 as Record<string, unknown>)?.['hasResponsiveSizes']
          : (m?.imageR2 as Record<string, unknown>)?.['hasResponsiveSizes']
    )
    if (r2Url) {
      return rewriteR2Url(r2Url, hasResponsiveSizes)
    }
    return rewriteR2Url(m?.url) || ''
  } else if (type === 'video') {
    const r2Url = isMobile
      ? m?.videoFileMobileR2?.url
      : isDesktop
        ? m?.videoFileDesktopR2?.url
        : m?.videoFileR2?.url
    if (r2Url) {
      return rewriteR2Url(r2Url)
    }
    if ((isMobile || isDesktop) && m?.videoFileR2?.url) {
      return rewriteR2Url(m.videoFileR2.url)
    }
    
    const fallbackUrl = m?.url || ''
    if (fallbackUrl.includes('youtube.com') || fallbackUrl.includes('youtu.be')) return ''
    return rewriteR2Url(fallbackUrl) || ''
  }
  return m?.url || ''
}

