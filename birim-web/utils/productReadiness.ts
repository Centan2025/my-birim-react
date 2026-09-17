export type ProductReadinessStatus = 'READY' | 'NEEDS_ATTENTION' | 'INCOMPLETE' | 'NOT_FOR_SALE'

export interface ProductReadinessResult {
  status: ProductReadinessStatus
  isCommerceReady: boolean
  blockers: string[]
  warnings: string[]
  summary: string
  catalogDimensionsCount?: number
  shopDimensionsCount?: number
  catalogMaterialsCount?: number
  shopMaterialsCount?: number
  activeVariantsCount?: number
  totalVariantsCount?: number
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
  dimensionImages?: Array<{_key?: string; title?: unknown; imageR2?: unknown}> | null
  materialSelections?: Array<{
    group?: unknown
    materials?: Array<{_key?: string; name?: unknown}>
  }> | null
  selectedDimensions?: Array<{dimensionKey?: string; title?: unknown; enabled?: boolean}> | null
  selectedMaterials?: Array<{materialKey?: string; name?: unknown; enabled?: boolean}> | null
  variants?: Array<{
    enabled?: boolean
    sku?: string | null
    price?: number | null
    compareAtPrice?: number | null
    dimensionKey?: string | null
    materialKey?: string | null
    options?: Array<{name?: string; value?: string; type?: string; valueEn?: string}>
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
 * Pure, deterministic commerce readiness engine for BİRİM products in Sanity Studio.
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
    hasMedia && product.media!.some((m) => m?.isCover === true || m?.url || m?.imageR2?.url)

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

  // Catalog Options Calculation
  const catalogDimensionsCount = Array.isArray(product.dimensionImages)
    ? product.dimensionImages.length
    : 0
  let catalogMaterialsCount = 0
  if (Array.isArray(product.materialSelections)) {
    for (const ms of product.materialSelections) {
      if (Array.isArray(ms?.materials)) {
        catalogMaterialsCount += ms.materials.length
      }
    }
  }

  const shopDimensionsCount = Array.isArray(product.selectedDimensions)
    ? product.selectedDimensions.filter((d) => d?.enabled !== false).length
    : 0
  const shopMaterialsCount = Array.isArray(product.selectedMaterials)
    ? product.selectedMaterials.filter((m) => m?.enabled !== false).length
    : 0

  const variants = Array.isArray(product.variants) ? product.variants : []
  const totalVariantsCount = variants.length
  const enabledVariants = variants.filter((v) => v?.enabled === true)
  const activeVariantsCount = enabledVariants.length

  // 3. Commerce Verification
  const isSaleEnabled = product.sale_enabled === true
  const salesMode = (product.sales_mode || 'NONE').toUpperCase().trim()

  if (!isSaleEnabled) {
    return {
      status: 'NOT_FOR_SALE',
      isCommerceReady: false,
      blockers,
      warnings,
      summary: 'Online Satışa Kapalı',
      catalogDimensionsCount,
      shopDimensionsCount,
      catalogMaterialsCount,
      shopMaterialsCount,
      activeVariantsCount,
      totalVariantsCount,
    }
  }

  if (product.buyable !== true) {
    blockers.push('Satış açık fakat "E-Ticarette Satılabilir" (buyable) işareti kapalı.')
  }

  if (salesMode === 'NONE') {
    blockers.push('Satış açık fakat Satış Modu "NONE" (Satışa Kapalı) olarak bırakılmış.')
  } else if (salesMode === 'QUOTE') {
    blockers.push('QUOTE modu doğrudan commerce satışına uygun değildir (Teklif modu).')
  }

  const validStockStatuses = new Set(['in_stock', 'out_of_stock', 'preorder'])
  if (!product.stockStatus || !validStockStatuses.has(product.stockStatus)) {
    blockers.push('Geçerli bir stok durumu (in_stock, out_of_stock, preorder) seçilmelidir.')
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
    if (variants.length === 0) {
      blockers.push('Varyantlı Satış (CONFIGURABLE) için hiç varyant tanımlanmamış.')
    } else if (enabledVariants.length === 0) {
      blockers.push(
        'Varyantlı Satış (CONFIGURABLE) için en az bir aktif (enabled) varyant gereklidir.',
      )
    } else {
      // Build catalog key indexes
      const catalogDimensionKeys = new Set<string>()
      if (Array.isArray(product.dimensionImages)) {
        for (const d of product.dimensionImages) {
          if (d?._key) catalogDimensionKeys.add(String(d._key))
        }
      }

      const catalogMaterialKeys = new Set<string>()
      if (Array.isArray(product.materialSelections)) {
        for (const ms of product.materialSelections) {
          if (Array.isArray(ms?.materials)) {
            for (const m of ms.materials) {
              if (m?._key) catalogMaterialKeys.add(String(m._key))
            }
          }
          const group = ms?.group as {books?: Array<{items?: Array<{_key?: string}>}>} | undefined
          if (Array.isArray(group?.books)) {
            for (const b of group.books) {
              if (Array.isArray(b?.items)) {
                for (const item of b.items) {
                  if (item?._key) catalogMaterialKeys.add(String(item._key))
                }
              }
            }
          }
        }
      }

      const hasSelectedDimensions = Array.isArray(product.selectedDimensions)
      const hasSelectedMaterials = Array.isArray(product.selectedMaterials)

      const enabledShopDimensionKeys = new Set<string>()
      if (hasSelectedDimensions) {
        for (const sd of product.selectedDimensions!) {
          if (sd?.enabled !== false && sd?.dimensionKey) {
            enabledShopDimensionKeys.add(String(sd.dimensionKey))
          }
        }
      }

      const enabledShopMaterialKeys = new Set<string>()
      if (hasSelectedMaterials) {
        for (const sm of product.selectedMaterials!) {
          if (sm?.enabled !== false && sm?.materialKey) {
            enabledShopMaterialKeys.add(String(sm.materialKey))
          }
        }
      }

      const isStructuredModel =
        hasSelectedDimensions ||
        hasSelectedMaterials ||
        variants.some((v) => Boolean(v?.dimensionKey || v?.materialKey))

      let missingVariantPriceCount = 0
      let missingVariantSkuCount = 0
      let validSellableVariantCount = 0

      for (const v of enabledVariants) {
        let isVariantValid = true

        if (v.price === undefined || v.price === null || v.price <= 0) {
          missingVariantPriceCount++
          isVariantValid = false
        }
        if (!v.sku || !v.sku.trim()) {
          missingVariantSkuCount++
          isVariantValid = false
        }

        if (isStructuredModel) {
          // Dimension key linkage validation
          if (v.dimensionKey) {
            const dimKey = String(v.dimensionKey)
            if (catalogDimensionKeys.size > 0 && !catalogDimensionKeys.has(dimKey)) {
              blockers.push(
                `Varyant (${v.sku || 'SKU yok'}) için bağlı katalog ölçüsü bulunamadı (${dimKey}): Catalog option reference unavailable.`,
              )
              isVariantValid = false
            } else if (hasSelectedDimensions && !enabledShopDimensionKeys.has(dimKey)) {
              blockers.push(
                `Varyant (${v.sku || 'SKU yok'}) için seçilen ölçü (${dimKey}) Shop satış listesinde (selectedDimensions) aktif değil.`,
              )
              isVariantValid = false
            }
          } else if (hasSelectedDimensions && product.selectedDimensions!.length > 0) {
            blockers.push(
              `Varyant (${v.sku || 'SKU yok'}) için ölçü seçimi (dimensionKey) atanmamış.`,
            )
            isVariantValid = false
          }

          // Material key linkage validation
          if (v.materialKey) {
            const matKey = String(v.materialKey)
            if (catalogMaterialKeys.size > 0 && !catalogMaterialKeys.has(matKey)) {
              blockers.push(
                `Varyant (${v.sku || 'SKU yok'}) için bağlı katalog malzemesi bulunamadı (${matKey}): Catalog option reference unavailable.`,
              )
              isVariantValid = false
            } else if (hasSelectedMaterials && !enabledShopMaterialKeys.has(matKey)) {
              blockers.push(
                `Varyant (${v.sku || 'SKU yok'}) için seçilen malzeme (${matKey}) Shop satış listesinde (selectedMaterials) aktif değil.`,
              )
              isVariantValid = false
            }
          } else if (hasSelectedMaterials && product.selectedMaterials!.length > 0) {
            blockers.push(
              `Varyant (${v.sku || 'SKU yok'}) için malzeme seçimi (materialKey) atanmamış.`,
            )
            isVariantValid = false
          }
        }

        if (isVariantValid) {
          validSellableVariantCount++
        }
      }

      if (missingVariantPriceCount > 0) {
        blockers.push(`${missingVariantPriceCount} aktif varyantın fiyatı eksik veya geçersiz.`)
      }
      if (missingVariantSkuCount > 0) {
        blockers.push(`${missingVariantSkuCount} aktif varyantın SKU kodu eksik.`)
      }

      if (validSellableVariantCount === 0) {
        blockers.push('Satışa hazır en az bir geçerli aktif varyant bulunmalıdır.')
      }
    }
  }

  if (blockers.length > 0) {
    return {
      status: 'NEEDS_ATTENTION',
      isCommerceReady: false,
      blockers,
      warnings,
      summary: `${blockers.length} Satış Engeli`,
      catalogDimensionsCount,
      shopDimensionsCount,
      catalogMaterialsCount,
      shopMaterialsCount,
      activeVariantsCount,
      totalVariantsCount,
    }
  }

  return {
    status: 'READY',
    isCommerceReady: true,
    blockers: [],
    warnings,
    summary: warnings.length > 0 ? `Satışa Hazır (${warnings.length} Uyarı)` : 'Satışa Tam Hazır',
    catalogDimensionsCount,
    shopDimensionsCount,
    catalogMaterialsCount,
    shopMaterialsCount,
    activeVariantsCount,
    totalVariantsCount,
  }
}

/**
 * Returns user-facing status explanation for commerce toggles & mode
 */
export function getCommerceStateDescription(product?: RawProductCandidate | null): string {
  if (!product) return 'Ürün verisi eksik.'
  const buyable = product.buyable === true
  const saleEnabled = product.sale_enabled === true
  const salesMode = (product.sales_mode || 'NONE').toUpperCase().trim()

  if (salesMode === 'QUOTE') {
    return 'Bu ürün teklif talebi ile yönetilir; doğrudan satın alma yapılmaz.'
  }
  if (salesMode === 'NONE' || (!buyable && !saleEnabled)) {
    return 'Bu ürün e-ticaret satışı için kullanılmaz.'
  }
  if (!buyable) {
    return 'Bu ürün e-ticaret satın alma akışına kapalıdır.'
  }
  if (buyable && !saleEnabled) {
    return 'Ürün e-ticarete uygundur ancak satış şu anda kapalıdır.'
  }
  if (buyable && saleEnabled) {
    if (salesMode === 'DIRECT') {
      return 'Ürün doğrudan satışa açıktır.'
    }
    if (salesMode === 'CONFIGURABLE') {
      return 'Geçerli varyantlar tamamlandığında ürün satın alınabilir.'
    }
  }
  return 'Bu ürün e-ticaret satışı için kullanılmaz.'
}
