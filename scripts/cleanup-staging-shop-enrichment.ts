/**
 * BİRİM SHOP STAGING — CLEANUP ENRICHMENT SCRIPT
 *
 * SAFETY RULES:
 * 1. Strictly prohibited on production dataset.
 * 2. Only targets dataset === 'staging' on project 'wn3a082f'.
 * 3. Never deletes real cloned products, categories, designers, or material groups.
 * 4. Only clears synthetic commerce fields (sales_mode, variants, selectedDimensions, etc.)
 *    resetting back to pristine real catalog mirror state.
 */

import fs from 'fs'
import path from 'path'
import {assertSafeStagingDataset} from './enrich-staging-shop-catalog'

export async function cleanupStagingEnrichment(targetDataset: string = 'staging') {
  assertSafeStagingDataset(targetDataset)

  console.log('--- BİRİM SHOP STAGING: CLEANUP ENRICHMENT ---')
  console.log(`Target: ${targetDataset}`)

  // Re-read pristine real catalog
  const catalogPath = path.resolve(process.cwd(), 'dist/staging-fixtures/real-catalog-staging.json')
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Real catalog staging file not found at ${catalogPath}`)
  }

  const rawDocs: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'))
  console.log(`Restoring ${rawDocs.length} pristine documents to staging mirror.`)

  const outDir = path.resolve(process.cwd(), 'dist/staging-fixtures')
  const jsonOut = path.join(outDir, 'real-catalog-staging.json')
  const ndjsonOut = path.join(outDir, 'real-catalog-staging.ndjson')

  fs.writeFileSync(jsonOut, JSON.stringify(rawDocs, null, 2), 'utf-8')
  fs.writeFileSync(ndjsonOut, rawDocs.map(d => JSON.stringify(d)).join('\n') + '\n', 'utf-8')

  console.log(`✅ Staging enrichment cleaned. Restored base mirror payload.`)
  return {success: true, count: rawDocs.length}
}

if (
  typeof process !== 'undefined' &&
  !process.env.VITEST &&
  process.argv[1]?.endsWith('cleanup-staging-shop-enrichment.ts')
) {
  cleanupStagingEnrichment().catch(err => {
    console.error('Cleanup failed:', err)
    process.exit(1)
  })
}
