import {useQuery} from '@tanstack/react-query'
import {getCategories} from '@/services/cms'

/**
 * Tüm kategorileri getir
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 15 * 60 * 1000, // 15 dakika - kategoriler çok az değişir
    gcTime: 30 * 60 * 1000, // 30 dakika - uzun süre cache'de tut
    refetchOnMount: false, // Kategoriler çok az değiştiği için mount'ta refetch yapma
  })
}

/**
 * ID'ye göre kategori getir (kategoriler listesinden)
 */
export function useCategory(categoryId: string | undefined) {
  const {data: categories, ...rest} = useCategories()
  
  return {
    ...rest,
    data: categories?.find(c => c.id === categoryId),
  }
}

