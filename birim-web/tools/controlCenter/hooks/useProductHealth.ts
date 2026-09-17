import {useState, useEffect, useCallback} from 'react'
import {useClient} from 'sanity'
import {getProductReadiness, type RawProductCandidate} from '../../../utils/productReadiness'
import type {ProductHealthCounts, NeedsAttentionItem} from '../types'

const initialCounts: ProductHealthCounts = {
  readyCount: 0,
  needsAttentionCount: 0,
  inStockCount: 0,
  preorderCount: 0,
  outOfStockCount: 0,
  totalCount: 0,
  needsAttentionItems: [],
}

export function useProductHealth() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [counts, setCounts] = useState<ProductHealthCounts>(initialCounts)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductHealth = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const query = `*[_type == "product" && !(_id in path("drafts.**"))]{
        _id,
        name,
        id,
        slug,
        category,
        isPublished,
        buyable,
        sale_enabled,
        sales_mode,
        price,
        currency,
        sku,
        stockStatus,
        variants,
        media,
        description,
        designers,
        seo
      }`

      const products: RawProductCandidate[] = await client.fetch(query)

      let readyCount = 0
      let needsAttentionCount = 0
      let inStockCount = 0
      let preorderCount = 0
      let outOfStockCount = 0
      const needsAttentionItems: NeedsAttentionItem[] = []

      for (const prod of products) {
        const readiness = getProductReadiness(prod)

        if (readiness.status === 'READY') {
          readyCount++
        } else if (readiness.status === 'NEEDS_ATTENTION' || readiness.status === 'INCOMPLETE') {
          needsAttentionCount++
          if (needsAttentionItems.length < 8) {
            const trName =
              typeof prod.name === 'string'
                ? prod.name
                : typeof prod.name === 'object'
                  ? prod.name?.tr || prod.name?.en || 'İsimsiz Ürün'
                  : 'İsimsiz Ürün'

            needsAttentionItems.push({
              _id: prod._id || '',
              name: typeof prod.name === 'object' ? prod.name : {tr: trName},
              sku: prod.sku || undefined,
              sales_mode: prod.sales_mode,
              issue: readiness.blockers[0] || readiness.warnings[0] || 'Eksik veri',
            })
          }
        }

        const stock = prod.stockStatus
        if (stock === 'in_stock') inStockCount++
        else if (stock === 'preorder') preorderCount++
        else if (stock === 'out_of_stock') outOfStockCount++
      }

      setCounts({
        readyCount,
        needsAttentionCount,
        inStockCount,
        preorderCount,
        outOfStockCount,
        totalCount: products.length,
        needsAttentionItems,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sanity ürün verisi alınamadı'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    fetchProductHealth()
  }, [fetchProductHealth])

  return {
    counts,
    loading,
    error,
    refetch: fetchProductHealth,
  }
}
