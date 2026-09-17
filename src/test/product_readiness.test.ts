import {describe, it, expect} from 'vitest'
import {
  getProductReadiness,
  type RawProductCandidate,
} from '../../lib/commerce/product-readiness.js'
import productSchema from '../../birim-web/schemaTypes/documents/product.js'

describe('Product Readiness Engine & Desk Structure (Phase 2)', () => {
  describe('getProductReadiness Calculation', () => {
    it('returns READY for fully configured DIRECT product', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Noma Kanepe', en: 'Noma Sofa'},
        id: {current: 'noma-kanepe'},
        category: {_ref: 'cat-sofa'},
        isPublished: true,
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 125000,
        currency: 'TRY',
        sku: 'NMA-DIR-01',
        stockStatus: 'in_stock',
        media: [{isCover: true, url: 'https://cdn.birim.com/noma.jpg'}],
        description: {tr: 'Açıklama metni'},
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('READY')
      expect(result.isCommerceReady).toBe(true)
      expect(result.blockers.length).toBe(0)
    })

    it('returns NEEDS_ATTENTION when DIRECT product is missing price', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Noma Kanepe', en: 'Noma Sofa'},
        id: {current: 'noma-kanepe'},
        category: {_ref: 'cat-sofa'},
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: undefined,
        currency: 'TRY',
        sku: 'NMA-DIR-01',
        stockStatus: 'in_stock',
        media: [{isCover: true, url: 'https://cdn.birim.com/noma.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('NEEDS_ATTENTION')
      expect(result.isCommerceReady).toBe(false)
      expect(result.blockers.some(b => b.includes('fiyatı'))).toBe(true)
    })

    it('returns NEEDS_ATTENTION when DIRECT product is missing SKU', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Noma Kanepe', en: 'Noma Sofa'},
        id: {current: 'noma-kanepe'},
        category: {_ref: 'cat-sofa'},
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 95000,
        currency: 'TRY',
        sku: '',
        stockStatus: 'in_stock',
        media: [{isCover: true, url: 'https://cdn.birim.com/noma.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('NEEDS_ATTENTION')
      expect(result.isCommerceReady).toBe(false)
      expect(result.blockers.some(b => b.includes('SKU'))).toBe(true)
    })

    it('returns READY for CONFIGURABLE product with at least one active variant', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Mod Koltuk', en: 'Mod Armchair'},
        id: {current: 'mod-koltuk'},
        category: {_ref: 'cat-armchair'},
        isPublished: true,
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        variants: [
          {enabled: true, sku: 'MOD-VAR-01', price: 45000},
          {enabled: false, sku: 'MOD-VAR-02', price: 55000},
        ],
        media: [{isCover: true, url: 'https://cdn.birim.com/mod.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('READY')
      expect(result.isCommerceReady).toBe(true)
      expect(result.blockers.length).toBe(0)
    })

    it('returns NEEDS_ATTENTION for CONFIGURABLE product when all variants are disabled', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Mod Koltuk', en: 'Mod Armchair'},
        id: {current: 'mod-koltuk'},
        category: {_ref: 'cat-armchair'},
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        variants: [
          {enabled: false, sku: 'MOD-VAR-01', price: 45000},
          {enabled: false, sku: 'MOD-VAR-02', price: 55000},
        ],
        media: [{isCover: true, url: 'https://cdn.birim.com/mod.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('NEEDS_ATTENTION')
      expect(result.isCommerceReady).toBe(false)
      expect(result.blockers.some(b => b.includes('aktif (enabled) varyant gereklidir'))).toBe(true)
    })

    it('returns NOT_FOR_SALE when sale_enabled is false', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Mimari Proje Masası'},
        id: {current: 'proje-masasi'},
        category: {_ref: 'cat-table'},
        sale_enabled: false,
        buyable: false,
        media: [{isCover: true, url: 'https://cdn.birim.com/masa.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('NOT_FOR_SALE')
      expect(result.isCommerceReady).toBe(false)
    })

    it('treats missing English name as warning only, not commerce blocker', () => {
      const product: RawProductCandidate = {
        name: {tr: 'Noma Kanepe'}, // name.en missing
        id: {current: 'noma-kanepe'},
        category: {_ref: 'cat-sofa'},
        isPublished: true,
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 125000,
        currency: 'TRY',
        sku: 'NMA-DIR-01',
        stockStatus: 'in_stock',
        media: [{isCover: true, url: 'https://cdn.birim.com/noma.jpg'}],
      }

      const result = getProductReadiness(product)
      expect(result.status).toBe('READY')
      expect(result.isCommerceReady).toBe(true)
      expect(result.warnings.some(w => w.includes('İngilizce'))).toBe(true)
    })
  })

  describe('Product List Preview (productSchema.preview)', () => {
    it('formats DIRECT product preview with Turkish formatted price and SKU', () => {
      const schemaObj = productSchema as {
        preview?: {prepare?: (val: Record<string, unknown>) => {title: string; subtitle?: string}}
      }
      const prepareFn = schemaObj.preview?.prepare
      expect(prepareFn).toBeDefined()

      const preview = prepareFn!({
        name: {tr: 'Noma Kanepe'},
        categoryName: 'Kanepe',
        sales_mode: 'DIRECT',
        price: 125000,
        currency: 'TRY',
        sku: 'NMA-01',
        stockStatus: 'in_stock',
      })

      expect(preview.title).toBe('Noma Kanepe')
      expect(preview.subtitle).toContain('Kanepe')
      expect(preview.subtitle).toContain('DIRECT')
      expect(preview.subtitle).toContain('₺125.000')
      expect(preview.subtitle).toContain('SKU: NMA-01')
      expect(preview.subtitle).toContain('Stokta')
    })

    it('formats CONFIGURABLE product preview with active variant counts without misleading base price', () => {
      const schemaObj = productSchema as {
        preview?: {prepare?: (val: Record<string, unknown>) => {title: string; subtitle?: string}}
      }
      const prepareFn = schemaObj.preview?.prepare
      expect(prepareFn).toBeDefined()

      const preview = prepareFn!({
        name: {tr: 'Mod Koltuk'},
        categoryName: 'Koltuk',
        sales_mode: 'CONFIGURABLE',
        sku: 'MOD-MAIN',
        stockStatus: 'preorder',
        variants: [{enabled: true}, {enabled: true}, {enabled: false}],
      })

      expect(preview.title).toBe('Mod Koltuk')
      expect(preview.subtitle).toContain('CONFIGURABLE (2 Aktif / 3 Varyant)')
      expect(preview.subtitle).toContain('Ön Sipariş')
      expect(preview.subtitle).not.toContain('₺')
    })
  })
})
