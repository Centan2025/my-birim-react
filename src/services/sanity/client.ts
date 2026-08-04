import {createClient} from '@sanity/client'
import type {SanityImagePalette, R2ImageMetadata, LocalizedString} from '../../types'

// Not: Çevresel değişkenler Vite config ile yüklenmektedir.
// Ancak import.meta bazen hata fırlattığından any olarak tip çevrimi yapıyor olabilir.

export const SANITY_PROJECT_ID = import.meta.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
export const SANITY_DATASET = import.meta.env['VITE_SANITY_DATASET'] || 'production'
export const SANITY_API_VERSION = import.meta.env['VITE_SANITY_API_VERSION'] || '2025-01-01'
export const useSanity = Boolean(SANITY_PROJECT_ID && SANITY_DATASET)

const rawR2Domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
export const R2_DOMAIN = rawR2Domain.startsWith('http') ? rawR2Domain : `https://${rawR2Domain}`

const rawOriginDomain = import.meta.env['VITE_R2_ORIGIN_DOMAIN'] || 'https://assets.birim.com'
export const R2_ORIGIN_DOMAIN = rawOriginDomain.startsWith('http')
  ? rawOriginDomain
  : `https://${rawOriginDomain}`

const defaultEnableFallback = import.meta.env.PROD ? 'false' : 'true'
export const ENABLE_LOCAL_FALLBACK =
  String(
    (import.meta as ImportMeta).env?.['VITE_ENABLE_LOCAL_FALLBACK'] ?? defaultEnableFallback
  ).toLowerCase() !== 'false'

// Preview mode detection
const getPreviewToken = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const token = params.get('preview') || hashParams.get('preview')
  if (token) {
    sessionStorage.setItem('sanity_preview_mode', token)
    return token
  }
  return sessionStorage.getItem('sanity_preview_mode')
}

const previewToken = getPreviewToken()

const rawSanity = useSanity
  ? createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: false,
      token: previewToken || undefined,
      perspective: previewToken ? 'drafts' : 'published',
      ignoreBrowserTokenWarning: true,
    })
  : null

if (rawSanity && typeof window !== 'undefined') {
  const sanityClientObj = rawSanity as unknown as {
    fetch: (query: string, params?: unknown, options?: unknown) => Promise<unknown>
  }
  const originalFetch = sanityClientObj.fetch.bind(sanityClientObj)
  sanityClientObj.fetch = async (query: string, params?: unknown, options?: unknown) => {
    try {
      return await originalFetch(query, params, options)
    } catch (err) {
      console.warn(
        'Primary Sanity fetch failed (Opera/AdBlocker), retrying via same-origin proxy:',
        err
      )
      try {
        const proxyUrl = new URL('/api/sanity/query', window.location.origin)
        proxyUrl.searchParams.set('query', query)
        proxyUrl.searchParams.set('perspective', previewToken ? 'drafts' : 'published')
        if (params && typeof params === 'object') {
          for (const [key, val] of Object.entries(params)) {
            proxyUrl.searchParams.set(
              `$${key}`,
              typeof val === 'string' ? `"${val}"` : JSON.stringify(val)
            )
          }
        }
        const res = await window.fetch(proxyUrl.toString(), {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            ...(previewToken ? {Authorization: `Bearer ${previewToken}`} : {}),
          },
        })
        if (res.ok) {
          const json = (await res.json()) as {result?: unknown}
          return json.result
        }
      } catch (fallbackErr) {
        console.error('Proxy fallback also failed:', fallbackErr)
      }
      throw err
    }
  }
}

export const sanity = rawSanity

// SANITY_TOKEN artık sadece server-side (Vercel API) tarafında kullanılmaktadır.
export const SANITY_TOKEN = ''
export const sanityMutations = null

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
}

export const safeEncodePathSegment = (segment: string): string => {
  if (!segment) return ''
  const trimmed = segment.trim()
  let decoded = trimmed
  try {
    decoded = decodeURIComponent(trimmed)
  } catch {
    decoded = trimmed
  }
  try {
    return encodeURIComponent(decoded)
      .replace(/%2F/g, '/')
      .replace(/%3A/g, ':')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
  } catch {
    return encodeURI(decoded)
  }
}

export const rewriteR2Url = (url: string | undefined, _hasResponsiveSizes?: boolean): string => {
  if (!url || typeof url !== 'string') return url || ''

  const urlParts = url.split('?')
  let result = urlParts[0] || ''
  const searchParams = urlParts[1] || ''

  // Varsayılan CDN domainimiz
  const fallbackCdn = 'https://birim-assets.web-birim.workers.dev'
  const activeDomain = R2_DOMAIN && !R2_DOMAIN.includes('.r2.dev') ? R2_DOMAIN : fallbackCdn
  const targetDomainNoProtocol = activeDomain.replace(/^https?:\/\//, '')

  // 1. Tüm r2.dev ve varsayılan harici domainleri aktif CDN domaini ile değiştir
  if (result.includes('.r2.dev')) {
    result = result
      .replace(/^(https?:\/\/)?([^/]+\.r2\.dev)/i, activeDomain)
      .replace(/https?:\/\/[^/]+\.r2\.dev/gi, activeDomain)
  }
  if (result.includes('.workers.dev') && !activeDomain.includes('.workers.dev')) {
    result = result
      .replace(/^(https?:\/\/)?([^/]+\.workers\.dev)/i, activeDomain)
      .replace(/https?:\/\/[^/]+\.workers\.dev/gi, activeDomain)
  }
  if (result.startsWith('http://assets.birim.com')) {
    result = result.replace('http://assets.birim.com', 'https://assets.birim.com')
  }

  // 2. Relatif yolları mutlak yap (lokal public görsellere /img/ dokunma)
  if (
    !result.startsWith('http') &&
    !result.startsWith('/img/') &&
    !result.startsWith('img/') &&
    !result.startsWith('/logo') &&
    !result.startsWith('data:') &&
    result.length > 0
  ) {
    if (result.startsWith(targetDomainNoProtocol)) {
      const cleanPath = result.replace(targetDomainNoProtocol, '').startsWith('/')
        ? result.replace(targetDomainNoProtocol, '').substring(1)
        : result.replace(targetDomainNoProtocol, '')
      result = `${activeDomain}/${cleanPath}`
    } else {
      const cleanPath = result.startsWith('/') ? result.substring(1) : result
      result = `${activeDomain}/${cleanPath}`
    }
  }

  // 3. Segment bazlı güvenli temizlik ve encode (Türkçe ve özel karakterleri HTTP/2 uyumlu hale getirir)
  try {
    const parts = result.split('/')
    result = parts
      .map((p, i) => {
        if (i < 3 && (p.includes(':') || (i === 2 && parts[0]?.includes(':')))) return p // protocol & domain
        return safeEncodePathSegment(p)
      })
      .join('/')
  } catch {
    /* ignore */
  }

  // 4. Params ekle / temizle
  let finalUrl = result
  const params = new URLSearchParams(searchParams || '')
  params.delete('rs') // Kırık srcset ve 404 oluşturan rs=1 sorgu parametresini temizle

  const queryString = params.toString()
  if (queryString) {
    finalUrl += '?' + queryString
  }

  return finalUrl
}

export const mapImage = (img: SanityImageLike | undefined): string => {
  if (!img) return ''
  if (typeof img === 'string') return rewriteR2Url(img)

  try {
    const i = img as Record<string, unknown>
    const r2Asset = i['r2Asset'] as Record<string, unknown> | undefined
    const r2Url = r2Asset?.['url'] as string | undefined
    const standardUrl = i['url'] as string | undefined
    const asset = i['asset'] as Record<string, unknown> | string | undefined
    const assetUrl = typeof asset === 'string' ? asset : (asset?.['url'] as string | undefined)

    const rawUrl = r2Url || standardUrl || assetUrl
    const hasResponsiveSizes = Boolean(r2Asset?.['hasResponsiveSizes'] || i['hasResponsiveSizes'])

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

    const parseCropObj = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return undefined
      const c = obj as Record<string, unknown>
      if (c['cropX'] !== undefined && c['cropWidth'] !== undefined) {
        return {
          x: Number(c['cropX']) || 0,
          y: Number(c['cropY']) || 0,
          width: Number(c['cropWidth']) || 1,
          height: Number(c['cropHeight']) || 1,
        }
      }
      if (c['crop'] && typeof c['crop'] === 'object') {
        return parseCropObj(c['crop'])
      }
      if (c['x'] !== undefined && c['width'] !== undefined) {
        return {
          x: Number(c['x']) || 0,
          y: Number(c['y']) || 0,
          width: Number(c['width']) || 1,
          height: Number(c['height']) || 1,
        }
      }
      if (
        c['left'] !== undefined ||
        c['top'] !== undefined ||
        c['right'] !== undefined ||
        c['bottom'] !== undefined
      ) {
        const left = Number(c['left']) || 0
        const top = Number(c['top']) || 0
        const right = Number(c['right']) || 0
        const bottom = Number(c['bottom']) || 0
        return {
          x: left,
          y: top,
          width: Math.max(0.001, 1 - left - right),
          height: Math.max(0.001, 1 - top - bottom),
        }
      }
      return undefined
    }

    const parseHotspotObj = (obj: unknown) => {
      if (!obj || typeof obj !== 'object') return undefined
      const h = obj as Record<string, unknown>
      if (h['hotspotX'] !== undefined && h['hotspotY'] !== undefined) {
        return {x: Number(h['hotspotX']) || 0.5, y: Number(h['hotspotY']) || 0.5}
      }
      if (h['hotspot'] && typeof h['hotspot'] === 'object') {
        return parseHotspotObj(h['hotspot'])
      }
      if (h['x'] !== undefined && h['y'] !== undefined) {
        return {x: Number(h['x']) || 0.5, y: Number(h['y']) || 0.5}
      }
      return undefined
    }

    const extractDimsFromUrl = (val: unknown): {w?: number; h?: number} => {
      if (!val) return {}
      let str = ''
      if (typeof val === 'string') str = val
      else if (typeof val === 'object' && val !== null && 'url' in val)
        str = String((val as {url: unknown}).url)
      else if (typeof val === 'object' && val !== null && 'asset' in val) {
        const asset = (val as {asset: unknown}).asset
        if (typeof asset === 'string') str = asset
        else if (typeof asset === 'object' && asset !== null && 'url' in asset)
          str = String((asset as {url: unknown}).url)
        else if (typeof asset === 'object' && asset !== null && '_ref' in asset)
          str = String((asset as {_ref: unknown})._ref)
      }

      // Sanity / Asset name pattern: -1920x1080.webp or _1920x1080.webp
      const match = str.match(/[-_](\d{2,5})x(\d{2,5})[._]/i)
      if (match) {
        return {w: Number(match[1]), h: Number(match[2])}
      }

      // Query params pattern: w=1920&h=1080 or width=1920&height=1080
      const wMatch = str.match(/[?&](?:w|width)=(\d+)/i)
      const hMatch = str.match(/[?&](?:h|height)=(\d+)/i)
      if (wMatch && hMatch) {
        return {w: Number(wMatch[1]), h: Number(hMatch[2])}
      }

      return {}
    }

    const targetObj = (i['imageR2'] || i['image'] || i) as Record<string, unknown>
    const dims = extractDimsFromUrl(targetObj)
    const origWidth =
      Number(targetObj['width'] || targetObj['origWidth'] || i['width'] || i['origWidth']) || dims.w
    const origHeight =
      Number(targetObj['height'] || targetObj['origHeight'] || i['height'] || i['origHeight']) ||
      dims.h

    const normalizeCrop = (
      c: {x: number; y: number; width: number; height: number} | undefined,
      w?: number,
      h?: number
    ) => {
      if (!c) return undefined
      let {x, y, width, height} = c
      if (width > 1 && w && w > 0) {
        x = x / w
        width = width / w
      }
      if (height > 1 && h && h > 0) {
        y = y / h
        height = height / h
      }
      return {x, y, width, height}
    }

    const rawCrop = parseCropObj(targetObj) || parseCropObj(i)
    const crop = normalizeCrop(rawCrop, origWidth, origHeight)
    const hotspot = parseHotspotObj(targetObj) || parseHotspotObj(i)
    const isMirrored =
      targetObj['isMirrored'] !== undefined
        ? !!targetObj['isMirrored']
        : i['isMirrored'] !== undefined
          ? !!i['isMirrored']
          : undefined

    const mobileAsset = i['imageMobileR2'] || i['imageMobile'] || targetObj['imageMobile']
    const dimsMobile = extractDimsFromUrl(mobileAsset)
    const origWidthMobile =
      Number(
        i['origWidthMobile'] ||
          i['widthMobile'] ||
          targetObj['origWidthMobile'] ||
          targetObj['widthMobile']
      ) ||
      dimsMobile.w ||
      origWidth
    const origHeightMobile =
      Number(
        i['origHeightMobile'] ||
          i['heightMobile'] ||
          targetObj['origHeightMobile'] ||
          targetObj['heightMobile']
      ) ||
      dimsMobile.h ||
      origHeight

    const rawCropMobile =
      parseCropObj(mobileAsset) ||
      parseCropObj(i['cropMobile']) ||
      parseCropObj(targetObj['cropMobile'])
    const cropMobile = normalizeCrop(rawCropMobile, origWidthMobile, origHeightMobile)
    const hotspotMobile =
      parseHotspotObj(mobileAsset) ||
      parseHotspotObj(i['hotspotMobile']) ||
      parseHotspotObj(targetObj['hotspotMobile'])

    return {
      crop,
      hotspot,
      origWidth,
      origHeight,
      isMirrored,
      cropMobile,
      hotspotMobile,
      origWidthMobile,
      origHeightMobile,
    }
  } catch (err) {
    console.error('Error in mapR2Metadata:', err)
    return {}
  }
}

export const mapImages = (imgs: SanityImageLike[] | undefined): string[] =>
  Array.isArray(imgs) ? imgs.map(i => mapImage(i)).filter(Boolean) : []

export const extractPalette = (img: unknown): SanityImagePalette | undefined => {
  if (!img || typeof img !== 'object') return undefined
  const i = img as Record<string, unknown>

  if (i['palette']) return i['palette'] as SanityImagePalette

  const targetObj = (i['imageR2'] || i['image'] || i) as Record<string, unknown>
  if (targetObj['palette']) return targetObj['palette'] as SanityImagePalette

  const asset = (targetObj['asset'] || i['asset']) as Record<string, unknown> | undefined
  const metadata = asset?.['metadata'] as Record<string, unknown> | undefined
  return metadata?.['palette'] as SanityImagePalette | undefined
}

export const mapMediaUrl = (
  m: SanityProductMediaItem,
  isMobile?: boolean,
  isDesktop?: boolean
): string => {
  if (!m) return ''
  let type = m?.type

  // Type bilgisi Sanity'den boş gelirse R2 objelerinden akıllı çıkarım yap
  if (!type) {
    if (m?.videoFileR2?.url || m?.videoFileMobileR2?.url || m?.videoFileDesktopR2?.url) {
      type = 'video'
    } else if (
      m?.imageR2?.url ||
      m?.imageMobileR2?.url ||
      m?.imageDesktopR2?.url ||
      (m as Record<string, unknown>)['image'] ||
      (m as Record<string, unknown>)['asset'] ||
      m?.url
    ) {
      type = 'image'
    }
  }

  if (type === 'image') {
    const r2Url =
      (isMobile ? m?.imageMobileR2?.url : isDesktop ? m?.imageDesktopR2?.url : undefined) ||
      (isMobile
        ? undefined
        : isDesktop
          ? undefined
          : m?.imageR2?.url || m?.imageDesktopR2?.url || m?.imageMobileR2?.url)
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

    const rec = m as Record<string, unknown>
    const stdObj = isMobile
      ? rec['imageMobile'] || rec['image']
      : isDesktop
        ? rec['imageDesktop'] || rec['image']
        : rec['image']
    const stdUrl =
      mapImage(stdObj as SanityImageLike) || mapImage(rec['asset'] as SanityImageLike) || m?.url
    return rewriteR2Url(stdUrl) || ''
  } else if (type === 'video') {
    const r2Url =
      (isMobile ? m?.videoFileMobileR2?.url : isDesktop ? m?.videoFileDesktopR2?.url : undefined) ||
      m?.videoFileR2?.url ||
      m?.videoFileMobileR2?.url ||
      m?.videoFileDesktopR2?.url
    if (r2Url) {
      return rewriteR2Url(r2Url)
    }

    const fallbackUrl = m?.url || ''
    if (fallbackUrl.includes('youtube.com') || fallbackUrl.includes('youtu.be')) return ''
    return rewriteR2Url(fallbackUrl) || ''
  }
  return rewriteR2Url(m?.url) || ''
}
