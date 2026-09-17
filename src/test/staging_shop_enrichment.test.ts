import {describe, it, expect} from 'vitest'
import {
  assertSafeStagingDataset,
  SYNTHETIC_DIMENSIONS,
  SYNTHETIC_SWATCHES,
} from '../../scripts/enrich-staging-shop-catalog'
import {createClient} from '@sanity/client'

describe('BİRİM Shop Staging — Category-Wide Enrichment Safety & Data Integrity', () => {
  describe('1. Safety Guards & Dataset Validation', () => {
    it('rejects "production" across case variations', () => {
      ;['production', 'Production', 'PRODUCTION', ' production '].forEach(target => {
        expect(() => assertSafeStagingDataset(target)).toThrowError(/CRITICAL SAFETY VIOLATION/)
      })
    })

    it('rejects empty, undefined, null, or non-staging inputs', () => {
      ;['', '   ', undefined as any, null as any, 'dev', 'test', 'preview'].forEach(target => {
        expect(() => assertSafeStagingDataset(target)).toThrow()
      })
    })

    it('strictly accepts "staging"', () => {
      expect(() => assertSafeStagingDataset('staging')).not.toThrow()
      expect(() => assertSafeStagingDataset('  staging  ')).not.toThrow()
    })
  })

  describe('2. Synthetic Dimension & Swatch Structures', () => {
    it('defines non-empty dimensions for all target furniture types', () => {
      expect(SYNTHETIC_DIMENSIONS.sofa.length).toBeGreaterThanOrEqual(3)
      expect(SYNTHETIC_DIMENSIONS.armchair.length).toBeGreaterThanOrEqual(2)
      expect(SYNTHETIC_DIMENSIONS.bed.length).toBeGreaterThanOrEqual(3)
      expect(SYNTHETIC_DIMENSIONS.table.length).toBeGreaterThanOrEqual(3)
      expect(SYNTHETIC_DIMENSIONS.chair.length).toBeGreaterThanOrEqual(1)
      expect(SYNTHETIC_DIMENSIONS.coffeeTable.length).toBeGreaterThanOrEqual(2)
      expect(SYNTHETIC_DIMENSIONS.storage.length).toBeGreaterThanOrEqual(2)
      expect(SYNTHETIC_DIMENSIONS.pouf.length).toBeGreaterThanOrEqual(2)
    })

    it('defines realistic fabric, leather, and wood swatches with price deltas', () => {
      expect(SYNTHETIC_SWATCHES.fabric.length).toBe(3)
      expect(SYNTHETIC_SWATCHES.leather.length).toBe(2)
      expect(SYNTHETIC_SWATCHES.wood.length).toBe(3)

      expect(SYNTHETIC_SWATCHES.leather[0].priceDelta).toBeGreaterThan(0)
      expect(SYNTHETIC_SWATCHES.wood[1].priceDelta).toBeGreaterThan(0)
    })
  })

  describe('3. Live Sanity Cloud Staging Reference & Structure Audit', () => {
    const sanity = createClient({
      projectId: 'wn3a082f',
      dataset: 'staging',
      useCdn: false,
      apiVersion: '2025-01-01',
    })

    it('verifies cloud staging counts across all categories', async () => {
      const counts = await sanity.fetch(`{
        "products": count(*[_type == "product"]),
        "categories": count(*[_type == "category"]),
        "designers": count(*[_type == "designer"]),
        "materialGroups": count(*[_type == "materialGroup"])
      }`)

      expect(counts.products).toBeGreaterThanOrEqual(51)
      expect(counts.categories).toBe(10)
      expect(counts.designers).toBe(11)
      expect(counts.materialGroups).toBe(3)
    })

    it('verifies 0 broken references across all products in cloud staging', async () => {
      const allDocs =
        await sanity.fetch(`*[_type in ["product", "category", "designer", "materialGroup"]] {
        _id,
        _type,
        category,
        designer
      }`)

      const idSet = new Set(allDocs.map((d: any) => d._id))
      let brokenCategoryRefs = 0
      let brokenDesignerRefs = 0

      for (const doc of allDocs) {
        if (doc._type === 'product') {
          if (doc.category?._ref && !idSet.has(doc.category._ref)) {
            brokenCategoryRefs++
          }
          if (doc.designer?._ref && !idSet.has(doc.designer._ref)) {
            brokenDesignerRefs++
          }
        }
      }

      expect(brokenCategoryRefs).toBe(0)
      expect(brokenDesignerRefs).toBe(0)
    })

    it('verifies CONFIGURABLE products have valid selectedDimensions, selectedMaterials, and variants in cloud', async () => {
      const configurableProds =
        await sanity.fetch(`*[_type == "product" && sales_mode == "CONFIGURABLE"] {
        _id,
        "name": coalesce(name.tr, name),
        sales_mode,
        selectedDimensions,
        selectedMaterials,
        dimensionImages,
        variants
      }`)

      expect(configurableProds.length).toBeGreaterThanOrEqual(15)
      for (const p of configurableProds) {
        expect(p.selectedDimensions?.length).toBeGreaterThanOrEqual(1)
        expect(p.selectedMaterials?.length).toBeGreaterThanOrEqual(1)
        expect(p.variants?.length).toBeGreaterThanOrEqual(2)

        // Verify every variant has valid SKU, price > 0, currency TRY, dimensionKey, materialKey
        for (const v of p.variants) {
          expect(v.sku).toMatch(/^STG-|^TEST-/)
          expect(v.price).toBeGreaterThan(0)
          expect(v.currency).toBe('TRY')
          expect(v.dimensionKey).toBeDefined()
          expect(v.materialKey).toBeDefined()
          expect(['in_stock', 'preorder', 'out_of_stock']).toContain(v.stockStatus)
        }
      }
    })

    it('verifies DIRECT products have valid fixed price, SKU, and empty variant list in cloud', async () => {
      const directProds = await sanity.fetch(`*[_type == "product" && sales_mode == "DIRECT"] {
        _id,
        "name": coalesce(name.tr, name),
        sales_mode,
        price,
        sku,
        variants
      }`)

      expect(directProds.length).toBeGreaterThanOrEqual(5)
      for (const p of directProds) {
        expect(p.price).toBeGreaterThan(0)
        expect(p.sku).toMatch(/^STG-|^TEST-/)
        expect(p.variants?.length || 0).toBe(0)
      }
    })

    it('verifies QUOTE products have buyable=false in cloud', async () => {
      const quoteProds = await sanity.fetch(`*[_type == "product" && sales_mode == "QUOTE"] {
        _id,
        sales_mode,
        buyable
      }`)

      expect(quoteProds.length).toBeGreaterThanOrEqual(3)
      for (const p of quoteProds) {
        expect(p.buyable).toBe(false)
      }
    })
  })
})
