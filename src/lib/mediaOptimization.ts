import imageUrlBuilder from '@sanity/image-url'
import {sanityClient} from './sanityClient'

const builder = imageUrlBuilder(sanityClient)

/**
 * Optimize edilmiş görsel URL'i oluşturur
 * @param source Sanity image asset
 * @param options Optimizasyon seçenekleri
 */
export const getOptimizedImageUrl = (
  source: any,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
    fit?: 'clip' | 'crop' | 'fill' | 'fillmax' | 'max' | 'scale' | 'min'
    auto?: 'format'
  } = {}
): string => {
  if (!source) return ''

  // Eğer zaten URL ise (Sanity asset değilse), olduğu gibi döndür
  if (typeof source === 'string') return source
  if (source.url) return source.url

  if (!builder) return ''

  let imageBuilder = builder.image(source)

  // Varsayılan optimizasyon ayarları
  const {
    width,
    height,
    quality = 85, // Yüksek kalite ama optimize
    format = 'webp', // WebP formatı (daha küçük dosya boyutu)
    fit = 'max', // Orijinal aspect ratio'yu koru
    auto = 'format', // Otomatik format seçimi
  } = options

  // Width ve height ayarla
  if (width) {
    imageBuilder = imageBuilder.width(width)
  }
  if (height) {
    imageBuilder = imageBuilder.height(height)
  }

  // Format ve kalite ayarla
  // Sanity ImageFormat tipi sadece 'webp', 'jpg', 'png' destekleniyor
  imageBuilder = imageBuilder.quality(quality).format(format).fit(fit)

  // Auto format (WebP desteklenmiyorsa otomatik fallback)
  if (auto === 'format') {
    imageBuilder = imageBuilder.auto('format')
  }

  return imageBuilder.url() || ''
}

/**
 * Responsive image srcset oluşturur
 * @param source Sanity image asset
 * @param sizes Farklı ekran boyutları için genişlikler
 */
export const getResponsiveImageSrcSet = (
  source: any,
  sizes: number[] = [400, 800, 1200, 1600, 2000]
): string => {
  if (!source) return ''

  return sizes
    .map(width => {
      const url = getOptimizedImageUrl(source, {width, quality: 85, format: 'webp'})
      return url ? `${url} ${width}w` : ''
    })
    .filter(Boolean)
    .join(', ')
}

/**
 * Video optimizasyonu için poster image URL'i oluşturur
 * @param source Sanity image asset veya video asset
 */
export const getVideoPosterUrl = (source: any): string => {
  if (!source) return ''

  // Eğer image asset ise, küçük bir poster oluştur
  if (source._type === 'image' || source.asset?._type === 'image') {
    return getOptimizedImageUrl(source, {
      width: 1280,
      height: 720,
      quality: 80,
      format: 'webp',
      fit: 'crop',
    })
  }

  return ''
}

/**
 * Lazy loading için görsel yüklenene kadar placeholder gösterir
 */
export const getImagePlaceholder = (): string => {
  // SVG placeholder (çok küçük, base64 encoded)
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4='
}
