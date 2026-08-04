import React, {useMemo} from 'react'
import {urlFor} from '../lib/imageUrl'
import {safeEncodePathSegment} from '../services/sanity/client'

interface R2Asset {
  url: string
  path: string
  width: number
  height: number
  alt?: string
  mimeType?: string
  hotspotX?: number
  hotspotY?: number
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
  hasResponsiveSizes?: boolean
}

// Removed unused SanityImage interface

interface R2ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  source?: R2Asset
  fallback?: unknown // Sanity Image Source
  alt: string // Make alt required as per best practices, or optional if you prefer
  width?: number
  height?: number
  quality?: number
  priority?: boolean
}

// Cloudflare Image Resizing URL Builder
const getR2Url = (
  path: string,
  options: {width?: number; height?: number; quality?: number},
  crop?: {x: number; y: number; w: number; h: number; origW: number; origH: number}
) => {
  const domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
  if (!domain) return undefined

  // Encode the path to prevent 404s on files with spaces or special characters
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  let finalPath = cleanPath

  // Most legacy R2 assets are actually under the 'migration/' prefix
  if (!cleanPath.startsWith('migration/') && cleanPath.startsWith('uploads/')) {
    finalPath = `migration/${cleanPath}`
  }

  const encodedPath = finalPath
    .split('/')
    .map(segment => safeEncodePathSegment(segment))
    .join('/')

  // .r2.dev ve .workers.dev (ve free plan custom domain) domainleri image resizing desteklemez
  const skipImageResizing =
    domain.includes('.r2.dev') ||
    domain.includes('.workers.dev') ||
    domain.includes('assets.birim.com')
  if (skipImageResizing) {
    return `${domain}/${encodedPath}`
  }

  const params = []

  // 1. Cropping (Rect)
  if (crop) {
    const pxX = Math.round(crop.x * crop.origW)
    const pxY = Math.round(crop.y * crop.origH)
    const pxW = Math.round(crop.w * crop.origW)
    const pxH = Math.round(crop.h * crop.origH)
    params.push(`rect=${pxX},${pxY},${pxW},${pxH}`)
  }

  // 2. Resizing
  if (options.width) params.push(`width=${options.width}`)
  if (options.height) params.push(`height=${options.height}`)
  if (options.quality) params.push(`quality=${options.quality}`)

  params.push('format=auto')

  return `${domain}/cdn-cgi/image/${params.join(',')}/${encodedPath}`
}

export const R2Image: React.FC<R2ImageProps> = ({
  source,
  fallback,
  alt,
  width,
  height,
  quality = 80,
  style,
  className,
  ...props
}) => {
  // 0. Extract Crop & Hotspot
  const normalizedCrop = useMemo(() => {
    if (!source) return undefined
    if (source.cropWidth !== undefined && source.cropWidth > 0) {
      return {
        x: source.cropX || 0,
        y: source.cropY || 0,
        w: source.cropWidth || 1,
        h: source.cropHeight || 1,
        origW: source.width,
        origH: source.height,
      }
    }
    return undefined
  }, [source])

  const hasCrop = !!(
    normalizedCrop &&
    normalizedCrop.w > 0 &&
    normalizedCrop.h > 0 &&
    (normalizedCrop.w < 0.999 ||
      normalizedCrop.h < 0.999 ||
      normalizedCrop.x > 0.001 ||
      normalizedCrop.y > 0.001)
  )

  const cropData = useMemo(() => {
    return hasCrop && normalizedCrop ? normalizedCrop : undefined
  }, [hasCrop, normalizedCrop])

  // 1. Try R2 Source First
  const r2Src = useMemo(() => {
    if (!source || !source.path) return undefined
    return getR2Url(source.path, {width, height, quality}, cropData)
  }, [source, width, height, quality, cropData])

  // 2. Generate SrcSet for R2
  const r2SrcSet = useMemo(() => {
    if (!source || !source.path) return undefined
    const domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
    const skipImageResizing =
      domain.includes('.r2.dev') ||
      domain.includes('.workers.dev') ||
      domain.includes('assets.birim.com')

    if (skipImageResizing) {
      if (source.hasResponsiveSizes) {
        const cleanUrl = `${domain}/${source.path}`
        return [
          `${cleanUrl.replace(/\.webp$/, '-400w.webp')} 400w`,
          `${cleanUrl.replace(/\.webp$/, '-800w.webp')} 800w`,
          `${cleanUrl.replace(/\.webp$/, '-1600w.webp')} 1600w`,
          `${cleanUrl} 2560w`,
        ].join(', ')
      }
      return undefined
    }

    const widths = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
    return widths
      .map(w => {
        const url = getR2Url(source.path, {width: w, quality}, cropData)
        return url ? `${url} ${w}w` : null
      })
      .filter(Boolean)
      .join(', ')
  }, [source, quality, cropData])

  // Calculate object-position from hotspot
  const objectPosition = useMemo(() => {
    if (source?.hotspotX !== undefined && source?.hotspotY !== undefined) {
      return `${source.hotspotX * 100}% ${source.hotspotY * 100}%`
    }
    return undefined
  }, [source?.hotspotX, source?.hotspotY])

  // 3. Fallback: Sanity Image Logic
  if (!r2Src && !fallback) {
    return null
  }

  // If R2 exists
  if (r2Src) {
    const domain = import.meta.env['VITE_R2_DOMAIN'] || 'https://assets.birim.com'
    const skipImageResizing =
      domain.includes('.r2.dev') ||
      domain.includes('.workers.dev') ||
      domain.includes('assets.birim.com')

    if (hasCrop && skipImageResizing && normalizedCrop) {
      const scaleX = (1 / normalizedCrop.w) * 100
      const scaleY = (1 / normalizedCrop.h) * 100
      const leftPercent = -(normalizedCrop.x / normalizedCrop.w) * 100
      const topPercent = -(normalizedCrop.y / normalizedCrop.h) * 100

      return (
        <div
          className={`relative overflow-hidden ${className || ''}`}
          style={{width, height, ...style}}
        >
          <div
            style={{
              position: 'absolute',
              width: `${scaleX.toFixed(4)}%`,
              height: `${scaleY.toFixed(4)}%`,
              left: `${leftPercent.toFixed(4)}%`,
              top: `${topPercent.toFixed(4)}%`,
            }}
          >
            <img
              src={r2Src}
              srcSet={r2SrcSet}
              alt={source?.alt || alt}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              {...props}
            />
          </div>
        </div>
      )
    }

    return (
      <img
        src={r2Src}
        srcSet={r2SrcSet}
        alt={source?.alt || alt}
        width={width}
        height={height}
        className={className}
        style={
          {
            objectFit: 'cover',
            objectPosition,
            WebkitBackfaceVisibility: 'hidden', // Titreme ve bozulmaları önlemek için GPU tetikler
            ...style,
          } as React.CSSProperties
        }
        loading="lazy"
        decoding="async"
        {...props}
      />
    )
  }

  // Fallback to Sanity
  let builder = urlFor(fallback)
  if (width) builder = builder.width(width)
  if (height) builder = builder.height(height)
  if (quality) builder = builder.quality(quality)

  return (
    <img
      src={builder.url() || undefined}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{objectFit: 'cover', ...style}}
      loading="lazy"
      decoding="async"
      {...props}
    />
  )
}
