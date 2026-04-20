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
  
  // 1. Split query params to prevent double encoding of '?' and '='
  const [baseUrl, searchParams] = url.split('?')
  let result = baseUrl

  // 2. Domain Rewrite (Hepsini tek bir domain'e topla)
  // Regex pointer issue riskini azaltmak için string replace kullanıyoruz
  const legacyDomains = [
    'assets.birim.com',
    'birim-assets.web-birim.workers.dev',
    'pub-5e705b2a702d4bb1a3631c558917599d.r2.dev'
  ]

  if (R2_DOMAIN) {
    const r2DomainNoProtocol = R2_DOMAIN.replace(/^https?:\/\//, '')
    for (const domain of legacyDomains) {
      if (result.includes(domain)) {
        result = result.replace(domain, r2DomainNoProtocol)
      }
    }
    
    // Generic R2.dev rewrite
    if (!R2_DOMAIN.includes('.r2.dev') && result.includes('.r2.dev') && !result.includes(r2DomainNoProtocol)) {
      try {
        const parts = result.split('/')
        // Find the segment containing r2.dev (usually the domain part)
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].includes('.r2.dev')) {
            parts[i] = r2DomainNoProtocol
            break
          }
        }
        result = parts.join('/')
      } catch { /* ignore */ }
    }

    // New: Relatif yolları mutlak yap
    if (!result.startsWith('http') && result.length > 0) {
      const cleanPath = result.startsWith('/') ? result.substring(1) : result
      result = `${R2_DOMAIN}/${cleanPath}`
    }
  }

  // 3. Segment bazlı temizlik ve encode
  try {
    const parts = result.split('/')
    result = parts.map((p, i) => {
      if (i < 3 && p.includes(':')) return p // protocol
      if (!p) return ''
      try {
        return encodeURIComponent(decodeURIComponent(p.trim()))
          .replace(/%2F/g, '/')
          .replace(/%3A/g, ':')
          .replace(/\(/g, '%28')
          .replace(/\)/g, '%29')
      } catch {
        return p.trim()
      }
    }).join('/')
  } catch { /* ignore */ }

  // 4. Params ekle
  let finalUrl = result
  const params = new URLSearchParams(searchParams || '')
  
  if (hasResponsiveSizes && !params.has('rs')) {
    params.set('rs', '1')
  }

  const queryString = params.toString()
  if (queryString) {
    finalUrl += '?' + queryString
  }

  // 5. Legacy Path Corrections (Hardening)
  if (finalUrl.includes('/newsItem/')) {
    finalUrl = finalUrl.replace(/\/newsItem\//g, '/news/')
    if (finalUrl.includes('/media/')) {
      finalUrl = finalUrl.replace(/\/media\//g, '/')
    }
  }

  return finalUrl
}

export const mapImage = (
  img: SanityImageLike | undefined
): string => {
  if (!img) return ''
  if (typeof img === 'string') return rewriteR2Url(img)

  try {
    const i = img as Record<string, unknown>
    const r2Url = i.r2Asset?.url
    const standardUrl = i.url
    const assetUrl = i.asset?.url || (typeof i.asset === 'string' ? i.asset : undefined)
    
    const rawUrl = r2Url || standardUrl || assetUrl
    const hasResponsiveSizes = Boolean(i.r2Asset?.hasResponsiveSizes || i.hasResponsiveSizes)

    if (rawUrl) {
      return rewriteR2Url(rawUrl, hasResponsiveSizes)
    }
  } catch (err) {
    console.error('Error in mapImage:', err)
  }

  return ''
}

export const mapR2Metadata = (img: unknown): R2ImageMetadata => {
  if (!img || typeof img !== 'object') return {}
  
  try {
    const i = img as Record<string, unknown>

    let crop: R2ImageMetadata['crop'] = undefined
    if (i.cropX !== undefined && i.cropWidth !== undefined) {
      crop = { 
        x: Number(i.cropX) || 0, 
        y: Number(i.cropY) || 0, 
        width: Number(i.cropWidth) || 1, 
        height: Number(i.cropHeight) || 1 
      }
    } else if (i.crop && typeof i.crop === 'object' && i.crop !== null) {
      const c = i.crop
      const left = Number(c.left) || 0
      const top = Number(c.top) || 0
      const right = Number(c.right) || 0
      const bottom = Number(c.bottom) || 0
      crop = {
        x: left,
        y: top,
        width: Math.max(0, 1 - left - right),
        height: Math.max(0, 1 - top - bottom)
      }
    }

    let hotspot: R2ImageMetadata['hotspot'] = undefined
    if (i.hotspotX !== undefined && i.hotspotY !== undefined) {
      hotspot = { x: Number(i.hotspotX) || 0.5, y: Number(i.hotspotY) || 0.5 }
    } else if (i.hotspot && typeof i.hotspot === 'object' && i.hotspot !== null) {
      const h = i.hotspot
      hotspot = { x: Number(h.x) || 0.5, y: Number(h.y) || 0.5 }
    }

    const origWidth = Number(i.width) || undefined
    const origHeight = Number(i.height) || undefined

    return { crop, hotspot, origWidth, origHeight }
  } catch (err) {
    console.error('Error in mapR2Metadata:', err)
    return {}
  }
}

export const mapImages = (imgs: SanityImageLike[] | undefined): string[] =>
  Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []

export const extractPalette = (
  img: unknown
): SanityImagePalette | undefined => {
  if (!img || typeof img !== 'object') return undefined
  const i = img as Record<string, unknown>
  
  if (i['palette']) return i['palette'] as SanityImagePalette
  
  const asset = i['asset'] as Record<string, unknown> | undefined
  const metadata = asset?.['metadata'] as Record<string, unknown> | undefined
  return metadata?.['palette'] as SanityImagePalette | undefined
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

