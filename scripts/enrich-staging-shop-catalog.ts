/**
 * BİRİM SHOP STAGING — CATEGORY-WIDE SYNTHETIC ENRICHMENT SCRIPT
 *
 * SAFETY RULES:
 * 1. Strictly prohibited on production dataset.
 * 2. Only targets dataset === 'staging' on project 'wn3a082f'.
 * 3. Never mutates core marketing copy, titles, slugs, images, designers, or categories.
 * 4. Generates deterministic synthetic dimensions, material selections, and variant matrices.
 * 5. Fully idempotent — running multiple times produces deterministic results.
 */

import fs from 'fs'
import path from 'path'

export interface EnrichmentConfig {
  projectId: string
  sourceDataset: string
  targetDataset: string
  apiVersion: string
  token?: string
  maxPerCategory?: number
}

export const DEFAULT_ENRICHMENT_CONFIG: EnrichmentConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f',
  sourceDataset: 'staging',
  targetDataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'staging',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_TOKEN || process.env.SANITY_API_TOKEN,
  maxPerCategory: 6,
}

export function assertSafeStagingDataset(dataset: string): void {
  const norm = (dataset || '').trim().toLowerCase()
  if (!norm || norm === 'production' || norm.includes('prod')) {
    throw new Error(
      `[CRITICAL SAFETY VIOLATION] Target dataset '${dataset}' is invalid or production! Aborting.`
    )
  }
  if (norm !== 'staging') {
    throw new Error(
      `[SAFETY GUARD] Unsupported target dataset: '${dataset}'. Only 'staging' is allowed.`
    )
  }
}

// Standard Furniture Dimensions Data
export const SYNTHETIC_DIMENSIONS = {
  sofa: [
    {
      key: 'dim-sofa-220',
      title: {tr: '220 x 95 x 78 cm', en: '220 x 95 x 78 cm'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-sofa-250',
      title: {tr: '250 x 98 x 78 cm', en: '250 x 98 x 78 cm'},
      priceDelta: 8000,
      sort: 2,
    },
    {
      key: 'dim-sofa-280',
      title: {tr: '280 x 100 x 78 cm', en: '280 x 100 x 78 cm'},
      priceDelta: 16000,
      sort: 3,
    },
  ],
  armchair: [
    {
      key: 'dim-armchair-std',
      title: {tr: '82 x 85 x 80 cm', en: '82 x 85 x 80 cm'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-armchair-wide',
      title: {tr: '92 x 90 x 82 cm', en: '92 x 90 x 82 cm'},
      priceDelta: 4500,
      sort: 2,
    },
  ],
  bed: [
    {
      key: 'dim-bed-160',
      title: {tr: '160 x 200 cm (King)', en: '160 x 200 cm (King)'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-bed-180',
      title: {tr: '180 x 200 cm (Super King)', en: '180 x 200 cm (Super King)'},
      priceDelta: 7500,
      sort: 2,
    },
    {
      key: 'dim-bed-200',
      title: {tr: '200 x 200 cm (Grand King)', en: '200 x 200 cm (Grand King)'},
      priceDelta: 14000,
      sort: 3,
    },
  ],
  table: [
    {
      key: 'dim-table-180',
      title: {tr: '180 x 90 x 75 cm (6 Kişilik)', en: '180 x 90 x 75 cm (6-Seater)'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-table-220',
      title: {tr: '220 x 100 x 75 cm (8 Kişilik)', en: '220 x 100 x 75 cm (8-Seater)'},
      priceDelta: 9000,
      sort: 2,
    },
    {
      key: 'dim-table-260',
      title: {tr: '260 x 110 x 75 cm (10 Kişilik)', en: '260 x 110 x 75 cm (10-Seater)'},
      priceDelta: 18000,
      sort: 3,
    },
  ],
  chair: [
    {
      key: 'dim-chair-std',
      title: {tr: '50 x 55 x 82 cm', en: '50 x 55 x 82 cm'},
      priceDelta: 0,
      sort: 1,
    },
  ],
  coffeeTable: [
    {
      key: 'dim-ct-80',
      title: {tr: '80 x 80 x 38 cm', en: '80 x 80 x 38 cm'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-ct-120',
      title: {tr: '120 x 70 x 38 cm', en: '120 x 70 x 38 cm'},
      priceDelta: 5000,
      sort: 2,
    },
  ],
  storage: [
    {
      key: 'dim-storage-180',
      title: {tr: '180 x 50 x 75 cm (3 Kapaklı)', en: '180 x 50 x 75 cm (3-Door)'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-storage-220',
      title: {tr: '220 x 50 x 75 cm (4 Kapaklı)', en: '220 x 50 x 75 cm (4-Door)'},
      priceDelta: 11000,
      sort: 2,
    },
  ],
  pouf: [
    {
      key: 'dim-pouf-60',
      title: {tr: '60 x 60 x 42 cm', en: '60 x 60 x 42 cm'},
      priceDelta: 0,
      sort: 1,
    },
    {
      key: 'dim-pouf-90',
      title: {tr: '90 x 90 x 42 cm', en: '90 x 90 x 42 cm'},
      priceDelta: 4000,
      sort: 2,
    },
  ],
}

// Swatches for Fabric & Leather
export const SYNTHETIC_SWATCHES = {
  fabric: [
    {key: 'swatch-luna-beige', name: {tr: 'Luna Beige', en: 'Luna Beige'}, priceDelta: 0, sort: 1},
    {key: 'swatch-luna-grey', name: {tr: 'Luna Grey', en: 'Luna Grey'}, priceDelta: 0, sort: 2},
    {
      key: 'swatch-luna-anthracite',
      name: {tr: 'Luna Anthracite', en: 'Luna Anthracite'},
      priceDelta: 2500,
      sort: 3,
    },
  ],
  leather: [
    {
      key: 'swatch-roma-taba',
      name: {tr: 'Roma Taba Deri', en: 'Roma Tan Leather'},
      priceDelta: 9500,
      sort: 1,
    },
    {
      key: 'swatch-roma-black',
      name: {tr: 'Roma Siyah Deri', en: 'Roma Black Leather'},
      priceDelta: 9500,
      sort: 2,
    },
  ],
  wood: [
    {key: 'swatch-wood-oak', name: {tr: 'Doğal Meşe', en: 'Natural Oak'}, priceDelta: 0, sort: 1},
    {
      key: 'swatch-wood-walnut',
      name: {tr: 'Amerikan Ceviz', en: 'American Walnut'},
      priceDelta: 6000,
      sort: 2,
    },
    {
      key: 'swatch-wood-black',
      name: {tr: 'Siyah Meşe', en: 'Black Oak'},
      priceDelta: 3000,
      sort: 3,
    },
  ],
}

export async function enrichStagingCatalog(config: EnrichmentConfig = DEFAULT_ENRICHMENT_CONFIG) {
  assertSafeStagingDataset(config.targetDataset)

  console.log('============================================================')
  console.log('   BİRİM SHOP STAGING — CATEGORY-WIDE COMMERCE ENRICHER    ')
  console.log(`   Target Project: ${config.projectId}`)
  console.log(`   Target Dataset: ${config.targetDataset}`)
  console.log('============================================================\n')

  // Read existing harvested catalog
  const catalogPath = path.resolve(process.cwd(), 'dist/staging-fixtures/real-catalog-staging.json')
  if (!fs.existsSync(catalogPath)) {
    throw new Error(
      `Real catalog staging file not found at ${catalogPath}. Run 'npm run fixtures:catalog:clone' first.`
    )
  }

  const rawDocs: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
  console.log(`Loaded ${rawDocs.length} documents from ${catalogPath}`)

  const categories = rawDocs.filter(d => d._type === 'category')
  const _designers = rawDocs.filter(d => d._type === 'designer')
  const materialGroups = rawDocs.filter(d => d._type === 'materialGroup')
  const products = rawDocs.filter(d => d._type === 'product')

  console.log(`Found ${categories.length} categories and ${products.length} products.`)

  const fabricGroup =
    materialGroups.find(g => (g.title?.tr || g.title || '').toLowerCase().includes('kumaş')) ||
    materialGroups[0]
  const _leatherGroup =
    materialGroups.find(g => (g.title?.tr || g.title || '').toLowerCase().includes('deri')) ||
    materialGroups[1]
  const woodGroup =
    materialGroups.find(g => (g.title?.tr || g.title || '').toLowerCase().includes('ahşap')) ||
    materialGroups[2]

  const enrichedProducts: Array<Record<string, unknown>> = []
  const categoryStats: Array<{
    category: string
    slug: string
    selectedCount: number
    directCount: number
    configurableCount: number
    quoteCount: number
    noneCount: number
    products: Array<{
      name: string
      slug: string
      mode: string
      variantsCount: number
      priceRange: string
    }>
  }> = []

  let totalDimensionsCreated = 0
  let totalVariantsCreated = 0
  let totalDirect = 0
  let totalConfigurable = 0
  let totalQuote = 0
  let totalNone = 0

  for (const cat of categories) {
    const catSlug = cat.id?.current || cat._id
    const catName = cat.name?.tr || cat.name?.en || cat.name || catSlug
    const catProducts = products.filter(p => p.category?._ref === cat._id)

    if (catProducts.length === 0) {
      console.log(`Category '${catName}' (${catSlug}) has 0 products. Skipping.`)
      continue
    }

    const selected = catProducts.slice(0, config.maxPerCategory || 6)
    console.log(
      `\nProcessing Category: ${catName} (${catSlug}) — Selected ${selected.length}/${catProducts.length} products`
    )

    const catStat = {
      category: catName,
      slug: catSlug,
      selectedCount: selected.length,
      directCount: 0,
      configurableCount: 0,
      quoteCount: 0,
      noneCount: 0,
      products: [] as Array<{
        name: string
        slug: string
        mode: string
        variantsCount: number
        priceRange: string
      }>,
    }

    selected.forEach((p, idx) => {
      const prodSlug = p.id?.current || p._id
      const prodName = p.name?.tr || p.name?.en || p.name || prodSlug
      const pCopy = {...p}

      // Determine commerce mode based on category & index
      let salesMode: 'CONFIGURABLE' | 'DIRECT' | 'QUOTE' | 'NONE' = 'CONFIGURABLE'
      let basePrice = 45000
      const skuPrefix = `STG-${catSlug.slice(0, 3).toUpperCase()}-${prodSlug.slice(0, 6).toUpperCase()}`

      let dimDefs = SYNTHETIC_DIMENSIONS.sofa
      let matDefs = [...SYNTHETIC_SWATCHES.fabric, ...SYNTHETIC_SWATCHES.leather.slice(0, 1)]

      if (catSlug.includes('kanepe')) {
        salesMode = idx === 5 ? 'QUOTE' : 'CONFIGURABLE'
        basePrice = 42000 + idx * 5000
        dimDefs = SYNTHETIC_DIMENSIONS.sofa
        matDefs = [...SYNTHETIC_SWATCHES.fabric, ...SYNTHETIC_SWATCHES.leather]
      } else if (catSlug.includes('tekli')) {
        salesMode = idx >= 4 ? 'DIRECT' : 'CONFIGURABLE'
        basePrice = 22000 + idx * 3000
        dimDefs = SYNTHETIC_DIMENSIONS.armchair
        matDefs = [...SYNTHETIC_SWATCHES.fabric, ...SYNTHETIC_SWATCHES.leather.slice(0, 1)]
      } else if (catSlug.includes('yatak')) {
        salesMode = idx === 4 ? 'QUOTE' : 'CONFIGURABLE'
        basePrice = 52000 + idx * 6000
        dimDefs = SYNTHETIC_DIMENSIONS.bed
        matDefs = [...SYNTHETIC_SWATCHES.fabric, ...SYNTHETIC_SWATCHES.leather.slice(0, 1)]
      } else if (catSlug.includes('masa')) {
        salesMode = idx === 3 ? 'QUOTE' : idx === 2 ? 'DIRECT' : 'CONFIGURABLE'
        basePrice = 36000 + idx * 6000
        dimDefs = SYNTHETIC_DIMENSIONS.table
        matDefs = SYNTHETIC_SWATCHES.wood
      } else if (catSlug.includes('sandalye')) {
        salesMode = idx === 0 ? 'CONFIGURABLE' : 'DIRECT'
        basePrice = 16500 + idx * 2000
        dimDefs = SYNTHETIC_DIMENSIONS.chair
        matDefs = SYNTHETIC_SWATCHES.fabric.slice(0, 2)
      } else if (catSlug.includes('sehpa')) {
        salesMode = idx === 0 ? 'CONFIGURABLE' : 'DIRECT'
        basePrice = 18000 + idx * 3500
        dimDefs = SYNTHETIC_DIMENSIONS.coffeeTable
        matDefs = SYNTHETIC_SWATCHES.wood
      } else if (catSlug.includes('depolama')) {
        salesMode = idx === 2 ? 'QUOTE' : 'CONFIGURABLE'
        basePrice = 48000 + idx * 8000
        dimDefs = SYNTHETIC_DIMENSIONS.storage
        matDefs = SYNTHETIC_SWATCHES.wood
      } else if (catSlug.includes('puf')) {
        salesMode = 'CONFIGURABLE'
        basePrice = 12500
        dimDefs = SYNTHETIC_DIMENSIONS.pouf
        matDefs = SYNTHETIC_SWATCHES.fabric.slice(0, 2)
      } else if (catSlug.includes('raf')) {
        salesMode = 'QUOTE'
        basePrice = 32000
      } else {
        salesMode = 'NONE'
      }

      // Update Sales Mode flags
      pCopy.sales_mode = salesMode
      pCopy.buyable = salesMode === 'DIRECT' || salesMode === 'CONFIGURABLE'
      pCopy.sale_enabled = pCopy.buyable
      pCopy.currency = 'TRY'
      pCopy.stockStatus = idx % 3 === 0 ? 'in_stock' : idx % 3 === 1 ? 'preorder' : 'in_stock'
      pCopy.leadTimeWeeks = pCopy.stockStatus === 'preorder' ? 4 + (idx % 4) : 2

      let variantsCount = 0
      let priceDisplay = `${basePrice.toLocaleString('tr-TR')} TRY`

      if (salesMode === 'DIRECT') {
        catStat.directCount++
        totalDirect++
        pCopy.price = basePrice
        pCopy.sku = `${skuPrefix}-DIR`
        pCopy.variants = []
        pCopy.selectedDimensions = []
        pCopy.selectedMaterials = []
      } else if (salesMode === 'CONFIGURABLE') {
        catStat.configurableCount++
        totalConfigurable++

        // 1. Attach Dimension Images
        pCopy.dimensionImages = dimDefs.map(d => ({
          _key: d.key,
          title: d.title,
          imageR2: {
            _type: 'r2Asset',
            alt: d.title.tr,
            url: `https://birim-assets.web-birim.workers.dev/test-fixtures/dimensions/${d.key}.webp`,
            path: `test-fixtures/dimensions/${d.key}.webp`,
            mimeType: 'image/webp',
          },
        }))
        totalDimensionsCreated += dimDefs.length

        // 2. Strict Shop Opt-In Dimensions
        pCopy.selectedDimensions = dimDefs.map(d => ({
          _key: `sel-${d.key}`,
          dimensionKey: d.key,
          enabled: true,
          sortOrder: d.sort,
        }))

        // 3. Strict Shop Opt-In Materials
        pCopy.selectedMaterials = matDefs.map(m => ({
          _key: `sel-${m.key}`,
          materialKey: m.key,
          enabled: true,
          sortOrder: m.sort,
        }))

        // 4. Attach Catalog Material Selection
        const targetGroup =
          catSlug.includes('masa') || catSlug.includes('sehpa') || catSlug.includes('depolama')
            ? woodGroup
            : fabricGroup

        if (targetGroup) {
          pCopy.materialSelections = [
            {
              _key: `mat-sel-${catSlug}`,
              group: {_type: 'reference', _ref: targetGroup._id},
              materials: matDefs.map(m => ({
                _key: m.key,
                name: m.name,
                imageR2: {
                  _type: 'r2Asset',
                  url: `https://birim-assets.web-birim.workers.dev/test-fixtures/swatches/${m.key}.webp`,
                  path: `test-fixtures/swatches/${m.key}.webp`,
                  mimeType: 'image/webp',
                },
              })),
            },
          ]
        }

        // 5. Generate Combinatorial Variant Matrix
        const variants: Array<Record<string, unknown>> = []
        let vIdx = 1
        for (const d of dimDefs) {
          for (const m of matDefs) {
            const vPrice = basePrice + d.priceDelta + m.priceDelta
            const isPreorder = vIdx % 3 === 0
            const isOutOfStock = vIdx % 7 === 0
            const stock = isOutOfStock ? 'out_of_stock' : isPreorder ? 'preorder' : 'in_stock'

            variants.push({
              _key: `var-${vIdx}`,
              id: `var-${d.key}-${m.key}`,
              sku: `${skuPrefix}-${d.key.replace('dim-', '').toUpperCase()}-${m.key.replace('swatch-', '').toUpperCase()}`,
              title: {
                tr: `${d.title.tr} / ${m.name.tr}`,
                en: `${d.title.en} / ${m.name.en}`,
              },
              price: vPrice,
              currency: 'TRY',
              stockStatus: stock,
              leadTimeWeeks: stock === 'preorder' ? 4 : 2,
              dimensionKey: d.key,
              materialKey: m.key,
              enabled: true,
              options: [
                {name: 'DIMENSION', value: d.title.tr},
                {name: 'MATERIAL', value: m.name.tr},
              ],
            })
            vIdx++
          }
        }

        pCopy.variants = variants
        pCopy.price = variants[0]?.price || basePrice
        variantsCount = variants.length
        totalVariantsCreated += variantsCount
        const prices = variants.map(v => v.price)
        priceDisplay = `${Math.min(...prices).toLocaleString('tr-TR')} - ${Math.max(...prices).toLocaleString('tr-TR')} TRY`
      } else if (salesMode === 'QUOTE') {
        catStat.quoteCount++
        totalQuote++
        pCopy.price = undefined
        pCopy.variants = []
        pCopy.selectedDimensions = []
        pCopy.selectedMaterials = []
        priceDisplay = 'Teklif Alın'
      } else {
        catStat.noneCount++
        totalNone++
        pCopy.price = undefined
        pCopy.variants = []
        pCopy.selectedDimensions = []
        pCopy.selectedMaterials = []
        priceDisplay = 'Satışa Kapalı'
      }

      enrichedProducts.push(pCopy)
      catStat.products.push({
        name: prodName,
        slug: prodSlug,
        mode: salesMode,
        variantsCount,
        priceRange: priceDisplay,
      })

      console.log(
        `  -> [${salesMode.padEnd(12)}] ${prodName} (${prodSlug}) | ${priceDisplay} | Variants: ${variantsCount}`
      )
    })

    categoryStats.push(catStat)
  }

  // Preserve non-enriched products as they are
  const enrichedProductIds = new Set(enrichedProducts.map(p => p._id))
  const remainingProducts = products.filter(p => !enrichedProductIds.has(p._id))
  const allStagingDocs = [
    ...categories,
    ...designers,
    ...materialGroups,
    ...enrichedProducts,
    ...remainingProducts,
  ]

  // Save enriched payload
  const outDir = path.resolve(process.cwd(), 'dist/staging-fixtures')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true})
  }

  const jsonOut = path.join(outDir, 'enriched-catalog-staging.json')
  const ndjsonOut = path.join(outDir, 'enriched-catalog-staging.ndjson')

  fs.writeFileSync(jsonOut, JSON.stringify(allStagingDocs, null, 2), 'utf-8')
  fs.writeFileSync(ndjsonOut, allStagingDocs.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf-8')

  // Generate Matrix Markdown Report
  const matrixMarkdown = `# BİRİM SHOP STAGING — CATEGORY COMMERCE ENRICHMENT MATRIX

Generated at: ${new Date().toISOString()}
Target: Sanity Cloud Staging (\`wn3a082f\` / \`staging\`)

## Summary
- **Categories Processed:** ${categoryStats.length}
- **Products Enriched:** ${enrichedProducts.length}
- **Synthetic Dimensions Created:** ${totalDimensionsCreated}
- **Variants Generated:** ${totalVariantsCreated}
- **Sales Mode Distribution:**
  - **CONFIGURABLE:** ${totalConfigurable}
  - **DIRECT:** ${totalDirect}
  - **QUOTE:** ${totalQuote}
  - **NONE:** ${totalNone}

---

${categoryStats
  .map(
    c => `### Category: ${c.category} (\`${c.slug}\`)
- **Selected Products:** ${c.selectedCount} (Configurable: ${c.configurableCount}, Direct: ${c.directCount}, Quote: ${c.quoteCount}, None: ${c.noneCount})

| Product | Slug | Sales Mode | Variants | Price Range |
| :--- | :--- | :--- | :--- | :--- |
${c.products.map(p => `| **${p.name}** | \`${p.slug}\` | \`${p.mode}\` | ${p.variantsCount} | ${p.priceRange} |`).join('\n')}
`
  )
  .join('\n---\n')}
`

  const reportPath = path.resolve(process.cwd(), 'SHOP_STAGING_CATEGORY_MATRIX.md')
  fs.writeFileSync(reportPath, matrixMarkdown, 'utf-8')

  console.log(`\n✅ Enrichment completed successfully!`)
  console.log(`- Enriched docs: ${allStagingDocs.length}`)
  console.log(`- JSON: ${jsonOut}`)
  console.log(`- NDJSON: ${ndjsonOut}`)
  console.log(`- Report: ${reportPath}`)

  return {
    categoriesProcessed: categoryStats.length,
    productsEnriched: enrichedProducts.length,
    totalDimensionsCreated,
    totalVariantsCreated,
    totalDirect,
    totalConfigurable,
    totalQuote,
    totalNone,
    jsonOut,
    ndjsonOut,
    reportPath,
  }
}

if (
  typeof process !== 'undefined' &&
  !process.env.VITEST &&
  process.argv[1]?.endsWith('enrich-staging-shop-catalog.ts')
) {
  enrichStagingCatalog().catch(err => {
    console.error('Fatal error during enrichment:', err)
    process.exit(1)
  })
}
