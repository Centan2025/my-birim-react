export type ProductReadinessStatus = 'READY' | 'NEEDS_ATTENTION' | 'INCOMPLETE' | 'NOT_FOR_SALE'

export interface ProductReadinessResult {
  status: ProductReadinessStatus
  isCommerceReady: boolean
  blockers: string[]
  warnings: string[]
  summary: string
}

export interface RawProductCandidate {
  _id?: string
  name?: {tr?: string; en?: string} | string
  id?: {current?: string} | string
  slug?: {current?: string} | string
  category?: {_ref?: string} | Record<string, unknown> | null
  isPublished?: boolean
  buyable?: boolean
  sale_enabled?: boolean
  sales_mode?: 'NONE' | 'DIRECT' | 'CONFIGURABLE' | 'QUOTE' | string
  price?: number | null
  currency?: string | null
  sku?: string | null
  stockStatus?: 'in_stock' | 'out_of_stock' | 'preorder' | string | null
  variants?: Array<{
    enabled?: boolean
    sku?: string | null
    price?: number | null
    compareAtPrice?: number | null
    options?: Array<{type?: string; value?: string; valueEn?: string}>
  }> | null
  media?: Array<{
    isCover?: boolean
    type?: string
    url?: string
    imageR2?: {url?: string}
  }> | null
  description?: {tr?: unknown; en?: unknown} | null
  designers?: Array<unknown> | null
  seo?: {metaTitle?: unknown; metaDescription?: unknown} | null
}

/**
 * Pure, deterministic commerce readiness engine for BİRİM products.
 * Evaluates real-time product schema snapshots without writing state to the database.
 */
export function getProductReadiness(product?: RawProductCandidate | null): ProductReadinessResult {
  if (!product) {
    return {
      status: 'INCOMPLETE',
      isCommerceReady: false,
      blockers: ['Ürün verisi bulunamadı.'],
      warnings: [],
      summary: 'Eksik Veri',
    }
  }

  const blockers: string[] = []
  const warnings: string[] = []

  // 1. Basic Content Verification
  const trName =
    typeof product.name === 'string'
      ? product.name.trim()
      : typeof product.name === 'object'
        ? (product.name?.tr || '').trim()
        : ''
  const enName = typeof product.name === 'object' ? (product.name?.en || '').trim() : ''

  if (!trName) {
    blockers.push('Ürün Türkçe adı (name.tr) eksik.')
  }
  if (!enName) {
    warnings.push('Ürün İngilizce adı (name.en) eksik.')
  }

  const slug =
    typeof product.id === 'string'
      ? product.id
      : typeof product.id === 'object'
        ? product.id?.current
        : typeof product.slug === 'string'
          ? product.slug
          : typeof product.slug === 'object'
            ? product.slug?.current
            : undefined

  if (!slug) {
    blockers.push('Ürün URL slug / ID eksik.')
  }

  if (!product.category) {
    blockers.push('Kategori seçilmemiş.')
  }

  const hasMedia = Array.isArray(product.media) && product.media.length > 0
  const hasCoverMedia =
    hasMedia && product.media!.some(m => m?.isCover === true || m?.url || m?.imageR2?.url)

  if (!hasMedia) {
    blockers.push('Ürün görseli / medyası eklenmemiş.')
  } else if (!hasCoverMedia) {
    warnings.push('Belirgin bir kapak görseli (isCover) seçilmemiş.')
  }

  // 2. Editorial / Quality Warnings
  if (!product.designers || product.designers.length === 0) {
    warnings.push('Tasarımcı atanmamış.')
  }
  if (!product.description || (!product.description.tr && !product.description.en)) {
    warnings.push('Açıklama metni girilmemiş.')
  }

  // 3. Commerce Verification
  const isSaleEnabled = product.sale_enabled === true
  const salesMode = (product.sales_mode || 'NONE').toUpperCase().trim()

  if (!isSaleEnabled) {
    // Product not configured for direct online sale
    return {
      status: 'NOT_FOR_SALE',
      isCommerceReady: false,
      blockers,
      warnings,
      summary: 'Online Satışa Kapalı',
    }
  }

  // Sale is enabled, strict commerce validation applies
  if (product.buyable !== true) {
    blockers.push('Satış açık fakat "Satın Alınabilir" (buyable) işareti kapalı.')
  }

  if (salesMode === 'NONE') {
    blockers.push('Satış açık fakat Satış Modu "NONE" (Satışa Kapalı) olarak bırakılmış.')
  } else if (salesMode === 'QUOTE') {
    blockers.push('QUOTE modu doğrudan commerce satışına uygun değildir (Teklif modu).')
  }

  // Stock status check
  const validStockStatuses = new Set(['in_stock', 'out_of_stock', 'preorder'])
  if (!product.stockStatus || !validStockStatuses.has(product.stockStatus)) {
    blockers.push('Geçerli bir stok durumu (in_stock, out_of_stock, preorder) seçilmemiş.')
  }

  if (salesMode === 'DIRECT') {
    if (product.price === undefined || product.price === null || product.price <= 0) {
      blockers.push('Doğrudan Satış (DIRECT) için geçerli ürün fiyatı girilmemiş.')
    }
    if (!product.currency || !product.currency.trim()) {
      blockers.push('Para birimi (TRY, EUR, USD) belirtilmemiş.')
    }
    if (!product.sku || !product.sku.trim()) {
      blockers.push('Stok Kodu (SKU) eksik.')
    }
  } else if (salesMode === 'CONFIGURABLE') {
    const variants = Array.isArray(product.variants) ? product.variants : []
    const enabledVariants = variants.filter(v => v?.enabled === true)

    if (variants.length === 0) {
      blockers.push('Varyantlı Satış (CONFIGURABLE) için hiç varyant tanımlanmamış.')
    } else if (enabledVariants.length === 0) {
      blockers.push(
        'Varyantlı Satış (CONFIGURABLE) için en az bir aktif (enabled) varyant gereklidir.'
      )
    } else {
      let missingVariantPriceCount = 0
      let missingVariantSkuCount = 0

      for (const v of enabledVariants) {
        if (v.price === undefined || v.price === null || v.price <= 0) {
          missingVariantPriceCount++
        }
        if (!v.sku || !v.sku.trim()) {
          missingVariantSkuCount++
        }
      }

      if (missingVariantPriceCount > 0) {
        blockers.push(`${missingVariantPriceCount} aktif varyantın fiyatı eksik veya geçersiz.`)
      }
      if (missingVariantSkuCount > 0) {
        blockers.push(`${missingVariantSkuCount} aktif varyantın SKU kodu eksik.`)
      }
    }
  }

  // 4. Final Status Evaluation
  if (blockers.length > 0) {
    return {
      status: 'NEEDS_ATTENTION',
      isCommerceReady: false,
      blockers,
      warnings,
      summary: `${blockers.length} Satış Engeli Tespit Edildi`,
    }
  }

  return {
    status: 'READY',
    isCommerceReady: true,
    blockers: [],
    warnings,
    summary: warnings.length > 0 ? `Satışa Hazır (${warnings.length} Uyarı)` : 'Satışa Tam Hazır',
  }
}
