/**
 * BİRİM SHOP — SAFE STAGING FIXTURE GENERATOR
 *
 * SAFETY RULES:
 * 1. MUST NEVER run on 'production' dataset.
 * 2. Only writes to 'staging' dataset.
 * 3. Reads reference dependencies from production (read-only) and clones them to staging.
 * 4. Generates deterministic test fixtures (CONFIGURABLE, DIRECT, QUOTE, NONE).
 * 5. Idempotent: Uses stable IDs so multiple runs do not create duplicates.
 */

import fs from 'fs'
import path from 'path'

export interface FixtureConfig {
  projectId: string
  sourceDataset: string
  targetDataset: string
  apiVersion: string
  token?: string
}

export const DEFAULT_CONFIG: FixtureConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f',
  sourceDataset: 'production',
  targetDataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'staging',
  apiVersion: process.env.SANITY_API_VERSION || process.env.VITE_SANITY_API_VERSION || '2025-01-01',
  token: process.env.SANITY_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN,
}

/**
 * HARD SAFETY GUARD (Layer 1 & Layer 2)
 * Throws immediately if dataset is not strictly and explicitly 'staging'
 */
export function assertSafeStagingDataset(dataset?: string | null): asserts dataset is string {
  if (!dataset || typeof dataset !== 'string' || !dataset.trim()) {
    throw new Error(
      `\n============================================================\n` +
        `[CRITICAL SAFETY VIOLATION] Target dataset is empty or undefined!\n` +
        `You MUST explicitly specify dataset="staging". Fixture scripts will not default to production.\n` +
        `============================================================\n`
    )
  }

  const normalized = dataset.trim().toLowerCase()

  if (normalized === 'production') {
    throw new Error(
      `\n============================================================\n` +
        `[CRITICAL SAFETY VIOLATION] ATTEMPTED WRITE TO PRODUCTION DATASET!\n` +
        `Fixture generation is strictly prohibited on '${dataset}'.\n` +
        `You MUST set SANITY_DATASET=staging or VITE_SANITY_DATASET=staging.\n` +
        `============================================================\n`
    )
  }

  if (normalized !== 'staging') {
    throw new Error(
      `[SAFETY GUARD] Unsupported target dataset '${dataset}'. Only 'staging' is permitted for test fixtures.`
    )
  }
}

/**
 * READ CLIENT: Read-only fetcher from production CDN
 * NEVER accepts write tokens or mutation payloads.
 */
export async function productionReadClient<T>(
  projectId: string,
  sourceDataset: string,
  apiVersion: string,
  query: string
): Promise<T> {
  const url = new URL(
    `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${sourceDataset}`
  )
  url.searchParams.set('query', query)

  const res = await fetch(url.toString(), {
    headers: {Accept: 'application/json'},
  })

  if (!res.ok) {
    throw new Error(
      `Failed to query Sanity dataset '${sourceDataset}': ${res.status} ${res.statusText}`
    )
  }

  const json = (await res.json()) as {result: T}
  return json.result
}

/**
 * WRITE CLIENT: Executes a Sanity mutation transaction strictly against staging dataset
 * SECOND-LAYER DEFENSE IN DEPTH: Invariant check immediately before network mutation dispatch.
 */
export async function stagingWriteClient(
  projectId: string,
  targetDataset: string,
  apiVersion: string,
  token: string,
  mutations: Array<Record<string, unknown>>
): Promise<void> {
  // Second-layer runtime invariant check
  assertSafeStagingDataset(targetDataset)

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${targetDataset}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({mutations}),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Sanity staging mutation failed (${res.status}): ${errText}`)
  }
}

/**
 * Builds test fixtures and clones required references into staging
 */
export async function generateShopTestFixtures(config: FixtureConfig = DEFAULT_CONFIG) {
  console.log('--- BİRİM SHOP: SAFE STAGING FIXTURE SETUP ---')
  console.log(`Target Dataset: ${config.targetDataset}`)
  console.log(`Source Read Dataset: ${config.sourceDataset}`)

  // 1. First-Layer Entry Safety Guard Check
  assertSafeStagingDataset(config.targetDataset)
  console.log('✅ Safety verification passed: Target is strictly staging.')

  // 2. Fetch Reference Dependencies from Production (Read-only)
  console.log(
    '📥 Reading categories, designers, and material groups from production (READ-ONLY)...'
  )

  const query = `{
    "categories": *[_type == "category" && !(_id in path("drafts.**"))][0..5]{
      _id,
      _type,
      id,
      name,
      heroImageR2
    },
    "designers": *[_type == "designer" && !(_id in path("drafts.**"))][0..5]{
      _id,
      _type,
      id,
      name,
      portraitR2
    },
    "materialGroups": *[_type == "materialGroup" && !(_id in path("drafts.**"))]{
      _id,
      _type,
      title,
      books[]{
        _key,
        title,
        items[]{
          _key,
          name,
          imageR2
        }
      }
    }
  }`

  interface SeedSource {
    categories: Array<Record<string, unknown>>
    designers: Array<Record<string, unknown>>
    materialGroups: Array<Record<string, unknown>>
  }

  const sourceData = await productionReadClient<SeedSource>(
    config.projectId,
    config.sourceDataset,
    config.apiVersion,
    query
  )

  console.log(
    `Fetched ${sourceData.categories?.length || 0} categories, ${sourceData.designers?.length || 0} designers, ${sourceData.materialGroups?.length || 0} material groups.`
  )

  // Pick or fallback referenced documents
  const sofaCategory = (sourceData.categories?.find(
    c => (c.id as Record<string, string>)?.current === 'kanepeler'
  ) ||
    sourceData.categories?.[0] || {
      _id: '4EJxGkidAvbDvq7TYDRQF4',
      _type: 'category',
      id: {_type: 'slug', current: 'kanepeler'},
      name: {_type: 'localizedString', tr: 'KANEPELER', en: 'SOFAS'},
    }) as Record<string, unknown> & {_id: string}

  const armchairCategory = (sourceData.categories?.find(
    c => (c.id as Record<string, string>)?.current === 'tekli-ler'
  ) ||
    sourceData.categories?.[1] || {
      _id: '3MWM9PcfWwBrFzwRLdQvfX',
      _type: 'category',
      id: {_type: 'slug', current: 'tekli-ler'},
      name: {_type: 'localizedString', tr: 'TEKLİLER', en: 'ARMCHAIRS'},
    }) as Record<string, unknown> & {_id: string}

  const primaryDesigner = (sourceData.designers?.find(d =>
    ((d.id as Record<string, string>)?.current || '').includes('birim')
  ) ||
    sourceData.designers?.[0] || {
      _id: '3MWM9PcfWwBrFzwRLdQT5n',
      _type: 'designer',
      id: {_type: 'slug', current: 'tasarimci-birim-dessign-studio'},
      name: {_type: 'localizedString', tr: 'BIRIM DESIGN STUDIO', en: 'BIRIM DESIGN STUDIO'},
    }) as Record<string, unknown> & {_id: string}

  const secondaryDesigner = (sourceData.designers?.find(d =>
    ((d.id as Record<string, string>)?.current || '').includes('tanju')
  ) ||
    sourceData.designers?.[1] || {
      _id: 'PBmZKgD0TypOug6iXTRBDn',
      _type: 'designer',
      id: {_type: 'slug', current: 'tasarimci-tanju-ozelgin'},
      name: {_type: 'localizedString', tr: 'TANJU ÖZELGİN', en: 'TANJU ÖZELGİN'},
    }) as Record<string, unknown> & {_id: string}

  // Harvest real swatches from material groups
  const fabricGroup = (sourceData.materialGroups?.find(
    g =>
      ((g.title as Record<string, string>)?.tr || '').toLowerCase().includes('kumaş') ||
      ((g.title as Record<string, string>)?.en || '').toLowerCase().includes('fabric')
  ) || sourceData.materialGroups?.[0]) as
    | (Record<string, unknown> & {
        _id: string
        books?: Array<{
          items?: Array<{
            _key: string
            name?: Record<string, string>
            imageR2?: Record<string, unknown>
          }>
        }>
      })
    | undefined
  const leatherGroup = (sourceData.materialGroups?.find(
    g =>
      ((g.title as Record<string, string>)?.tr || '').toLowerCase().includes('deri') ||
      ((g.title as Record<string, string>)?.en || '').toLowerCase().includes('leather')
  ) || sourceData.materialGroups?.[1]) as (Record<string, unknown> & {_id: string}) | undefined

  const swatch1 = fabricGroup?.books?.[0]?.items?.[0] || {
    _key: 'swatch-luna-beige',
    name: {_type: 'localizedString', tr: 'Luna Beige', en: 'Luna Beige'},
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/swatches/luna-beige.webp',
      path: 'test-fixtures/swatches/luna-beige.webp',
      mimeType: 'image/webp',
    },
  }

  const swatch2 = fabricGroup?.books?.[0]?.items?.[1] || {
    _key: 'swatch-luna-grey',
    name: {_type: 'localizedString', tr: 'Luna Grey', en: 'Luna Grey'},
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/swatches/luna-grey.webp',
      path: 'test-fixtures/swatches/luna-grey.webp',
      mimeType: 'image/webp',
    },
  }

  const swatch3 = fabricGroup?.books?.[0]?.items?.[2] || {
    _key: 'swatch-luna-anthracite',
    name: {_type: 'localizedString', tr: 'Luna Anthracite', en: 'Luna Anthracite'},
    imageR2: {
      _type: 'r2Asset',
      url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/swatches/luna-anthracite.webp',
      path: 'test-fixtures/swatches/luna-anthracite.webp',
      mimeType: 'image/webp',
    },
  }

  // 3. Assemble Documents to Upsert into Staging
  const documentsToUpsert: Array<Record<string, unknown>> = []

  // A. Cloned References (ensures zero broken references in staging)
  documentsToUpsert.push({
    ...sofaCategory,
    _id: sofaCategory._id,
  })
  documentsToUpsert.push({
    ...armchairCategory,
    _id: armchairCategory._id,
  })
  documentsToUpsert.push({
    ...primaryDesigner,
    _id: primaryDesigner._id,
  })
  documentsToUpsert.push({
    ...secondaryDesigner,
    _id: secondaryDesigner._id,
  })
  if (fabricGroup) {
    documentsToUpsert.push({
      ...fabricGroup,
      _id: fabricGroup._id,
    })
  }
  if (leatherGroup) {
    documentsToUpsert.push({
      ...leatherGroup,
      _id: leatherGroup._id,
    })
  }

  // B. Product Fixtures

  // FIXTURE 1: CONFIGURABLE SOFA
  const configurableSofa = {
    _id: 'test-shop-configurable-sofa',
    _type: 'product',
    id: {_type: 'slug', current: 'test-shop-configurable-sofa'},
    name: {
      _type: 'localizedString',
      tr: 'SOLO KANEPE [TEST]',
      en: 'SOLO SOFA [TEST]',
    },
    category: {
      _type: 'reference',
      _ref: sofaCategory._id,
    },
    designers: [
      {
        _key: 'des-1',
        _type: 'reference',
        _ref: primaryDesigner._id,
      },
    ],
    year: 2026,
    isPublished: true,
    sortOrder: 1,
    description: {
      _type: 'localizedPortableText',
      tr: [
        {
          _type: 'block',
          _key: 'desc-tr-1',
          children: [
            {
              _type: 'span',
              _key: 'desc-s-1',
              text: 'BİRİM SHOP varyant, ölçü, kartela ve stok senaryolarını test etmek amacıyla oluşturulmuş konfigüre edilebilir test ürünüdür.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      en: [
        {
          _type: 'block',
          _key: 'desc-en-1',
          children: [
            {
              _type: 'span',
              _key: 'desc-s-2',
              text: 'Configurable test product for validating size, material selection, variant pricing, and stock scenarios.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    },
    media: [
      {
        _key: 'm-sofa-cover',
        type: 'image',
        isCover: true,
        imageR2: {
          _type: 'r2Asset',
          alt: 'SOLO SOFA COVER',
          url: 'https://birim-assets.web-birim.workers.dev/migration/products/kn0180-solo/1789122970514-0180_SOLO_01__.webp',
          path: 'migration/products/kn0180-solo/1789122970514-0180_SOLO_01__.webp',
          mimeType: 'image/webp',
          width: 2560,
          height: 1706,
        },
      },
      {
        _key: 'm-sofa-2',
        type: 'image',
        isCover: false,
        imageR2: {
          _type: 'r2Asset',
          alt: 'SOLO SOFA DETAIL',
          url: 'https://birim-assets.web-birim.workers.dev/migration/products/kn0180-solo/1789122818548-0180_SOLO_02-C.webp',
          path: 'migration/products/kn0180-solo/1789122818548-0180_SOLO_02-C.webp',
          mimeType: 'image/webp',
          width: 2560,
          height: 1573,
        },
      },
    ],
    // Commerce Configuration
    buyable: true,
    sale_enabled: true,
    sales_mode: 'CONFIGURABLE',
    stockStatus: 'in_stock',
    leadTimeWeeks: 4,
    // 3 Catalog Dimensions (dim-220, dim-240, dim-280)
    dimensionImages: [
      {
        _key: 'dim-220',
        title: {_type: 'localizedString', tr: '220 x 95 x 75 cm', en: '220 x 95 x 75 cm'},
        imageR2: {
          _type: 'r2Asset',
          alt: '220 Dimension',
          url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/dimensions/solo-220.webp',
          path: 'test-fixtures/dimensions/solo-220.webp',
          mimeType: 'image/webp',
        },
      },
      {
        _key: 'dim-240',
        title: {_type: 'localizedString', tr: '240 x 95 x 75 cm', en: '240 x 95 x 75 cm'},
        imageR2: {
          _type: 'r2Asset',
          alt: '240 Dimension',
          url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/dimensions/solo-240.webp',
          path: 'test-fixtures/dimensions/solo-240.webp',
          mimeType: 'image/webp',
        },
      },
      {
        _key: 'dim-280',
        title: {_type: 'localizedString', tr: '280 x 105 x 75 cm', en: '280 x 105 x 75 cm'},
        imageR2: {
          _type: 'r2Asset',
          alt: '280 Dimension',
          url: 'https://birim-assets.web-birim.workers.dev/test-fixtures/dimensions/solo-280.webp',
          path: 'test-fixtures/dimensions/solo-280.webp',
          mimeType: 'image/webp',
        },
      },
    ],
    // Catalog Material Selection (includes 3 swatches)
    materialSelections: fabricGroup
      ? [
          {
            _key: 'mat-sel-fabric',
            group: {_type: 'reference', _ref: fabricGroup._id},
            materials: [swatch1, swatch2, swatch3],
          },
        ]
      : [],
    // Shop Sellable Selections (Strict Opt-in: only dim-220, dim-240 and swatch1, swatch2)
    selectedDimensions: [
      {
        _key: 'sel-dim-220',
        dimensionKey: 'dim-220',
        enabled: true,
        sortOrder: 1,
      },
      {
        _key: 'sel-dim-240',
        dimensionKey: 'dim-240',
        enabled: true,
        sortOrder: 2,
      },
    ],
    selectedMaterials: [
      {
        _key: 'sel-mat-1',
        materialKey: swatch1._key,
        enabled: true,
        sortOrder: 1,
      },
      {
        _key: 'sel-mat-2',
        materialKey: swatch2._key,
        enabled: true,
        sortOrder: 2,
      },
    ],
    // Variants Matrix with full price/stock scenarios
    variants: [
      {
        _key: 'var-k-1',
        id: 'var-220-beige',
        sku: 'TEST-SOFA-220-BEIGE',
        title: {_type: 'localizedString', tr: '220 cm / Beige', en: '220 cm / Beige'},
        price: 42000,
        currency: 'TRY',
        stockStatus: 'in_stock',
        dimensionKey: 'dim-220',
        materialKey: swatch1._key,
        enabled: true,
        options: [
          {name: 'SIZE', value: '220'},
          {name: 'COLOR', value: swatch1.name?.tr || 'Beige'},
        ],
      },
      {
        _key: 'var-k-2',
        id: 'var-220-grey',
        sku: 'TEST-SOFA-220-GREY',
        title: {_type: 'localizedString', tr: '220 cm / Grey', en: '220 cm / Grey'},
        price: 42000,
        currency: 'TRY',
        stockStatus: 'preorder',
        leadTimeWeeks: 4,
        dimensionKey: 'dim-220',
        materialKey: swatch2._key,
        enabled: true,
        options: [
          {name: 'SIZE', value: '220'},
          {name: 'COLOR', value: swatch2.name?.tr || 'Grey'},
        ],
      },
      {
        _key: 'var-k-3',
        id: 'var-240-beige',
        sku: 'TEST-SOFA-240-BEIGE',
        title: {_type: 'localizedString', tr: '240 cm / Beige', en: '240 cm / Beige'},
        price: 48000,
        currency: 'TRY',
        stockStatus: 'out_of_stock',
        dimensionKey: 'dim-240',
        materialKey: swatch1._key,
        enabled: true,
        options: [
          {name: 'SIZE', value: '240'},
          {name: 'COLOR', value: swatch1.name?.tr || 'Beige'},
        ],
      },
      {
        _key: 'var-k-4',
        id: 'var-240-grey',
        sku: 'TEST-SOFA-240-GREY',
        title: {_type: 'localizedString', tr: '240 cm / Grey', en: '240 cm / Grey'},
        price: 48000,
        currency: 'TRY',
        stockStatus: 'in_stock',
        dimensionKey: 'dim-240',
        materialKey: swatch2._key,
        enabled: true,
        options: [
          {name: 'SIZE', value: '240'},
          {name: 'COLOR', value: swatch2.name?.tr || 'Grey'},
        ],
      },
    ],
  }
  documentsToUpsert.push(configurableSofa)

  // FIXTURE 2: DIRECT CHAIR
  const directChair = {
    _id: 'test-shop-direct-chair',
    _type: 'product',
    id: {_type: 'slug', current: 'test-shop-direct-chair'},
    name: {
      _type: 'localizedString',
      tr: 'FOSSIL BERJER [TEST]',
      en: 'FOSSIL ARMCHAIR [TEST]',
    },
    category: {
      _type: 'reference',
      _ref: armchairCategory._id,
    },
    designers: [
      {
        _key: 'des-2',
        _type: 'reference',
        _ref: secondaryDesigner._id,
      },
    ],
    year: 2026,
    isPublished: true,
    sortOrder: 2,
    description: {
      _type: 'localizedPortableText',
      tr: [
        {
          _type: 'block',
          _key: 'desc-tr-chair',
          children: [
            {
              _type: 'span',
              _key: 'desc-sc-1',
              text: 'Doğrudan satış (DIRECT) modunu test etmek için hazırlanmış sabit fiyatlı test ürünü.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      en: [
        {
          _type: 'block',
          _key: 'desc-en-chair',
          children: [
            {
              _type: 'span',
              _key: 'desc-sc-2',
              text: 'Direct purchase mode test fixture with fixed single-item price and SKU.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    },
    media: [
      {
        _key: 'm-chair-cover',
        type: 'image',
        isCover: true,
        imageR2: {
          _type: 'r2Asset',
          alt: 'FOSSIL CHAIR',
          url: 'https://birim-assets.web-birim.workers.dev/migration/products/TK0255-fossil/1789546080938-BM-TT.webp',
          path: 'migration/products/TK0255-fossil/1789546080938-BM-TT.webp',
          mimeType: 'image/webp',
          width: 3894,
          height: 2191,
        },
      },
    ],
    buyable: true,
    sale_enabled: true,
    sales_mode: 'DIRECT',
    price: 18500,
    currency: 'TRY',
    sku: 'TEST-CHAIR-DIRECT-01',
    stockStatus: 'in_stock',
    leadTimeWeeks: 2,
  }
  documentsToUpsert.push(directChair)

  // FIXTURE 3: QUOTE TABLE
  const quoteTable = {
    _id: 'test-shop-quote-table',
    _type: 'product',
    id: {_type: 'slug', current: 'test-shop-quote-table'},
    name: {
      _type: 'localizedString',
      tr: 'RICH MASA [TEST]',
      en: 'RICH TABLE [TEST]',
    },
    category: {
      _type: 'reference',
      _ref: sofaCategory._id,
    },
    designers: [
      {
        _key: 'des-3',
        _type: 'reference',
        _ref: primaryDesigner._id,
      },
    ],
    year: 2026,
    isPublished: true,
    sortOrder: 3,
    description: {
      _type: 'localizedPortableText',
      tr: [
        {
          _type: 'block',
          _key: 'desc-tr-table',
          children: [
            {
              _type: 'span',
              _key: 'desc-st-1',
              text: 'Teklif alma (QUOTE) akışını test etmek için oluşturulmuş özel üretim test ürünü.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      en: [
        {
          _type: 'block',
          _key: 'desc-en-table',
          children: [
            {
              _type: 'span',
              _key: 'desc-st-2',
              text: 'Quote request flow test product for project inquiries.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    },
    media: [
      {
        _key: 'm-table-cover',
        type: 'image',
        isCover: true,
        imageR2: {
          _type: 'r2Asset',
          alt: 'RICH TABLE',
          url: 'https://birim-assets.web-birim.workers.dev/migration/products/kn0175-rich/1789131928269-R_CH__2_.webp',
          path: 'migration/products/kn0175-rich/1789131928269-R_CH__2_.webp',
          mimeType: 'image/webp',
          width: 2560,
          height: 1706,
        },
      },
    ],
    buyable: false,
    sale_enabled: false,
    sales_mode: 'QUOTE',
  }
  documentsToUpsert.push(quoteTable)

  // FIXTURE 4: NONE ACCESSORY
  const noneAccessory = {
    _id: 'test-shop-none-object',
    _type: 'product',
    id: {_type: 'slug', current: 'test-shop-none-object'},
    name: {
      _type: 'localizedString',
      tr: 'MINIMA AKSESUAR [TEST]',
      en: 'MINIMA ACCESSORY [TEST]',
    },
    category: {
      _type: 'reference',
      _ref: armchairCategory._id,
    },
    year: 2026,
    isPublished: true,
    sortOrder: 4,
    description: {
      _type: 'localizedPortableText',
      tr: [
        {
          _type: 'block',
          _key: 'desc-tr-none',
          children: [
            {
              _type: 'span',
              _key: 'desc-sn-1',
              text: 'Katalogda sergilenen ancak Shop üzerinden satışa kapalı (NONE) ürün davranışını test eder.',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
      en: [
        {
          _type: 'block',
          _key: 'desc-en-none',
          children: [
            {
              _type: 'span',
              _key: 'desc-sn-2',
              text: 'Catalog-only item with commerce disabled (NONE).',
            },
          ],
          markDefs: [],
          style: 'normal',
        },
      ],
    },
    media: [
      {
        _key: 'm-none-cover',
        type: 'image',
        isCover: true,
        imageR2: {
          _type: 'r2Asset',
          alt: 'MINIMA ACCESSORY',
          url: 'https://birim-assets.web-birim.workers.dev/migration/products/kn0175-rich/1789132407759-R_CH__1___.webp',
          path: 'migration/products/kn0175-rich/1789132407759-R_CH__1___.webp',
          mimeType: 'image/webp',
          width: 2560,
          height: 1706,
        },
      },
    ],
    buyable: false,
    sale_enabled: false,
    sales_mode: 'NONE',
  }
  documentsToUpsert.push(noneAccessory)

  // 4. Output Generated Data / Apply Mutations
  const outDir = path.resolve(process.cwd(), 'dist/staging-fixtures')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true})
  }

  const jsonPath = path.join(outDir, 'staging-fixtures.json')
  const ndjsonPath = path.join(outDir, 'staging-fixtures.ndjson')

  fs.writeFileSync(jsonPath, JSON.stringify(documentsToUpsert, null, 2), 'utf-8')
  fs.writeFileSync(
    ndjsonPath,
    documentsToUpsert.map(doc => JSON.stringify(doc)).join('\n'),
    'utf-8'
  )

  console.log(`\n📦 Staging fixture payloads generated successfully:`)
  console.log(`- JSON: ${jsonPath}`)
  console.log(`- NDJSON: ${ndjsonPath}`)
  console.log(
    `Total documents: ${documentsToUpsert.length} (Dependencies: ${documentsToUpsert.length - 4}, Test Products: 4)`
  )

  if (config.token) {
    console.log(
      `\n🚀 Write token detected. Applying mutations to '${config.targetDataset}' dataset via stagingWriteClient...`
    )
    const mutations = documentsToUpsert.map(doc => ({
      createOrReplace: doc,
    }))
    await stagingWriteClient(
      config.projectId,
      config.targetDataset,
      config.apiVersion,
      config.token,
      mutations
    )
    console.log(
      `🎉 Successfully written all fixtures to '${config.targetDataset}' dataset in Sanity!`
    )
  } else {
    console.log(`\nℹ️  No write SANITY_TOKEN provided in environment.`)
    console.log(`To import manually into staging, execute:`)
    console.log(`   npx sanity dataset import "${ndjsonPath}" staging --replace\n`)
  }

  return {
    success: true,
    targetDataset: config.targetDataset,
    documentCount: documentsToUpsert.length,
    jsonPath,
    ndjsonPath,
  }
}

// Auto-run when executed directly via CLI (not in vitest)
if (
  typeof process !== 'undefined' &&
  !process.env.VITEST &&
  process.argv?.[1]?.endsWith('create-shop-test-fixtures.ts')
) {
  generateShopTestFixtures().catch(err => {
    console.error('❌ Fixture generation failed:', err.message)
    process.exit(1)
  })
}
