import {createClient} from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImagePalette, R2ImageMetadata, LocalizedString} from '../../types'

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
    (import.meta as any).env?.VITE_ENABLE_LOCAL_FALLBACK ?? defaultEnableFallback
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
// Güvenlik nedeniyle VITE_ prefix'i kaldırıldı ve tarayıcıya sızması engellendi.
export const SANITY_TOKEN = ''
export const sanityMutations = null

export const urlFor = (source: unknown) =>
  useSanity && sanity ? imageUrlBuilder(sanity).image(source as any) : null

export interface SanityFileAsset {
  url?: string
  _id?: string
  _ref?: string
}

export type SanityImageLike = string | {url?: string} | null | undefined

export interface SanityProductMediaItem {
  type?: 'image' | 'video' | 'youtube' | string
  url?: string
  imageR2?: {url?: string; hasResponsiveSizes?: boolean}
  imageMobileR2?: {url?: string; hasResponsiveSizes?: boolean}
  imageDesktopR2?: {url?: string; hasResponsiveSizes?: boolean}
  title?: LocalizedString
  description?: LocalizedString
  link?: string
  linkText?: LocalizedString
  videoFileR2?: {url?: string}
  videoFileMobileR2?: {url?: string}
  videoFileDesktopR2?: {url?: string}
  [key: string]: any // Fallback for legacy
}

export const toFileUrl = (asset: SanityFileAsset | null | undefined): string => {
  if (!asset) return ''
  if (asset.url) return asset.url
  const raw = String(asset._id || asset._ref || '')
  if (!raw) return ''
  const cleaned = raw.replace(/^file-/, '')
  const [assetId, ext] = cleaned.split('-')
  if (!assetId) return ''
  const postfix = ext ? `.${ext}` : ''
  return `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${assetId}${postfix}`
}

export const rewriteR2Url = (url: string | undefined, hasResponsiveSizes?: boolean): string => {
  if (!url || typeof url !== 'string') return url || ''
  let result = url

  if (
    R2_ORIGIN_DOMAIN &&
    R2_DOMAIN &&
    R2_ORIGIN_DOMAIN !== R2_DOMAIN &&
    result.startsWith(R2_ORIGIN_DOMAIN)
  ) {
    result = result.replace(R2_ORIGIN_DOMAIN, R2_DOMAIN)
  }

  if (R2_DOMAIN && !R2_DOMAIN.includes('.r2.dev') && result.includes('.r2.dev')) {
    try {
      const parsedUrl = new URL(result)
      const path = parsedUrl.pathname.startsWith('/')
        ? parsedUrl.pathname.substring(1)
        : parsedUrl.pathname
      result = `${R2_DOMAIN}/${path}`
    } catch {
      // ignore
    }
  }

  result = result.replace(/ /g, '%20')
  if (hasResponsiveSizes && !result.includes('rs=1')) {
    result += result.includes('?') ? '&rs=1' : '?rs=1'
  }
  return result
}

export const mapImage = (
  img: SanityImageLike | undefined,
  options?: {width?: number; height?: number; quality?: number; format?: 'webp' | 'jpg' | 'png'}
): string => {
  if (!img) return ''
  if (typeof img === 'string') {
    const isMigration = img.startsWith('migration/') || img.startsWith('/migration/')
    if (isMigration && R2_DOMAIN) {
      const cleanPath = img.startsWith('/') ? img.substring(1) : img
      return `${R2_DOMAIN}/${cleanPath}`.replace(/ /g, '%20')
    }
    return rewriteR2Url(img)
  }

  const rawUrl = (img as any)?.r2Asset?.url || (img as any)?.url || (img as any)?.asset?.url
  const hasResponsiveSizes = Boolean(
    (img as any)?.r2Asset?.hasResponsiveSizes || (img as any)?.hasResponsiveSizes
  )

  if (rawUrl) {
    const isMigration = rawUrl.startsWith('migration/') || rawUrl.startsWith('/migration/')
    if (isMigration && R2_DOMAIN) {
      const cleanPath = rawUrl.startsWith('/') ? rawUrl.substring(1) : rawUrl
      let res = `${R2_DOMAIN}/${cleanPath}`.replace(/ /g, '%20')
      if (hasResponsiveSizes) res += res.includes('?') ? '&rs=1' : '?rs=1'
      return res
    }
    if (
      typeof rawUrl === 'string' &&
      (rawUrl.includes('r2.dev') || rawUrl.includes('cdn.sanity.io') || rawUrl.startsWith('http'))
    ) {
      return rewriteR2Url(rawUrl, hasResponsiveSizes)
    }
  }

  const hasBuilderMeta =
    (img as any)?.crop ||
    (img as any)?.hotspot ||
    (img as any)?.asset?._ref ||
    (img as any)?.asset?._id
  if (img.url && !hasBuilderMeta) return rewriteR2Url(img.url, hasResponsiveSizes)

  const b = urlFor && urlFor(img)
  if (!b) return rewriteR2Url(img.url, hasResponsiveSizes) || ''

  try {
    const {width = 1600, quality = 85, format = 'webp'} = options || {}
    return (
      b.width(width).quality(quality).format(format).auto('format').url() ||
      rewriteR2Url(img.url || (img as any)?.asset?.url, hasResponsiveSizes) ||
      ''
    )
  } catch {
    return rewriteR2Url(img.url || (img as any)?.asset?.url, hasResponsiveSizes) || ''
  }
}

export const mapR2Metadata = (img: any): R2ImageMetadata => {
  if (!img) return {}
  const crop =
    img.cropX !== undefined && img.cropWidth !== undefined
      ? {x: img.cropX, y: img.cropY || 0, width: img.cropWidth, height: img.cropHeight || 1}
      : undefined
  const hotspot =
    img.hotspotX !== undefined && img.hotspotY !== undefined
      ? {x: img.hotspotX, y: img.hotspotY}
      : undefined
  return {crop, hotspot}
}

export const mapImages = (imgs: SanityImageLike[] | undefined): string[] =>
  Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []

export const extractPalette = (
  img: SanityImageLike | {asset?: {metadata?: {palette?: SanityImagePalette}}}
): SanityImagePalette | undefined => {
  if (typeof img === 'object' && img !== null && 'asset' in img) {
    return (img as {asset?: {metadata?: {palette?: SanityImagePalette}}}).asset?.metadata?.palette
  }
  return undefined
}

export const mapMediaUrl = (
  m: SanityProductMediaItem,
  isMobile?: boolean,
  isDesktop?: boolean
): string => {
  const type = m?.type
  const raw = m as any

  if (type === 'image') {
    const r2Url = isMobile
      ? m?.imageMobileR2?.url
      : isDesktop
        ? m?.imageDesktopR2?.url
        : m?.imageR2?.url
    const hasResponsiveSizes = Boolean(
      isMobile
        ? (m?.imageMobileR2 as any)?.hasResponsiveSizes
        : isDesktop
          ? (m?.imageDesktopR2 as any)?.hasResponsiveSizes
          : (m?.imageR2 as any)?.hasResponsiveSizes
    )
    if (r2Url) {
      if (r2Url.startsWith('migration/') && R2_DOMAIN) {
        let res = `${R2_DOMAIN}/${r2Url}`.replace(/ /g, '%20')
        if (hasResponsiveSizes) res += res.includes('?') ? '&rs=1' : '?rs=1'
        return res
      }
      return rewriteR2Url(r2Url, hasResponsiveSizes)
    }
    const legacyImg = isMobile ? raw?.imageMobile : isDesktop ? raw?.imageDesktop : raw?.image
    if (legacyImg) {
      const mapped = mapImage(legacyImg)
      if (mapped) return mapped
    }
    return rewriteR2Url(m?.url) || ''
  } else if (type === 'video') {
    const r2Url = isMobile
      ? m?.videoFileMobileR2?.url
      : isDesktop
        ? m?.videoFileDesktopR2?.url
        : m?.videoFileR2?.url
    if (r2Url) {
      if (r2Url.startsWith('migration/') && R2_DOMAIN)
        return `${R2_DOMAIN}/${r2Url}`.replace(/ /g, '%20')
      return rewriteR2Url(r2Url)
    }
    if ((isMobile || isDesktop) && m?.videoFileR2?.url) {
      const genericR2 = m.videoFileR2.url
      if (genericR2.startsWith('migration/') && R2_DOMAIN)
        return `${R2_DOMAIN}/${genericR2}`.replace(/ /g, '%20')
      return rewriteR2Url(genericR2)
    }
    const legacyVideo = isMobile
      ? raw?.videoFileMobile
      : isDesktop
        ? raw?.videoFileDesktop
        : raw?.videoFile
    if (legacyVideo?.asset?.url) return rewriteR2Url(legacyVideo.asset.url)
    const fallbackUrl = m?.url || ''
    if (fallbackUrl.includes('youtube.com') || fallbackUrl.includes('youtu.be')) return ''
    return rewriteR2Url(fallbackUrl) || ''
  }
  return m?.url || ''
}
