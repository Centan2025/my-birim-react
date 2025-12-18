import {useQuery} from '@tanstack/react-query'
import {
  getProducts,
  getProductById,
  getProductsByCategoryId,
  getProductsByDesignerId,
} from '@/services/cms'

/**
 * Tüm ürünleri getir
 */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // 5 dakika - ürünler sık güncellenebilir
    gcTime: 15 * 60 * 1000, // 15 dakika - cache'de tut
    // Stale-while-revalidate: Eski data göster, arka planda yenile
    refetchOnMount: 'always', // Mount'ta her zaman refetch (stale olsa bile)
  })
}

/**
 * ID'ye göre ürün getir
 */
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required')
      const product = await getProductById(productId)
      if (!product) {
        // React Query, queryFn'in undefined döndürmesini sevmiyor; bunun yerine anlamlı bir hata fırlatalım.
        const err = new Error(`Product not found for id "${productId}"`) as Error & {status?: number}
        err.status = 404
        throw err
      }
      return product
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000, // 10 dakika - detay sayfası daha az değişir
    gcTime: 30 * 60 * 1000, // 30 dakika - detay sayfaları daha uzun cache'lenebilir
    refetchOnMount: 'always',
  })
}

/**
 * Kategoriye göre ürünleri getir
 */
export function useProductsByCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'category', categoryId],
    queryFn: () => {
      if (!categoryId) throw new Error('Category ID is required')
      return getProductsByCategoryId(categoryId)
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 15 * 60 * 1000, // 15 dakika
    refetchOnMount: 'always',
  })
}

/**
 * Tasarımcıya göre ürünleri getir
 */
export function useProductsByDesigner(designerId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'designer', designerId],
    queryFn: () => {
      if (!designerId) throw new Error('Designer ID is required')
      return getProductsByDesignerId(designerId)
    },
    enabled: !!designerId,
    staleTime: 5 * 60 * 1000, // 5 dakika
    gcTime: 15 * 60 * 1000, // 15 dakika
    refetchOnMount: 'always',
  })
}

