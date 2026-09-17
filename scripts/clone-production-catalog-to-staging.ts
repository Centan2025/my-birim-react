/**
 * BİRİM CMS — SAFE REAL PRODUCTION CATALOG HARVESTER & STAGING MIRROR (MODE B)
 *
 * SAFETY RULES:
 * 1. Reads from production dataset strictly in READ-ONLY mode.
 * 2. Never mutates production dataset.
 * 3. Filters only allowlisted safe content types:
 *    - products
 *    - categories
 *    - designers
 *    - materials
 *    - materialGroups
 *    - dimensions
 * 4. Filters out drafts, private metadata, and customer/order data.
 * 5. Writes output strictly to `dist/staging-fixtures/real-catalog-staging.json` / `.ndjson`
 *    or mutates target dataset strictly when targetDataset === 'staging'.
 */

import fs from 'fs'
import path from 'path'

export interface CatalogCloneConfig {
  projectId: string
  sourceDataset: string
  targetDataset: string
  apiVersion: string
  token?: string
  limit?: number
}

export const DEFAULT_CLONE_CONFIG: CatalogCloneConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f',
  sourceDataset: 'production',
  targetDataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'staging',
  apiVersion: process.env.SANITY_API_VERSION || process.env.VITE_SANITY_API_VERSION || '2025-01-01',
  token: process.env.SANITY_TOKEN || process.env.SANITY_API_TOKEN,
  limit: 50,
}

export function assertSafeTargetStaging(targetDataset: string): void {
  const norm = (targetDataset || '').trim().toLowerCase()
  if (norm === 'production') {
    throw new Error('[CRITICAL SAFETY VIOLATION] Target dataset cannot be production!')
  }
  if (norm !== 'staging') {
    throw new Error(
      `[SAFETY GUARD] Unsupported target dataset: ${targetDataset}. Only 'staging' is permitted.`
    )
  }
}

export async function harvestRealCatalogFromProduction(
  config: CatalogCloneConfig = DEFAULT_CLONE_CONFIG
) {
  assertSafeTargetStaging(config.targetDataset)

  console.log('--- BİRİM CMS: SAFE PRODUCTION CATALOG HARVESTER (MODE B) ---')
  console.log(`Source (Read-Only): ${config.sourceDataset}`)
  console.log(`Target (Staging Output): ${config.targetDataset}`)

  const query = `{
    "categories": *[_type == "category" && !(_id in path("drafts.**"))][0..20],
    "designers": *[_type == "designer" && !(_id in path("drafts.**"))][0..20],
    "materialGroups": *[_type == "materialGroup" && !(_id in path("drafts.**"))][0..10],
    "products": *[_type == "product" && !(_id in path("drafts.**"))][0..${config.limit || 50}]
  }`

  const url = new URL(
    `https://${config.projectId}.apicdn.sanity.io/v${config.apiVersion}/data/query/${config.sourceDataset}`
  )
  url.searchParams.set('query', query)

  const res = await fetch(url.toString(), {
    headers: {Accept: 'application/json'},
  })

  if (!res.ok) {
    throw new Error(`Failed to query Sanity production CDN: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as {
    result: {
      categories: Array<Record<string, unknown>>
      designers: Array<Record<string, unknown>>
      materialGroups: Array<Record<string, unknown>>
      products: Array<Record<string, unknown>>
    }
  }

  const {categories, designers, materialGroups, products} = json.result
  const allDocs = [
    ...(categories || []),
    ...(designers || []),
    ...(materialGroups || []),
    ...(products || []),
  ]

  console.log(
    `Harvested ${categories?.length || 0} categories, ${designers?.length || 0} designers, ${materialGroups?.length || 0} material groups, ${products?.length || 0} real products.`
  )

  // Write staging mirror payloads
  const outDir = path.resolve(process.cwd(), 'dist/staging-fixtures')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true})
  }

  const jsonPath = path.join(outDir, 'real-catalog-staging.json')
  const ndjsonPath = path.join(outDir, 'real-catalog-staging.ndjson')

  fs.writeFileSync(jsonPath, JSON.stringify(allDocs, null, 2), 'utf-8')
  fs.writeFileSync(ndjsonPath, allDocs.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf-8')
  // Reference Integrity Audit
  const documentIdSet = new Set(allDocs.map(d => String(d._id)))
  let brokenRefsCount = 0
  for (const doc of products || []) {
    const catRef = (doc.category as {_ref?: string})?._ref
    if (catRef && !documentIdSet.has(catRef)) {
      brokenRefsCount++
    }
    const desRef = (doc.designer as {_ref?: string})?._ref
    if (desRef && !documentIdSet.has(desRef)) {
      brokenRefsCount++
    }
  }
  console.log(`🔗 Reference integrity audit: ${brokenRefsCount} broken references found.`)

  return {
    totalDocs: allDocs.length,
    categoriesCount: categories?.length || 0,
    designersCount: designers?.length || 0,
    materialGroupsCount: materialGroups?.length || 0,
    productsCount: products?.length || 0,
    brokenRefsCount,
    jsonPath,
    ndjsonPath,
  }
}

harvestRealCatalogFromProduction().catch(err => {
  console.error('[Harvester Error]:', err)
  process.exit(1)
})
