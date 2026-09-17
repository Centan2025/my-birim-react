/* eslint-disable @typescript-eslint/no-explicit-any */
import {describe, it, expect} from 'vitest'
import {mapProductRow} from '../services/sanity/products'
import {
  getProductReadiness,
  getCommerceStateDescription,
} from '../../birim-web/utils/productReadiness'

describe('Sanity Catalog Options → Commerce Selection Model Final Consistency', () => {
  const mockLegacyProductRow = {
    id: {current: 'legacy-sofa'},
    name: {tr: 'Klasik Koltuk', en: 'Classic Sofa'},
    year: 2024,
    description: {tr: 'Açıklama', en: 'Description'},
    buyable: true,
    sale_enabled: false,
    sales_mode: 'NONE',
    price: 45000,
    currency: 'TRY',
    sku: 'SOFA-LEGACY-01',
    stockStatus: 'in_stock',
    showMaterials: true,
    dimensionImages: [
      {
        _key: 'dim_leg_1',
        imageR2: {url: 'https://r2.birim.com/dim-1.jpg'},
        title: {tr: '240 x 100 x 75 cm', en: '240 x 100 x 75 cm'},
      },
      {
        _key: 'dim_leg_2',
        imageR2: {url: 'https://r2.birim.com/dim-2.jpg'},
        title: {tr: '280 x 100 x 75 cm', en: '280 x 100 x 75 cm'},
      },
    ],
    materialSelections: [
      {
        _key: 'ms_leg_1',
        group: {
          title: {tr: 'Kumaş', en: 'Fabric'},
          books: [
            {
              title: {tr: 'Luna', en: 'Luna'},
              items: [
                {
                  _key: 'mat_leg_1',
                  name: {tr: '01 Bej', en: '01 Beige'},
                  imageR2: {url: 'luna-01.jpg'},
                },
                {
                  _key: 'mat_leg_2',
                  name: {tr: '02 Gri', en: '02 Grey'},
                  imageR2: {url: 'luna-02.jpg'},
                },
              ],
            },
          ],
        },
        materials: [
          {_key: 'mat_leg_1', name: {tr: '01 Bej', en: '01 Beige'}, imageR2: {url: 'luna-01.jpg'}},
        ],
      },
    ],
    variants: [
      {
        id: 'var-1',
        title: {tr: '240 cm / Bej', en: '240 cm / Beige'},
        sku: 'SOFA-240-BEJ',
        price: 45000,
        currency: 'TRY',
        options: [
          {name: 'SIZE', value: '240'},
          {name: 'COLOR', value: 'Beige'},
        ],
        enabled: true,
      },
    ],
  }

  describe('1. Stock Status Contract & Enum Verification', () => {
    it('accepts only authoritative stockStatus enum values (in_stock, out_of_stock, preorder)', () => {
      const validStatuses = ['in_stock', 'out_of_stock', 'preorder']
      for (const status of validStatuses) {
        const candidate = {
          name: {tr: 'Sandalye'},
          id: 'chair-01',
          category: {_ref: 'cat-chairs'},
          media: [{isCover: true, url: 'img.jpg'}],
          buyable: true,
          sale_enabled: true,
          sales_mode: 'DIRECT',
          price: 12000,
          currency: 'TRY',
          sku: 'CHR-01',
          stockStatus: status,
        }
        const readiness = getProductReadiness(candidate as any)
        expect(readiness.isCommerceReady).toBe(true)
        expect(readiness.status).toBe('READY')
      }
    })

    it('rejects made_to_order as a stockStatus enum value and blocks readiness', () => {
      const candidate = {
        name: {tr: 'Özel Koltuk'},
        id: 'custom-sofa',
        category: {_ref: 'cat-sofas'},
        media: [{isCover: true, url: 'img.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 35000,
        currency: 'TRY',
        sku: 'CUST-01',
        stockStatus: 'made_to_order', // Invalid custom enum
      }
      const readiness = getProductReadiness(candidate as any)
      expect(readiness.isCommerceReady).toBe(false)
      expect(readiness.status).toBe('NEEDS_ATTENTION')
      expect(readiness.blockers.some(b => b.includes('Geçerli bir stok durumu'))).toBe(true)
    })

    it('handles production lead times via leadTimeWeeks rather than mutating stockStatus', () => {
      const candidate = {
        name: {tr: 'Özel Masa'},
        id: 'custom-table',
        category: {_ref: 'cat-tables'},
        media: [{isCover: true, url: 'img.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 50000,
        currency: 'TRY',
        sku: 'TBL-LEAD-01',
        stockStatus: 'preorder',
        leadTimeWeeks: 6,
      }
      const readiness = getProductReadiness(candidate as any)
      expect(readiness.isCommerceReady).toBe(true)
      expect(readiness.status).toBe('READY')
    })
  })

  describe('2. Zero Duplication in Commerce Selections', () => {
    it('maps commerce selections with key references without duplicating authoritative catalog data', () => {
      const enhancedRow = {
        ...mockLegacyProductRow,
        selectedDimensions: [
          {dimensionKey: 'dim_leg_1', enabled: true, sortOrder: 1},
          {dimensionKey: 'dim_leg_2', enabled: false, sortOrder: 2},
        ],
        selectedMaterials: [{materialKey: 'mat_leg_1', enabled: true, sortOrder: 1}],
        variants: [
          {
            id: 'var-enhanced-1',
            sku: 'SOFA-240-BEJ',
            price: 52000,
            currency: 'TRY',
            dimensionKey: 'dim_leg_1',
            materialKey: 'mat_leg_1',
            stockStatus: 'in_stock',
            leadTimeWeeks: 4,
            enabled: true,
            options: [],
          },
        ],
      }

      const product = mapProductRow(enhancedRow as any)
      expect(product.selectedDimensions).toHaveLength(2)
      expect(product.selectedDimensions?.[0].dimensionKey).toBe('dim_leg_1')
      expect(product.selectedDimensions?.[0].enabled).toBe(true)
      expect(product.selectedMaterials).toHaveLength(1)
      expect(product.selectedMaterials?.[0].materialKey).toBe('mat_leg_1')

      // Authoritative catalog data remains intact and separate
      expect(product.dimensionImages).toHaveLength(2)
      expect(product.materials).toHaveLength(1)
    })
  })

  describe('3. Strict Shop Opt-In vs Catalog Availability', () => {
    it('does not expose unselected catalog dimensions/materials to Shop while keeping BİRİM.COM catalog intact', () => {
      const structuredRow = {
        ...mockLegacyProductRow,
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        selectedDimensions: [], // Empty selections in Shop
        selectedMaterials: [], // Empty selections in Shop
      }

      const product = mapProductRow(structuredRow as any)
      // Shop selections are empty (strict opt-in)
      expect(product.selectedDimensions).toEqual([])
      expect(product.selectedMaterials).toEqual([])

      // BİRİM.COM catalog PDP still renders all 2 dimensions and catalog materials
      expect(product.dimensionImages).toHaveLength(2)
      expect(product.materials).toHaveLength(1)
    })
  })

  describe('4. Legacy Compatibility', () => {
    it('preserves legacy configurable products with options array without requiring structured selections', () => {
      const legacyCandidate = {
        name: {tr: 'Eski Model Masa', en: 'Legacy Table'},
        id: {current: 'legacy-table'},
        category: {_ref: 'cat-tables'},
        media: [{isCover: true, url: 'table.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        variants: [
          {
            enabled: true,
            sku: 'LEG-TBL-OAK',
            price: 30000,
            options: [{name: 'FINISH', value: 'Oak'}],
          },
        ],
      }

      const readiness = getProductReadiness(legacyCandidate as any)
      expect(readiness.status).toBe('READY')
      expect(readiness.isCommerceReady).toBe(true)
      expect(readiness.activeVariantsCount).toBe(1)
    })
  })

  describe('5. Broken Key Detection & Catalog Reference Availability', () => {
    it('detects broken dimensionKey and flags "Catalog option reference unavailable" without deleting variant', () => {
      const candidateWithBrokenDim = {
        name: {tr: 'Masa'},
        id: 'table-broken-dim',
        category: {_ref: 'cat-tables'},
        media: [{isCover: true, url: 'table.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        dimensionImages: [{_key: 'dim_valid_1', title: '200 cm'}],
        selectedDimensions: [{dimensionKey: 'dim_valid_1', enabled: true}],
        variants: [
          {
            enabled: true,
            sku: 'TBL-DELETED-DIM',
            price: 45000,
            dimensionKey: 'dim_DELETED_999', // Non-existent in catalog
          },
        ],
      }

      const readiness = getProductReadiness(candidateWithBrokenDim as any)
      expect(readiness.isCommerceReady).toBe(false)
      expect(readiness.status).toBe('NEEDS_ATTENTION')
      expect(readiness.blockers.some(b => b.includes('Catalog option reference unavailable'))).toBe(
        true
      )
    })

    it('detects broken materialKey and flags "Catalog option reference unavailable"', () => {
      const candidateWithBrokenMat = {
        name: {tr: 'Koltuk'},
        id: 'sofa-broken-mat',
        category: {_ref: 'cat-sofas'},
        media: [{isCover: true, url: 'sofa.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        materialSelections: [
          {
            materials: [{_key: 'mat_valid_1', name: 'Bej'}],
          },
        ],
        selectedMaterials: [{materialKey: 'mat_valid_1', enabled: true}],
        variants: [
          {
            enabled: true,
            sku: 'SOFA-DELETED-MAT',
            price: 60000,
            materialKey: 'mat_DELETED_888', // Non-existent in catalog
          },
        ],
      }

      const readiness = getProductReadiness(candidateWithBrokenMat as any)
      expect(readiness.isCommerceReady).toBe(false)
      expect(readiness.status).toBe('NEEDS_ATTENTION')
      expect(readiness.blockers.some(b => b.includes('Catalog option reference unavailable'))).toBe(
        true
      )
    })

    it('blocks readiness when a variant references a dimension disabled in Shop selectedDimensions', () => {
      const candidateWithDisabledShopDim = {
        name: {tr: 'Masa'},
        id: 'table-disabled-dim',
        category: {_ref: 'cat-tables'},
        media: [{isCover: true, url: 'table.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        dimensionImages: [{_key: 'dim_1', title: '200 cm'}],
        selectedDimensions: [
          {dimensionKey: 'dim_1', enabled: false}, // Disabled in Shop
        ],
        variants: [
          {
            enabled: true,
            sku: 'TBL-DISABLED-DIM',
            price: 45000,
            dimensionKey: 'dim_1',
          },
        ],
      }

      const readiness = getProductReadiness(candidateWithDisabledShopDim as any)
      expect(readiness.isCommerceReady).toBe(false)
      expect(readiness.status).toBe('NEEDS_ATTENTION')
      expect(
        readiness.blockers.some(b =>
          b.includes('Shop satış listesinde (selectedDimensions) aktif değil')
        )
      ).toBe(true)
    })
  })

  describe('6. CONFIGURABLE Readiness Requirements', () => {
    it('requires at least 1 valid enabled sellable variant for CONFIGURABLE mode to be READY', () => {
      const candidateNoEnabled = {
        name: {tr: 'Sehpa'},
        id: 'coffee-table',
        category: {_ref: 'cat-tables'},
        media: [{isCover: true, url: 'table.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'CONFIGURABLE',
        stockStatus: 'in_stock',
        variants: [
          {
            enabled: false, // Inactive
            sku: 'COF-TBL-01',
            price: 15000,
          },
        ],
      }

      const readiness = getProductReadiness(candidateNoEnabled as any)
      expect(readiness.isCommerceReady).toBe(false)
      expect(readiness.status).toBe('NEEDS_ATTENTION')
      expect(readiness.blockers.some(b => b.includes('en az bir aktif (enabled) varyant'))).toBe(
        true
      )
    })
  })

  describe('7. DIRECT Products Semantics', () => {
    it('evaluates DIRECT products without requiring selectedDimensions or selectedMaterials', () => {
      const directCandidate = {
        name: {tr: 'Ayna', en: 'Mirror'},
        id: 'minimal-mirror',
        category: {_ref: 'cat-accessories'},
        media: [{isCover: true, url: 'mirror.jpg'}],
        buyable: true,
        sale_enabled: true,
        sales_mode: 'DIRECT',
        price: 8500,
        currency: 'TRY',
        sku: 'MIR-01',
        stockStatus: 'in_stock',
      }

      const readiness = getProductReadiness(directCandidate as any)
      expect(readiness.isCommerceReady).toBe(true)
      expect(readiness.status).toBe('READY')
      expect(readiness.blockers).toHaveLength(0)
    })
  })

  describe('8. Diagnostic Descriptions', () => {
    it('returns clear diagnostic state descriptions for all sales modes', () => {
      expect(
        getCommerceStateDescription({buyable: true, sale_enabled: true, sales_mode: 'DIRECT'})
      ).toBe('Ürün doğrudan satışa açıktır.')
      expect(
        getCommerceStateDescription({buyable: true, sale_enabled: true, sales_mode: 'CONFIGURABLE'})
      ).toBe('Geçerli varyantlar tamamlandığında ürün satın alınabilir.')
      expect(
        getCommerceStateDescription({buyable: true, sale_enabled: false, sales_mode: 'DIRECT'})
      ).toBe('Ürün e-ticarete uygundur ancak satış şu anda kapalıdır.')
      expect(
        getCommerceStateDescription({buyable: true, sale_enabled: true, sales_mode: 'QUOTE'})
      ).toBe('Bu ürün teklif talebi ile yönetilir; doğrudan satın alma yapılmaz.')
    })
  })
})
