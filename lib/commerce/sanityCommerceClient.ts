import type {LocalizedString, SalesMode} from '../../src/types.js'

export interface AuthoritativeVariant {
  id: string
  title?: LocalizedString
  sku?: string
  price?: number
  currency?: string
  options?: Array<{name: string; value: string}>
  enabled?: boolean
}

export interface AuthoritativeProduct {
  id: string
  name: LocalizedString
  buyable?: boolean
  sale_enabled?: boolean
  sales_mode?: SalesMode
  price?: number
  currency?: string
  sku?: string
  stockStatus?: string
  variants?: AuthoritativeVariant[]
}

export interface AuthoritativeCatalogBatch {
  commerce_enabled: boolean
  products: AuthoritativeProduct[]
}

function getSanityConfig() {
  const projectId =
    process.env['SANITY_PROJECT_ID'] || process.env['VITE_SANITY_PROJECT_ID'] || 'wn3a082f'
  const dataset =
    process.env['SANITY_DATASET'] || process.env['VITE_SANITY_DATASET'] || 'production'
  const apiVersion =
    process.env['SANITY_API_VERSION'] || process.env['VITE_SANITY_API_VERSION'] || '2025-01-01'

  return {projectId, dataset, apiVersion}
}

/**
 * Server-authoritative batch catalog query.
 * Retrieves siteSettings.commerce_enabled and requested products in a single GROQ roundtrip.
 */
export async function fetchAuthoritativeCatalogBatch(
  productIds: string[]
): Promise<AuthoritativeCatalogBatch> {
  const {projectId, dataset, apiVersion} = getSanityConfig()

  const query = `
    {
      "settings": *[_type == "siteSettings" && !(_id in path("drafts.**"))] | order(_updatedAt desc)[0]{
        "commerce_enabled": coalesce(commerce_enabled, false)
      },
      "products": *[_type == "product" && (id.current in $productIds || _id in $productIds || id in $productIds)]{
        "id": coalesce(id.current, id, _id),
        name,
        buyable,
        "sale_enabled": coalesce(sale_enabled, false),
        "sales_mode": coalesce(sales_mode, "NONE"),
        price,
        currency,
        sku,
        stockStatus,
        variants[]{
          id,
          title,
          sku,
          price,
          currency,
          options[]{ name, value },
          "enabled": coalesce(enabled, true)
        }
      }
    }
  `

  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`)
  url.searchParams.set('query', query)
  url.searchParams.set('$productIds', JSON.stringify(productIds))
  url.searchParams.set('returnQuery', 'false')

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`[Commerce Sanity Client] HTTP ${response.status} failed to fetch catalog data`)
  }

  const json = (await response.json()) as {
    result?: {
      settings?: {commerce_enabled?: boolean}
      products?: AuthoritativeProduct[]
    }
  }

  const commerce_enabled = Boolean(json.result?.settings?.commerce_enabled ?? false)
  const products = Array.isArray(json.result?.products) ? json.result.products : []

  return {
    commerce_enabled,
    products,
  }
}
