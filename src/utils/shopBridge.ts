import type {Product} from '../types'

/**
 * Interface representing candidates for Shop Bridge evaluation.
 */
export interface ShopBridgeProductCandidate {
  id?: string
  slug?: string | {current?: string}
  buyable?: boolean
  sale_enabled?: boolean
  sales_mode?: string
  commerce_enabled?: boolean
  [key: string]: unknown
}

export interface ShopBridgeOptions {
  commerce_enabled?: boolean
}

/**
 * Resolves the target BİRİM SHOP base URL.
 * In development/staging, can be overridden with VITE_SHOP_URL.
 */
export function getShopBaseUrl(): string {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SHOP_URL']
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '')
  }
  return 'https://shop.birim.com'
}

/**
 * Determines whether the SHOP navigation button / link should be visible.
 * Defaults to visible in local development (localhost or DEV mode),
 * or when explicitly enabled via VITE_SHOP_ENABLED or settings.isShopVisible.
 */
export function isShopNavVisible(settings?: {isShopVisible?: boolean}): boolean {
  if (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SHOP_ENABLED'] === 'true') {
    return true
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.['VITE_SHOP_ENABLED'] === 'false') {
    return false
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return true
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return true
  }
  if (settings?.isShopVisible === true) {
    return true
  }
  return false
}

/**
 * Safely extracts a valid URL slug from a Product, candidate object, or raw string.
 * Strictly rejects empty strings, whitespace, 'undefined', 'null', or object IDs without a slug.
 */
export function extractProductSlug(
  productOrSlug?: Product | ShopBridgeProductCandidate | string | null
): string | null {
  if (!productOrSlug) return null

  if (typeof productOrSlug === 'string') {
    const clean = productOrSlug.trim()
    if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') {
      return null
    }
    return clean
  }

  const candidate = productOrSlug as ShopBridgeProductCandidate
  const rawSlug =
    typeof candidate.slug === 'string'
      ? candidate.slug
      : typeof candidate.slug === 'object' && candidate.slug
        ? candidate.slug.current
        : null

  if (!rawSlug || typeof rawSlug !== 'string') {
    return null
  }

  const clean = rawSlug.trim()
  if (!clean || clean.toLowerCase() === 'undefined' || clean.toLowerCase() === 'null') {
    return null
  }

  return clean
}

/**
 * Evaluates whether a product is eligible for direct online purchase on BİRİM SHOP.
 * Authoritative Rule:
 * 1. commerce_enabled !== false (global & product level)
 * 2. buyable === true
 * 3. sale_enabled === true
 * 4. sales_mode !== 'NONE' && sales_mode !== 'QUOTE' (must be 'DIRECT' or 'CONFIGURABLE')
 * 5. valid, non-empty slug is mandatory (ID alone is not enough for Shop deep-link)
 */
export function isProductShopEligible(
  product?: Product | ShopBridgeProductCandidate | null,
  options?: ShopBridgeOptions
): boolean {
  if (!product) return false

  const candidate = product as ShopBridgeProductCandidate

  // 1. Global / Product Commerce Enabled check
  if (options?.commerce_enabled === false || candidate.commerce_enabled === false) {
    return false
  }

  // 2. Buyable check
  if (candidate.buyable !== true) return false

  // 3. Sale Enabled check
  if (candidate.sale_enabled !== true) return false

  // 4. Sales Mode check (must be DIRECT or CONFIGURABLE)
  const salesMode = (candidate.sales_mode || 'NONE').toUpperCase().trim()
  if (salesMode === 'NONE' || salesMode === 'QUOTE') return false
  if (salesMode !== 'DIRECT' && salesMode !== 'CONFIGURABLE') return false

  // 5. Valid Slug check (ID alone is strictly insufficient)
  const slug = extractProductSlug(candidate)
  return Boolean(slug)
}

/**
 * Generates the direct deep-link URL to the product detail page on BİRİM SHOP.
 * Returns null if no valid slug can be extracted, preventing broken or malformed URLs.
 */
export function getShopProductUrl(
  productOrSlug?: Product | ShopBridgeProductCandidate | string | null
): string | null {
  const slug = extractProductSlug(productOrSlug)
  if (!slug) return null

  const baseUrl = getShopBaseUrl()
  return `${baseUrl}/product/${slug}`
}

/**
 * Returns the appropriate CTA label for the product in the given locale.
 */
export function getShopCtaLabel(
  product?: Product | ShopBridgeProductCandidate | null,
  locale: string = 'tr',
  variant: 'card' | 'pdp' = 'card'
): string {
  const isTr = locale.toLowerCase().startsWith('tr')
  const salesMode = ((product as ShopBridgeProductCandidate)?.sales_mode || 'NONE')
    .toUpperCase()
    .trim()

  if (variant === 'pdp') {
    if (salesMode === 'DIRECT') {
      return isTr ? "Shop'ta Satın Al" : 'Buy in Shop'
    }
    return isTr ? "Shop'ta Gör" : 'View in Shop'
  }

  // Card variant
  return isTr ? "Shop'ta Gör" : 'View in Shop'
}
