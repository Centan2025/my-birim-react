/**
 * BİRİM SHOP — SAFE STAGING FIXTURE CLEANUP
 *
 * SAFETY RULES:
 * 1. MUST NEVER run on 'production' dataset.
 * 2. Only purges test documents in 'staging' dataset.
 * 3. Targets ONLY deterministic fixture IDs matching 'test-shop-*'.
 * 4. Preserves cloned shared categories, designers, and material groups as reusable staging baseline.
 */

import fs from 'fs'
import path from 'path'

export interface CleanupConfig {
  projectId: string
  targetDataset: string
  apiVersion: string
  token?: string
}

export const DEFAULT_CLEANUP_CONFIG: CleanupConfig = {
  projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID || 'wn3a082f',
  targetDataset: process.env.SANITY_DATASET || process.env.VITE_SANITY_DATASET || 'staging',
  apiVersion: process.env.SANITY_API_VERSION || process.env.VITE_SANITY_API_VERSION || '2025-01-01',
  token: process.env.SANITY_TOKEN || process.env.SANITY_API_TOKEN || process.env.SANITY_AUTH_TOKEN,
}

export const FIXTURE_IDS_TO_DELETE = [
  'test-shop-configurable-sofa',
  'test-shop-direct-chair',
  'test-shop-quote-table',
  'test-shop-none-object',
  'drafts.test-shop-configurable-sofa',
  'drafts.test-shop-direct-chair',
  'drafts.test-shop-quote-table',
  'drafts.test-shop-none-object',
]

/**
 * HARD SAFETY GUARD
 * Throws immediately if dataset is not strictly 'staging'
 */
export function assertSafeStagingDataset(dataset?: string | null): asserts dataset is string {
  if (!dataset || typeof dataset !== 'string' || !dataset.trim()) {
    throw new Error(
      `\n============================================================\n` +
        `[CRITICAL SAFETY VIOLATION] Target dataset is empty or undefined!\n` +
        `You MUST explicitly specify dataset="staging". Cleanup scripts will not default to production.\n` +
        `============================================================\n`
    )
  }

  const normalized = dataset.trim().toLowerCase()

  if (normalized === 'production') {
    throw new Error(
      `\n============================================================\n` +
        `[CRITICAL SAFETY VIOLATION] ATTEMPTED CLEANUP ON PRODUCTION DATASET!\n` +
        `Cleanup script is strictly prohibited from running on '${dataset}'.\n` +
        `You MUST set SANITY_DATASET=staging or VITE_SANITY_DATASET=staging.\n` +
        `============================================================\n`
    )
  }

  if (normalized !== 'staging') {
    throw new Error(
      `[SAFETY GUARD] Unsupported target dataset '${dataset}'. Only 'staging' is permitted for cleanup.`
    )
  }
}

/**
 * Executes a Sanity mutation transaction against target dataset
 * SECOND-LAYER DEFENSE IN DEPTH: Invariant check before network mutation dispatch.
 */
export async function executeSanityCleanupMutations(
  projectId: string,
  targetDataset: string,
  apiVersion: string,
  token: string,
  mutations: Array<Record<string, unknown>>
): Promise<void> {
  // Invariant verification
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
    throw new Error(`Sanity cleanup mutation failed (${res.status}): ${errText}`)
  }
}

export async function cleanupShopTestFixtures(config: CleanupConfig = DEFAULT_CLEANUP_CONFIG) {
  console.log('--- BİRİM SHOP: SAFE STAGING FIXTURE CLEANUP ---')
  console.log(`Target Dataset: ${config.targetDataset}`)

  // 1. First-Layer Safety Guard Check
  assertSafeStagingDataset(config.targetDataset)
  console.log('✅ Safety verification passed: Target is strictly staging.')

  const mutations = FIXTURE_IDS_TO_DELETE.map(id => ({
    delete: {id},
  }))

  const outDir = path.resolve(process.cwd(), 'dist/staging-fixtures')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true})
  }

  const deleteJsonPath = path.join(outDir, 'cleanup-mutations.json')
  fs.writeFileSync(deleteJsonPath, JSON.stringify(mutations, null, 2), 'utf-8')

  console.log(
    `\nTargeting test fixture IDs for deletion:\n${FIXTURE_IDS_TO_DELETE.map(id => ` - ${id}`).join('\n')}`
  )
  console.log(`\nGenerated cleanup mutations payload: ${deleteJsonPath}`)

  if (config.token) {
    console.log(
      `\n🚀 Write token detected. Executing delete mutations on '${config.targetDataset}'...`
    )
    await executeSanityCleanupMutations(
      config.projectId,
      config.targetDataset,
      config.apiVersion,
      config.token,
      mutations
    )
    console.log(`🎉 Successfully removed all test fixtures from '${config.targetDataset}' dataset!`)
  } else {
    console.log(`\nℹ️  No write SANITY_TOKEN provided in environment.`)
    console.log(`To delete manually using Sanity CLI, execute:`)
    console.log(
      `   npx sanity documents delete ${FIXTURE_IDS_TO_DELETE.join(' ')} --dataset staging\n`
    )
  }

  return {
    success: true,
    targetDataset: config.targetDataset,
    deletedIds: FIXTURE_IDS_TO_DELETE,
  }
}

if (!process.env.VITEST && process.argv[1]?.endsWith('cleanup-shop-test-fixtures.ts')) {
  cleanupShopTestFixtures().catch(err => {
    console.error('❌ Cleanup failed:', err.message)
    process.exit(1)
  })
}
