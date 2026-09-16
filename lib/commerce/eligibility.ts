import {CommerceValidationError} from './types'
import type {AuthoritativeProduct, AuthoritativeVariant} from './sanityCommerceClient'

export interface ValidatedProductAndVariant {
  product: AuthoritativeProduct
  variant?: AuthoritativeVariant
  salesMode: 'DIRECT' | 'CONFIGURABLE'
}

/**
 * Validates whether a product and requested variant are eligible for direct commerce purchase.
 */
export function validateProductAndVariantEligibility(
  product: AuthoritativeProduct | undefined,
  requestedProductId: string,
  requestedVariantId?: string | null
): ValidatedProductAndVariant {
  if (!product) {
    throw new CommerceValidationError(
      404,
      'PRODUCT_NOT_FOUND',
      `Ürün bulunamadı: ${requestedProductId}`,
      {productId: requestedProductId}
    )
  }

  // 1. buyable check
  if (product.buyable !== true) {
    throw new CommerceValidationError(
      409,
      'PRODUCT_NOT_BUYABLE',
      `Ürün satın alınabilir durumda değil: ${product.id}`,
      {productId: product.id}
    )
  }

  // 2. sale_enabled check
  if (product.sale_enabled !== true) {
    throw new CommerceValidationError(
      409,
      'PRODUCT_NOT_FOR_SALE',
      `Ürün online satışa açık değil: ${product.id}`,
      {productId: product.id}
    )
  }

  // 3. sales_mode check
  const salesMode = product.sales_mode || 'NONE'
  if (salesMode === 'NONE') {
    throw new CommerceValidationError(
      409,
      'INVALID_SALES_MODE',
      `Ürün satış modu kapalı (NONE): ${product.id}`,
      {productId: product.id}
    )
  }

  if (salesMode === 'QUOTE') {
    throw new CommerceValidationError(
      409,
      'INVALID_SALES_MODE',
      `Ürün doğrudan online satışa uygun değildir, yalnızca teklif talebi yapılabilir: ${product.id}`,
      {productId: product.id}
    )
  }

  // 4. stockStatus check
  if (product.stockStatus === 'out_of_stock') {
    throw new CommerceValidationError(
      409,
      'PRODUCT_NOT_AVAILABLE',
      `Ürün stokta bulunmamaktadır: ${product.id}`,
      {productId: product.id}
    )
  }

  // 5. Configurable vs Direct validation
  if (salesMode === 'CONFIGURABLE') {
    if (
      !requestedVariantId ||
      typeof requestedVariantId !== 'string' ||
      !requestedVariantId.trim()
    ) {
      throw new CommerceValidationError(
        422,
        'VARIANT_REQUIRED',
        `Konfigüre edilebilir ürün için varyant seçimi zorunludur: ${product.id}`,
        {productId: product.id}
      )
    }

    const trimmedVariantId = requestedVariantId.trim()
    const variants = Array.isArray(product.variants) ? product.variants : []
    const matchedVariant = variants.find(v => v.id === trimmedVariantId)

    if (!matchedVariant) {
      throw new CommerceValidationError(
        404,
        'VARIANT_NOT_FOUND',
        `Seçilen varyant bu ürüne ait bulunamadı: ${trimmedVariantId}`,
        {productId: product.id, variantId: trimmedVariantId}
      )
    }

    if (matchedVariant.enabled === false) {
      throw new CommerceValidationError(
        409,
        'VARIANT_DISABLED',
        `Seçilen varyant satışa kapalıdır: ${trimmedVariantId}`,
        {productId: product.id, variantId: trimmedVariantId}
      )
    }

    return {
      product,
      variant: matchedVariant,
      salesMode: 'CONFIGURABLE',
    }
  }

  if (salesMode === 'DIRECT') {
    // If a variantId was passed for a direct sale product, ensure it doesn't try to cross-match
    if (requestedVariantId) {
      const variants = Array.isArray(product.variants) ? product.variants : []
      const matchedVariant = variants.find(v => v.id === requestedVariantId.trim())
      if (!matchedVariant) {
        throw new CommerceValidationError(
          422,
          'VARIANT_PRODUCT_MISMATCH',
          `Belirtilen varyant bu ürüne ait değildir: ${requestedVariantId}`,
          {productId: product.id, variantId: requestedVariantId}
        )
      }
      if (matchedVariant.enabled === false) {
        throw new CommerceValidationError(
          409,
          'VARIANT_DISABLED',
          `Seçilen varyant satışa kapalıdır: ${requestedVariantId}`,
          {productId: product.id, variantId: requestedVariantId}
        )
      }
      return {
        product,
        variant: matchedVariant,
        salesMode: 'DIRECT',
      }
    }

    return {
      product,
      salesMode: 'DIRECT',
    }
  }

  throw new CommerceValidationError(
    409,
    'INVALID_SALES_MODE',
    `Bilinmeyen satış modu: ${salesMode}`,
    {productId: product.id}
  )
}
